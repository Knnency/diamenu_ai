from django.contrib import admin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'name']
    list_filter = ['is_active', 'is_staff']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'diabetes_type', 'age', 'updated_at']
    search_fields = ['user__email']
