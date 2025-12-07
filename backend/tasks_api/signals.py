"""
tasks_api uygulaması için sinyaller.
"""

from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Task, TaskAttachment
import os
import shutil


@receiver(post_delete, sender=Task)
def cleanup_task_attachments(sender, instance, **kwargs):
    """Görev silindiğinde eklenti dizinini temizle"""
    # Eklentiler zaten CASCADE ile silinir, ancak dizini temizlememiz gerekiyor
    attachment_dir = os.path.join('media', 'attachments', f'task_{instance.id}')
    if os.path.exists(attachment_dir):
        try:
            shutil.rmtree(attachment_dir)
        except Exception as e:
            print(f"Error cleaning up attachment directory: {e}")


@receiver(post_delete, sender=TaskAttachment)
def cleanup_attachment_file(sender, instance, **kwargs):
    """Eklenti silindiğinde eklenti dosyasını temizle"""
    if instance.file:
        try:
            if os.path.isfile(instance.file.path):
                os.remove(instance.file.path)
        except Exception as e:
            print(f"Error removing attachment file: {e}")
