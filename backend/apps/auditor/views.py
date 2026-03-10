from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditHistory
from .serializers import AuditHistorySerializer


class AuditHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class = AuditHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuditHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
