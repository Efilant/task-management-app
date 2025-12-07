"""
Kullanıcı profilleri ve doğrulama token'ları için kimlik doğrulama modelleri.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    """
    Doğrulama token'ları ve rol tabanlı yetkilendirme ile genişletilmiş kullanıcı profili.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user', verbose_name='Rol')
    verification_token = models.CharField(max_length=32, blank=True, null=True)
    verification_token_sent_at = models.DateTimeField(blank=True, null=True)
    reset_token = models.CharField(max_length=32, blank=True, null=True)
    reset_token_expires = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_admin(self):
        """Kullanıcının admin olup olmadığını kontrol et"""
        return self.role == 'admin'
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def is_reset_token_valid(self):
        """
        Sıfırlama token'ının hala geçerli olup olmadığını kontrol et.
        """
        if not self.reset_token or not self.reset_token_expires:
            return False
        return timezone.now() < self.reset_token_expires
    
    def is_verification_token_valid(self):
        """
        Doğrulama token'ının hala geçerli olup olmadığını kontrol et (3 dakika).
        """
        if not self.verification_token or not self.verification_token_sent_at:
            return False
        return timezone.now() < (self.verification_token_sent_at + timezone.timedelta(minutes=3))
