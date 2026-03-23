from django.db import models
from django.conf import settings

class PantryItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pantry_items')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.quantity})"
