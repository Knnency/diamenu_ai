from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import MealPlan
from .serializers import MealPlanSerializer
from datetime import date


class MealPlanView(generics.GenericAPIView):
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)

    def get(self, request):
        """Get the most recent meal plan for the authenticated user."""
        plan = self.get_queryset().first()
        if not plan:
            return Response({'week_start': str(date.today()), 'plan_data': {}}, status=status.HTTP_200_OK)
        return Response(MealPlanSerializer(plan).data)

    def post(self, request):
        """Create or update the meal plan for the current week."""
        week_start = request.data.get('week_start', str(date.today()))
        plan, created = MealPlan.objects.update_or_create(
            user=request.user,
            week_start=week_start,
            defaults={'plan_data': request.data.get('plan_data', {})}
        )
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(MealPlanSerializer(plan).data, status=status_code)
