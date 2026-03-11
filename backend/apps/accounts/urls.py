from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, ProfileView, GoogleLoginView,
    PasswordResetRequestView, PasswordResetVerifyOTPView, PasswordResetConfirmView,
    SendRegistrationOTPView, VerifyRegistrationOTPView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('google/', GoogleLoginView.as_view(), name='google-login'),
    path('send-registration-otp/', SendRegistrationOTPView.as_view(), name='send-registration-otp'),
    path('verify-registration-otp/', VerifyRegistrationOTPView.as_view(), name='verify-registration-otp'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/verify-otp/', PasswordResetVerifyOTPView.as_view(), name='password-reset-verify-otp'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

