from django.db import models
from django.conf import settings


class BloodSugarLog(models.Model):
    CONTEXT_CHOICES = [
        ('Fasting', 'Fasting'),
        ('Before Meal', 'Before Meal'),
        ('After Meal', 'After Meal'),
        ('Bedtime', 'Bedtime'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blood_sugar_logs')
    date = models.DateField()
    time = models.TimeField()
    value = models.FloatField(help_text='Blood sugar value in mg/dL')
    context = models.CharField(max_length=20, choices=CONTEXT_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-time']

    def __str__(self):
        return f"{self.user.email} — {self.value} mg/dL on {self.date}"
