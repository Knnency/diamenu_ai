from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserProfile, SavedRecipe, Review


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
        fields = ['id', 'email', 'name', 'date_joined', 'profile', 'mfa_enabled', 'profile_picture', 'is_superuser', 'is_staff']


class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'profile', 'mfa_enabled', 'profile_picture', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        UserProfile.objects.create(user=user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class SavedRecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRecipe
        fields = ['id', 'title', 'description', 'image_url', 'tags', 'ingredients', 
                  'preparation', 'instructions', 'servings', 'country',
                  'dietary_options', 'allergies', 'ingredients_to_avoid',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        title = validated_data.get('title')
        
        # 1. Pre-check to provide a clean validation error in most cases
        if SavedRecipe.objects.filter(user=user, title=title).exists():
            raise serializers.ValidationError({"detail": "You have already saved a recipe with this title."})
            
        validated_data['user'] = user
        
        # 2. Catch IntegrityError for rare race conditions during concurrent requests
        from django.db import IntegrityError
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError({"detail": "You have already saved a recipe with this title."})


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.name')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'user_email', 'rating', 'title', 'comment', 'recommend', 'is_approved', 'created_at']
        read_only_fields = ['id', 'user_name', 'user_email', 'is_approved', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
