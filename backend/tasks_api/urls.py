"""
Görev API URL'leri.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskAttachmentViewSet

router = DefaultRouter()
# Eklentileri ÖNCE kaydet (daha spesifik route)
router.register(r'attachments', TaskAttachmentViewSet, basename='attachments')
# Görevleri SONRA kaydet (daha az spesifik route)
router.register(r'', TaskViewSet, basename='tasks')

urlpatterns = [
    path('', include(router.urls)),
]
