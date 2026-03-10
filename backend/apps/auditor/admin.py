from django.contrib import admin
from .models import AuditHistory


@admin.register(AuditHistory)
class AuditHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'safety_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'query']
