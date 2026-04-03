from django.urls import path
from .views import (
    EvaluateWeeklyPlanView,
    AuditRecipeView,
    ExtractLabResultsView,
    GenerateImageView,
    RecipeChatView
)

urlpatterns = [
    path('evaluate-plan/', EvaluateWeeklyPlanView.as_view(), name='evaluate-plan'),
    path('audit-recipe/', AuditRecipeView.as_view(), name='audit-recipe'),
    path('extract-labs/', ExtractLabResultsView.as_view(), name='extract-labs'),
    path('generate-image/', GenerateImageView.as_view(), name='generate-image'),
    path('recipe-chat/', RecipeChatView.as_view(), name='recipe-chat'),
]
