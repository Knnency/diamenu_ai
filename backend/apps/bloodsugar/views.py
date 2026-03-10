from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import BloodSugarLog
from .serializers import BloodSugarLogSerializer


class BloodSugarLogListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodSugarLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BloodSugarLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BloodSugarLogDetailView(generics.DestroyAPIView):
    serializer_class = BloodSugarLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BloodSugarLog.objects.filter(user=self.request.user)
