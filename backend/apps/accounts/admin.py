from django.contrib import admin
from .models import User, UserProfile, SavedRecipe


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'name']
    list_filter = ['is_active', 'is_staff']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'diabetes_type', 'age', 'updated_at']
    search_fields = ['user__email']


@admin.register(SavedRecipe)
class SavedRecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'servings', 'country', 'created_at', 'tags_count', 'ingredients_count']
    list_filter = ['created_at', 'servings', 'country', 'dietary_options', 'allergies']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Recipe Information', {
            'fields': ('title', 'description', 'tags', 'servings', 'country')
        }),
        ('Recipe Details', {
            'fields': ('ingredients', 'preparation', 'instructions')
        }),
        ('User Preferences', {
            'fields': ('dietary_options', 'allergies', 'ingredients_to_avoid')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    def tags_count(self, obj):
        return len(obj.tags) if obj.tags else 0
    tags_count.short_description = 'Tags'
    
    def ingredients_count(self, obj):
        return len(obj.ingredients) if obj.ingredients else 0
    ingredients_count.short_description = 'Ingredients'
    
    def has_delete_permission(self, request, obj=None):
        # Allow superusers to delete any saved recipe
        if request.user.is_superuser:
            return True
        # Allow users to delete their own saved recipes
        if obj and obj.user == request.user:
            return True
        return False
    
    def has_change_permission(self, request, obj=None):
        # Allow superusers to edit any saved recipe
        if request.user.is_superuser:
            return True
        # Allow users to edit their own saved recipes
        if obj and obj.user == request.user:
            return True
        return False
    
    def has_view_permission(self, request, obj=None):
        # Allow superusers to view any saved recipe
        if request.user.is_superuser:
            return True
        # Allow users to view their own saved recipes
        if obj and obj.user == request.user:
            return True
        return False
