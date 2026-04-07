from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, ProfileView, GoogleLoginView,
    PasswordResetRequestView, PasswordResetVerifyOTPView, PasswordResetConfirmView,
    SendRegistrationOTPView, VerifyRegistrationOTPView,
    SavedRecipeListCreateView, SavedRecipeDetailView,
    MFASetupView, MFAVerifySetupView, MFADisableView, MFALoginVerifyView,
    AdminUserListCreateView, AdminUserDetailView,
    ReviewListCreateView, AdminReviewListView, ReviewStatusToggleView,
    AdminAnalyticsView, LogoutView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('google/', GoogleLoginView.as_view(), name='google-login'),
    path('send-registration-otp/', SendRegistrationOTPView.as_view(), name='send-registration-otp'),
    path('verify-registration-otp/', VerifyRegistrationOTPView.as_view(), name='verify-registration-otp'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/verify-otp/', PasswordResetVerifyOTPView.as_view(), name='password-reset-verify-otp'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('saved-recipes/', SavedRecipeListCreateView.as_view(), name='saved-recipes-list-create'),
    path('saved-recipes/<int:pk>/', SavedRecipeDetailView.as_view(), name='saved-recipe-detail'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify-setup/', MFAVerifySetupView.as_view(), name='mfa-verify-setup'),
    path('mfa/disable/', MFADisableView.as_view(), name='mfa-disable'),
    path('mfa/login-verify/', MFALoginVerifyView.as_view(), name='mfa-login-verify'),
    
    # Admin endpoints
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/reviews/<int:pk>/toggle/', ReviewStatusToggleView.as_view(), name='admin-review-toggle'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    
    # User Review endpoints
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
]
