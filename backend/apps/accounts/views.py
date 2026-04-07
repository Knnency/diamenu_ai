import os
from django.db import transaction
from django.db.models.functions import TruncDay
from django.db.models import Count, Avg, F
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import generics, status, parsers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
import google.oauth2.id_token
import google.auth.transport.requests

from .models import User, UserProfile, UserActivity, RegistrationOTP, PasswordResetOTP, SavedRecipe, Review
from .tokens import PasswordResetToken, MFAToken
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, CustomTokenObtainPairSerializer, SavedRecipeSerializer, AdminUserSerializer, ReviewSerializer
from .throttles import OTPSendThrottle, OTPVerifyThrottle
from .permissions import IsSuperUser
import pyotp

# ─── Authentication Views ────────────────────────────────────────────────────

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
            mfa_token_obj = MFAToken.for_user(user)
            mfa_token = str(mfa_token_obj)
            return Response({
                'mfa_required': True,
                'mfa_token': mfa_token,
                'detail': 'MFA verification required'
            }, status=status.HTTP_200_OK)
        
        # Log successful login
        UserActivity.objects.create(user=user, activity_type='login')
            
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """Retrieve or update user profile."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        response = Response(serializer.data)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response

    def put(self, request):
        with transaction.atomic():
            profile, created = UserProfile.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={
                    'diabetes_type': 'Type 2',
                    'dietary_preferences': [],
                    'allergens': []
                }
            )
            
            # 1. Update Name
            name = request.data.get('name')
            if name is not None:
                request.user.name = name.strip()
                request.user.save(update_fields=['name'])
                
            # 2. Handle Profile Picture
            try:
                if 'profile_picture' in request.FILES:
                    request.user.profile_picture = request.FILES['profile_picture']
                    request.user.save(update_fields=['profile_picture'])
                elif 'profile_picture' in request.data and not request.data['profile_picture']:
                    request.user.profile_picture = None
                    request.user.save(update_fields=['profile_picture'])
            except Exception as e:
                print(f"ERROR: Profile picture upload error: {str(e)}")
            
            # 3. Update Profile Settings via Serializer
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
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
        if not email:
            return Response({'detail': 'Google token did not contain an email.'}, status=status.HTTP_400_BAD_REQUEST)
            
        name = id_info.get('name', email.split('@')[0])

        try:
            user, created = User.objects.get_or_create(email=email, defaults={'name': name})
            if created:
                user.set_unusable_password()
                user.save()
                UserProfile.objects.create(user=user)

            refresh = RefreshToken.for_user(user)
            
            # Log successful login
            UserActivity.objects.create(user=user, activity_type='login')

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            })
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            return Response({'detail': f'Server error during Google Login: {str(e)}', 'trace': error_trace}, status=status.HTTP_400_BAD_REQUEST)


# ─── Password Reset via OTP ───────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """Step 1: User submits email → generate OTP and send via Gmail."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPSendThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Always respond with success to prevent email enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'If an account with that email exists, an OTP has been sent.'}, status=status.HTTP_200_OK)

        # Invalidate any previous unused OTPs for this user
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate and save new OTP
        otp_code = PasswordResetOTP.generate_otp()
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # Send email
        try:
            subject = 'DiaMenu — Your Password Reset OTP'
            text_content = (
                f'Hello {user.name},\n\n'
                f'Your one-time password (OTP) to reset your DiaMenu password is: {otp_code}\n\n'
                f'This OTP is valid for 10 minutes. Do not share it with anyone.\n\n'
                f'— The DiaMenu Team'
            )
            html_content = render_to_string('emails/otp_email.html', {
                'name': user.name,
                'otp_code': otp_code,
                'greeting': 'Your one-time password (OTP) to reset your DiaMenu password is:'
            })
            
            msg = EmailMultiAlternatives(
                subject, text_content, settings.DEFAULT_FROM_EMAIL, [email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        except Exception as e:
            return Response(
                {'detail': f'Failed to send OTP email. Please check your email settings. Error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'detail': 'If an account with that email exists, an OTP has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetVerifyOTPView(APIView):
    """Step 2: User submits email + OTP → validates and returns a reset token."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyThrottle]

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
        reset_token_obj = PasswordResetToken.for_user(user)
        reset_token = str(reset_token_obj)

        return Response({'reset_token': reset_token}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Step 3: User submits reset_token + new_password → sets the new password."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        from rest_framework_simplejwt.exceptions import TokenError

        reset_token = request.data.get('reset_token', '').strip()
        new_password = request.data.get('new_password', '')

        if not reset_token or not new_password:
            return Response({'detail': 'reset_token and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = PasswordResetToken(reset_token)
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
    throttle_classes = [OTPSendThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists and is active
        if User.objects.filter(email=email, is_active=True).exists():
            return Response(
                {'detail': 'This email is already registered. Please login instead.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or retrieve temporary user record for OTP (will be activated after verification)
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
            subject = 'DiaMenu — Your Registration Verification Code'
            text_content = (
                f'Hello!\n\n'
                f'Your one-time verification code for DiaMenu registration is: {otp_code}\n\n'
                f'This code is valid for 10 minutes.\n\n'
                f'— The DiaMenu Team'
            )
            html_content = render_to_string('emails/otp_email.html', {
                'name': '!',
                'otp_code': otp_code,
                'greeting': 'Your one-time verification code for DiaMenu registration is:'
            })
            
            msg = EmailMultiAlternatives(
                subject, text_content, settings.DEFAULT_FROM_EMAIL, [email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        except Exception as e:
            return Response(
                {'detail': f'Failed to send verification email. Please check your email settings. Error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'detail': 'Verification code sent successfully.'}, status=status.HTTP_200_OK)


class VerifyRegistrationOTPView(APIView):
    """Verify OTP and complete registration."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyThrottle]

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
        
        # Log successful login
        UserActivity.objects.create(user=user, activity_type='login')

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


class SavedRecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
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
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        from rest_framework_simplejwt.exceptions import TokenError
        
        mfa_token = request.data.get('mfa_token')
        code = request.data.get('code')
        
        if not mfa_token or not code:
            return Response({'detail': 'mfa_token and code are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            token = MFAToken(mfa_token)
            user_id = token['user_id']
            user = User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist, KeyError):
            return Response({'detail': 'Invalid or expired mfa token.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.mfa_enabled:
            return Response({'detail': 'MFA not enabled for this user.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            refresh = RefreshToken.for_user(user)
            
            # Log successful login
            UserActivity.objects.create(user=user, activity_type='login')

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)

# ─── Admin Dashboard CRUD ────────────────────────────────────────────────────────────

class AdminUserListCreateView(generics.ListCreateAPIView):
    """Admin endpoint to list all users or create a new user."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint to retrieve, update, or delete a user."""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]

    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError
        # Prevent admins from deleting themselves
        if instance == self.request.user:
            raise ValidationError("You cannot delete your own account.")
        instance.delete()

# ─── Reviews ──────────────────────────────────────────────────────────────────

class ReviewListCreateView(generics.ListCreateAPIView):
    """List all reviews for the user or create a new review."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminReviewListView(generics.ListAPIView):
    """Admin endpoint to list all reviews for moderation."""
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]

class ReviewStatusToggleView(APIView):
    """Admin endpoint to toggle review approval status."""
    permission_classes = [IsAuthenticated, IsSuperUser]

    def post(self, request, pk):
        try:
            with transaction.atomic():
                review = Review.objects.select_for_update().get(pk=pk)
                review.is_approved = not review.is_approved
                review.save()
                return Response({'status': 'success', 'is_approved': review.is_approved})
        except Review.DoesNotExist:
            return Response({'detail': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Analytics ────────────────────────────────────────────────────────────────

class AdminAnalyticsView(APIView):
    """Admin endpoint for system-wide activity analytics."""
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        total_users = User.objects.count()
        daily_logins = UserActivity.objects.filter(activity_type='login') \
            .annotate(day=TruncDay('timestamp')) \
            .values('day') \
            .annotate(count=Count('id')) \
            .order_by('-day')[:30]
            
        daily_logouts = UserActivity.objects.filter(activity_type='logout') \
            .annotate(day=TruncDay('timestamp')) \
            .values('day') \
            .annotate(count=Count('id')) \
            .order_by('-day')[:30]

        # ─── New: Detailed Recent Activity ──────────────────
        recent_logs = UserActivity.objects.select_related('user').all().order_by('-timestamp')[:50]
        detailed_logs = [{
            'user': log.user.email if log.user else 'Unknown',
            'full_name': log.user.name if log.user else 'System Admin',
            'email': log.user.email if log.user else 'N/A',
            'activity_type': log.activity_type,
            'timestamp': log.timestamp.isoformat()
        } for log in recent_logs]
            
        return Response({
            'total_users': total_users,
            'daily_logins': list(daily_logins),
            'daily_logouts': list(daily_logouts),
            'detailed_logs': detailed_logs
        })

class LogoutView(APIView):
    """Logs the user logout activity and confirms logout."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        UserActivity.objects.create(user=request.user, activity_type='logout')
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass # Ignore if token is invalid or already blacklisted
        return Response({'detail': 'Logged out activity recorded.'})

class CustomTokenRefreshView(TokenRefreshView):
    """
    Handles race conditions where a token might already be blacklisted 
    by a concurrent request during rotation.
    """
    def post(self, request, *args, **kwargs):
        from django.db import IntegrityError
        try:
            return super().post(request, *args, **kwargs)
        except IntegrityError:
            # Handle duplicate key error in token_blacklist_blacklistedtoken
            return Response(
                {"detail": "This token has already been refreshed or blacklisted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except (TokenError, InvalidToken) as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
