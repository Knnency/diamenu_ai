from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import random
import string


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    DIABETES_TYPES = [
        ('Type 1', 'Type 1'),
        ('Type 2', 'Type 2'),
        ('Pre-diabetic', 'Pre-diabetic'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.PositiveIntegerField(null=True, blank=True)
    diabetes_type = models.CharField(max_length=20, choices=DIABETES_TYPES, default='Type 2')
    dietary_preferences = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    diagnosis = models.TextField(blank=True)
    hba1c = models.CharField(max_length=20, blank=True)
    fbs = models.CharField(max_length=20, blank=True)
    total_cholesterol = models.CharField(max_length=20, blank=True)
    medications = models.TextField(blank=True)
    restrictions = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        """OTP is valid if it was created within 10 minutes and has not been used."""
        expiry = self.created_at + timezone.timedelta(minutes=10)
        return not self.is_used and timezone.now() <= expiry

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    def __str__(self):
        return f"OTP for {self.user.email}"


class RegistrationOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registration_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        """OTP is valid if it was created within 10 minutes and has not been used."""
        expiry = self.created_at + timezone.timedelta(minutes=10)
        return not self.is_used and timezone.now() <= expiry

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    def __str__(self):
        return f"Registration OTP for {self.user.email}"


class SavedRecipe(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_recipes')
    title = models.CharField(max_length=200)
    description = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    ingredients = models.JSONField(default=list, blank=True)
    preparation = models.JSONField(default=list, blank=True)
    instructions = models.JSONField(default=list, blank=True)
    servings = models.CharField(max_length=50, default='2 people')
    country = models.CharField(max_length=100, default='Philippines')
    dietary_options = models.JSONField(default=list, blank=True)
    allergies = models.JSONField(default=list, blank=True)
    ingredients_to_avoid = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'title']

    def __str__(self):
        return f"{self.title} - {self.user.email}"
