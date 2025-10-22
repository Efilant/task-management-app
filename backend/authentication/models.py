"""
Authentication models for user profiles and verification tokens.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extended user profile with verification tokens.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    verification_token = models.CharField(max_length=32, blank=True, null=True)
    verification_token_sent_at = models.DateTimeField(blank=True, null=True)
    reset_token = models.CharField(max_length=32, blank=True, null=True)
    reset_token_expires = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def is_reset_token_valid(self):
        """
        Check if reset token is still valid.
        """
        if not self.reset_token or not self.reset_token_expires:
            return False
        return timezone.now() < self.reset_token_expires
    
    def is_verification_token_valid(self):
        """
        Check if verification token is still valid (3 minutes).
        """
        if not self.verification_token or not self.verification_token_sent_at:
            return False
        return timezone.now() < (self.verification_token_sent_at + timezone.timedelta(minutes=3))
