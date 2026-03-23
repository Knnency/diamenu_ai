from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PantryItemViewSet

router = DefaultRouter()
router.register(r'items', PantryItemViewSet, basename='pantry-item')

urlpatterns = [
    path('', include(router.urls)),
]
