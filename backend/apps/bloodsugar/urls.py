from django.urls import path
from .views import BloodSugarLogListCreateView, BloodSugarLogDetailView

urlpatterns = [
    path('logs/', BloodSugarLogListCreateView.as_view(), name='bloodsugar-list'),
    path('logs/<int:pk>/', BloodSugarLogDetailView.as_view(), name='bloodsugar-detail'),
]
