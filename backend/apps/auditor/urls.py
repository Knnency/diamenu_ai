from django.urls import path
from .views import AuditHistoryListCreateView

urlpatterns = [
    path('history/', AuditHistoryListCreateView.as_view(), name='audit-history'),
]
