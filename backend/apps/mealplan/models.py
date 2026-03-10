from django.db import models
from django.conf import settings


class MealPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meal_plans')
    week_start = models.DateField(help_text='Monday of the planned week')
    plan_data = models.JSONField(help_text='Full 7-day plan keyed by day name')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week_start']
        unique_together = ['user', 'week_start']

    def __str__(self):
        return f"{self.user.email} — week of {self.week_start}"
