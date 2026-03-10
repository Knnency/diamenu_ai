import os
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import google.oauth2.id_token
import google.auth.transport.requests
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, UserProfile
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


class PasswordResetRequestView(APIView):
    """Stub endpoint — shows success even if email not found (security best practice)."""
    permission_classes = [AllowAny]

    def post(self, request):
        # TODO: integrate an email backend (e.g. SendGrid) to send real reset links
        return Response(
            {'detail': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK
        )
