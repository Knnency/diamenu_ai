from rest_framework import serializers
from .models import PantryItem

class PantryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PantryItem
        fields = ['id', 'name', 'category', 'quantity', 'created_at']
        read_only_fields = ['id', 'created_at']
