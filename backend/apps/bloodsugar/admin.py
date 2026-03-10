from django.contrib import admin
from .models import BloodSugarLog


@admin.register(BloodSugarLog)
class BloodSugarLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'value', 'context', 'date', 'time']
    list_filter = ['context', 'date']
    search_fields = ['user__email']
