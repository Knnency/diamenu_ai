from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import PantryItem
from .serializers import PantryItemSerializer

class PantryItemViewSet(viewsets.ModelViewSet):
    serializer_class = PantryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PantryItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
