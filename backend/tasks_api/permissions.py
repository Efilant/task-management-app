"""
Görev yönetimi için özel izinler.
"""

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Sadece şu kullanıcılara erişim izni veren izin sınıfı:
    - Görevin sahibi
    - Admin kullanıcıları
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin her şeye erişebilir
        if hasattr(request.user, 'profile') and request.user.profile.is_admin:
            return True
        
        # Sahip kendi görevlerine erişebilir
        return obj.user == request.user
    
    def has_permission(self, request, view):
        # Kimlik doğrulaması gerekli
        return request.user and request.user.is_authenticated


class IsAdmin(permissions.BasePermission):
    """
    Sadece admin kullanıcılara erişim izni veren izin sınıfı.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Kullanıcının admin olup olmadığını kontrol et
        if hasattr(request.user, 'profile'):
            return request.user.profile.is_admin
        
        return False
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsOwnerOrReadOnlyAdmin(permissions.BasePermission):
    """
    Şu izinleri veren izin sınıfı:
    - Sahipler görevleriyle ilgili her şeyi yapabilir
    - Admin'ler tüm görevleri okuyabilir
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin her şeyi okuyabilir
        if hasattr(request.user, 'profile') and request.user.profile.is_admin:
            if request.method in permissions.SAFE_METHODS:
                return True
        
        # Sahip her şeyi yapabilir
        return obj.user == request.user
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
