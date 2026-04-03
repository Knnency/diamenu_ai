from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/pantry/', include('apps.pantry.urls')),
    path('api/mealplan/', include('apps.mealplan.urls')),
    path('api/bloodsugar/', include('apps.bloodsugar.urls')),
    path('api/auditor/', include('apps.auditor.urls')),
    path('api/ai/', include('apps.ai.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
