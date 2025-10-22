"""
URL configuration for taskmanager_project project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .custom_admin import custom_admin_site

urlpatterns = [
    path('admin/', admin.site.urls),  # Standart Django admin
    path('api-admin/', custom_admin_site.urls),  # Custom API admin
    path('api/auth/', include('authentication.urls')),
    path('api/tasks/', include('tasks_api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
