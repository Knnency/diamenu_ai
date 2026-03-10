from rest_framework import serializers
from .models import AuditHistory


class AuditHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditHistory
        fields = ['id', 'query', 'safety_score', 'result', 'created_at']
        read_only_fields = ['id', 'created_at']
