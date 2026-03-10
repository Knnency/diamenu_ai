from rest_framework import serializers
from .models import MealPlan


class MealPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealPlan
        fields = ['id', 'week_start', 'plan_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
