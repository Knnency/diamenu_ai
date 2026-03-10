from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/bloodsugar/', include('apps.bloodsugar.urls')),
    path('api/auditor/', include('apps.auditor.urls')),
    path('api/mealplan/', include('apps.mealplan.urls')),
]
