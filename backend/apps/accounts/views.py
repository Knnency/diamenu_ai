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
import pyotp
import qrcode
import base64
from io import BytesIO
from django.conf import settings
from django.db import transaction
from .models import User, UserProfile, PasswordResetOTP, RegistrationOTP, SavedRecipe
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, CustomTokenObtainPairSerializer, SavedRecipeSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user exists and has verified email through OTP
        email = serializer.validated_data.get('email')
        try:
            user = User.objects.get(email=email)
            # Check if user has a verified registration OTP
            if not RegistrationOTP.objects.filter(user=user, is_used=True).exists():
                return Response({'detail': 'Email verification required. Please verify your email first.'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            # User exists and has verified OTP, update their details
            user.name = serializer.validated_data.get('name')
            user.set_password(serializer.validated_data.get('password'))
            user.is_active = True
            user.save()
        except User.DoesNotExist:
            # User doesn't exist, create new user (fallback for direct registration)
            user = serializer.save()
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(getattr(e, 'detail', str(e)), status=status.HTTP_401_UNAUTHORIZED)
        
        user = serializer.user
        if getattr(user, 'mfa_enabled', False):
            # Generate a short-lived token for MFA verification step
            refresh = RefreshToken.for_user(user)
            mfa_token = str(refresh.access_token)
            return Response({
                'mfa_required': True,
                'mfa_token': mfa_token,
                'detail': 'MFA verification required'
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Use select_related to avoid N+1 queries
        user = User.objects.select_related('profile').get(pk=request.user.pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        # Use select_for_update to prevent race conditions and optimize query
        with transaction.atomic():
            profile, created = UserProfile.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={
                    'diabetes_type': 'Type 2',
                    'dietary_preferences': [],
                    'allergens': []
                }
            )
            
            # Extract and update name if present in the payload
            name = request.data.get('name')
            if name is not None and name.strip() != '':
                request.user.name = name.strip()
                request.user.save(update_fields=['name'])
                
            # Handle profile picture upload
            if 'profile_picture' in request.FILES:
                request.user.profile_picture = request.FILES['profile_picture']
                request.user.save(update_fields=['profile_picture'])
            elif 'profile_picture' in request.data and not request.data['profile_picture']:
                # Allow clearing the picture by sending empty profile_picture
                request.user.profile_picture = None
                request.user.save(update_fields=['profile_picture'])
            
            # Only update changed fields for better performance
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
        # Return the full UserSerializer data to match the GET format
        return Response(UserSerializer(request.user).data)


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


# ─── Registration OTP ────────────────────────────────────────────────────────────

class SendRegistrationOTPView(APIView):
    """Send OTP to user's email for registration verification."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temporary user record for OTP (will be activated after verification)
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': email.split('@')[0], 'is_active': False}
        )

        # Invalidate any previous unused OTPs for this email
        RegistrationOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate and save new OTP
        otp_code = RegistrationOTP.generate_otp()
        RegistrationOTP.objects.create(user=user, otp=otp_code)

        # Send email
        try:
            send_mail(
                subject='DiaMenu — Your Registration Verification Code',
                message=(
                    f'Hello!\n\n'
                    f'Your one-time verification code for DiaMenu registration is:\n\n'
                    f'    {otp_code}\n\n'
                    f'This code is valid for 10 minutes. Please enter it on the registration page to complete your account creation.\n\n'
                    f'If you did not request this registration, you can safely ignore this email.\n\n'
                    f'— The DiaMenu Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to send verification email. Please check your email settings. Error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'detail': 'Verification code sent successfully.'}, status=status.HTTP_200_OK)


class VerifyRegistrationOTPView(APIView):
    """Verify OTP and complete registration."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp', '').strip()

        if not email or not otp_code:
            return Response({'detail': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid verification code or email.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the most recent unused OTP for this user
        otp_obj = RegistrationOTP.objects.filter(user=user, otp=otp_code, is_used=False).first()

        if not otp_obj or not otp_obj.is_valid():
            return Response({'detail': 'Invalid or expired verification code. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used so it can't be replayed
        otp_obj.is_used = True
        otp_obj.save()

        # Activate the user account
        user.is_active = True
        user.save()

        # Generate authentication tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


# ─── Saved Recipes ────────────────────────────────────────────────────────────

class SavedRecipeListCreateView(generics.ListCreateAPIView):
    """List all saved recipes for the authenticated user or create a new saved recipe."""
    serializer_class = SavedRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRecipe.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedRecipeDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a specific saved recipe."""
    serializer_class = SavedRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRecipe.objects.filter(user=self.request.user)


# ─── Multi-Factor Authentication (MFA) ────────────────────────────────────────

class MFASetupView(APIView):
    """Initiates MFA setup by generating a secret and provisioning URI."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        user.save(update_fields=['mfa_secret'])
        
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(name=user.email, issuer_name="DiaMenu")
        
        return Response({
            'secret': secret,
            'otpauth_url': otpauth_url
        })


class MFAVerifySetupView(APIView):
    """Verifies the setup code and enables MFA."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        user = request.user
        
        if not user.mfa_secret:
            return Response({'detail': 'MFA setup not initiated.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            user.mfa_enabled = True
            user.save(update_fields=['mfa_enabled'])
            return Response({'detail': 'MFA enabled successfully.'})
        
        return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)


class MFADisableView(APIView):
    """Disables MFA after verifying the current setup code."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        code = request.data.get('code')
        user = request.user
        
        if not user.mfa_enabled:
            return Response({'detail': 'MFA is not enabled.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            user.mfa_enabled = False
            user.mfa_secret = None
            user.save(update_fields=['mfa_enabled', 'mfa_secret'])
            return Response({'detail': 'MFA disabled successfully.'})
            
        return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)


class MFALoginVerifyView(APIView):
    """Completes login process for MFA-enabled users."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError
        
        mfa_token = request.data.get('mfa_token')
        code = request.data.get('code')
        
        if not mfa_token or not code:
            return Response({'detail': 'mfa_token and code are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            token = AccessToken(mfa_token)
            user_id = token['user_id']
            user = User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist, KeyError):
            return Response({'detail': 'Invalid or expired mfa token.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.mfa_enabled:
            return Response({'detail': 'MFA not enabled for this user.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
