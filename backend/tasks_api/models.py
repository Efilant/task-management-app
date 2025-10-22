"""
Task model for the task management application.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Bekleyen'),
        ('in_progress', 'Devam Ediyor'),
        ('completed', 'Tamamlandı'),
        ('cancelled', 'İptal Edildi'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('urgent', 'Acil'),
    ]
    
    CATEGORY_CHOICES = [
        ('work', 'İş'),
        ('personal', 'Kişisel'),
        ('shopping', 'Alışveriş'),
        ('health', 'Sağlık'),
        ('education', 'Eğitim'),
        ('finance', 'Finans'),
        ('travel', 'Seyahat'),
        ('other', 'Diğer'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='Başlık')
    description = models.TextField(blank=True, null=True, verbose_name='Açıklama')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name='Kategori')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Durum')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='Öncelik')
    due_date = models.DateTimeField(blank=True, null=True, verbose_name='Bitiş Tarihi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma Tarihi')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks', verbose_name='Kullanıcı')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Görev'
        verbose_name_plural = 'Görevler'
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.due_date and self.status != 'completed':
            return timezone.now() > self.due_date
        return False
    
    @property
    def days_until_due(self):
        """Calculate days until due date"""
        if self.due_date:
            delta = self.due_date - timezone.now()
            return delta.days
        return None
