from rest_framework import serializers
from .models import BloodSugarLog


class BloodSugarLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodSugarLog
        fields = ['id', 'date', 'time', 'value', 'context', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']
