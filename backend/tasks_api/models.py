"""
Görev yönetimi uygulaması için görev modeli.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
import os
import uuid

def validate_file_size(value):
    """Dosya boyutunun 10MB'dan fazla olmadığını doğrula"""
    max_size = 10 * 1024 * 1024  # 10MB
    if value.size > max_size:
        raise ValidationError(f'Dosya boyutu 10MB\'dan büyük olamaz. Mevcut boyut: {value.size / (1024*1024):.2f}MB')

def validate_file_type(value):
    """Dosya türünün izin verilen türlerden olduğunu doğrula"""
    allowed_types = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx']
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in allowed_types:
        raise ValidationError(f'Bu dosya türü desteklenmiyor. İzin verilen türler: {", ".join(allowed_types)}')

def attachment_upload_path(instance, filename):
    """Eklentiler için yükleme yolu oluştur"""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    return f"attachments/task_{instance.task.id}/{filename}"

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
        """Görevin süresi geçmiş olup olmadığını kontrol et"""
        if self.due_date and self.status != 'completed':
            return timezone.now() > self.due_date
        return False
    
    @property
    def days_until_due(self):
        """Bitiş tarihine kadar kalan gün sayısını hesapla"""
        if self.due_date:
            delta = self.due_date - timezone.now()
            return delta.days
        return None


class TaskAttachment(models.Model):
    """Görev dosya eklentileri için model"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments', verbose_name='Görev')
    file = models.FileField(
        upload_to=attachment_upload_path,
        validators=[validate_file_size, validate_file_type],
        verbose_name='Dosya'
    )
    original_filename = models.CharField(max_length=255, verbose_name='Orijinal Dosya Adı')
    file_size = models.PositiveIntegerField(verbose_name='Dosya Boyutu (bytes)')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Yüklenme Tarihi')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_attachments', verbose_name='Yükleyen Kullanıcı')
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Görev Eklentisi'
        verbose_name_plural = 'Görev Eklentileri'
    
    def __str__(self):
        return f"{self.original_filename} - {self.task.title}"
    
    def save(self, *args, **kwargs):
        """Orijinal dosya adını ve dosya boyutunu kaydetmek için save metodunu geçersiz kıl"""
        if not self.original_filename:
            self.original_filename = self.file.name
        if self.file and not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Dosyayı dosya sisteminden silmek için delete metodunu geçersiz kıl"""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
