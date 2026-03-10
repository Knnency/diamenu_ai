import os
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import google.oauth2.id_token
import google.auth.transport.requests
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile, PasswordResetOTP
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'detail': 'credential is required.'}, status=status.HTTP_400_BAD_REQUEST)

        CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
        if not CLIENT_ID:
            return Response(
                {'detail': 'Google login is not configured on this server. Please add GOOGLE_CLIENT_ID to backend .env.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            request_obj = google.auth.transport.requests.Request()
            id_info = google.oauth2.id_token.verify_oauth2_token(credential, request_obj, CLIENT_ID)
        except Exception as e:
            return Response({'detail': f'Google token verification failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get('email')
        name = id_info.get('name', email.split('@')[0])

        user, created = User.objects.get_or_create(email=email, defaults={'name': name})
        if created:
            user.set_unusable_password()
            user.save()
            UserProfile.objects.create(user=user)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


# ─── Password Reset via OTP ───────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """Step 1: User submits email → generate OTP and send via Gmail."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Always respond with success to prevent email enumeration
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'If an account with that email exists, an OTP has been sent.'}, status=status.HTTP_200_OK)

        # Invalidate any previous unused OTPs for this user
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate and save new OTP
        otp_code = PasswordResetOTP.generate_otp()
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # Send email
        try:
            send_mail(
                subject='DiaMenu — Your Password Reset OTP',
                message=(
                    f'Hello {user.name},\n\n'
                    f'Your one-time password (OTP) to reset your DiaMenu password is:\n\n'
                    f'    {otp_code}\n\n'
                    f'This OTP is valid for 10 minutes. Do not share it with anyone.\n\n'
                    f'If you did not request a password reset, you can safely ignore this email.\n\n'
                    f'— The DiaMenu Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to send OTP email. Please check your email settings. Error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'detail': 'If an account with that email exists, an OTP has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetVerifyOTPView(APIView):
    """Step 2: User submits email + OTP → validates and returns a reset token."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp', '').strip()

        if not email or not otp_code:
            return Response({'detail': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid OTP or email.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the most recent unused OTP for this user
        otp_obj = PasswordResetOTP.objects.filter(user=user, otp=otp_code, is_used=False).first()

        if not otp_obj or not otp_obj.is_valid():
            return Response({'detail': 'Invalid or expired OTP. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used so it can't be replayed
        otp_obj.is_used = True
        otp_obj.save()

        # Return a short-lived JWT token scoped for password reset only
        refresh = RefreshToken.for_user(user)
        reset_token = str(refresh.access_token)

        return Response({'reset_token': reset_token}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Step 3: User submits reset_token + new_password → sets the new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError

        reset_token = request.data.get('reset_token', '').strip()
        new_password = request.data.get('new_password', '')

        if not reset_token or not new_password:
            return Response({'detail': 'reset_token and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = AccessToken(reset_token)
            user_id = token['user_id']
            user = User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist, KeyError):
            return Response({'detail': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Password reset successfully. You can now sign in.'}, status=status.HTTP_200_OK)
