from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserProfile, SavedRecipe


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['age', 'diabetes_type', 'dietary_preferences', 'allergens',
                  'diagnosis', 'hba1c', 'fbs', 'total_cholesterol', 'medications', 'restrictions', 'updated_at']
    
    def update(self, instance, validated_data):
        # Only update fields that have actually changed
        fields_to_update = []
        for field, value in validated_data.items():
            if getattr(instance, field) != value:
                setattr(instance, field, value)
                fields_to_update.append(field)
        
        # Only save if there are actual changes
        if fields_to_update:
            instance.save(update_fields=fields_to_update)
        
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'name', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'date_joined', 'profile']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class SavedRecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRecipe
        fields = ['id', 'title', 'description', 'tags', 'ingredients', 
                  'preparation', 'instructions', 'servings', 'country',
                  'dietary_options', 'allergies', 'ingredients_to_avoid',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        from django.db import IntegrityError
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError({"detail": "You have already saved a recipe with this title."})
