from django.urls import path
from .views import (
    EvaluateWeeklyPlanView,
    AuditRecipeView,
    ExtractLabResultsView,
    GenerateImageView,
    RecipeChatView,
    CheckTopicView,
    SmartSwapView,
    GenerateHealthAdviceView,
    GenerateGroceryListView
)

urlpatterns = [
    path('evaluate-plan/', EvaluateWeeklyPlanView.as_view(), name='evaluate-plan'),
    path('audit-recipe/', AuditRecipeView.as_view(), name='audit-recipe'),
    path('extract-labs/', ExtractLabResultsView.as_view(), name='extract-labs'),
    path('generate-image/', GenerateImageView.as_view(), name='generate-image'),
    path('recipe-chat/', RecipeChatView.as_view(), name='recipe-chat'),
    path('check-topic/', CheckTopicView.as_view(), name='check-topic'),
    path('smart-swap/', SmartSwapView.as_view(), name='smart-swap'),
    path('health-advice/', GenerateHealthAdviceView.as_view(), name='health-advice'),
    path('grocery-list/', GenerateGroceryListView.as_view(), name='grocery-list'),
]
