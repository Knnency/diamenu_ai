from django.contrib import admin
from .models import MealPlan


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'updated_at']
    search_fields = ['user__email']
