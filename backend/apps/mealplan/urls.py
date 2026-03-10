from django.urls import path
from .views import MealPlanView

urlpatterns = [
    path('', MealPlanView.as_view(), name='mealplan'),
]
