from django.db import models
from django.conf import settings


class AuditHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_history')
    query = models.TextField(help_text='The meal description submitted for auditing')
    safety_score = models.FloatField(null=True, blank=True)
    result = models.JSONField(help_text='Full AuditResult JSON from Gemini')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} — score {self.safety_score} at {self.created_at:%Y-%m-%d %H:%M}"
