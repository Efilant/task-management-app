"""
API için görev serializer'ları.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
import os
from .models import Task, TaskAttachment

class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    attachments = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'status', 
            'priority', 'due_date', 'created_at', 'updated_at',
            'is_overdue', 'days_until_due', 'attachments', 'user',
            'user_username', 'user_email'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_user_username(self, obj):
        """Görev sahibinin kullanıcı adını al"""
        return obj.user.username if obj.user else None
    
    def get_user_email(self, obj):
        """Görev sahibinin e-posta adresini al"""
        return obj.user.email if obj.user else None
    
    def get_attachments(self, obj):
        """Bu görev için eklentileri al"""
        attachments = obj.attachments.all()
        # file_url oluşturma için context'in request içerdiğinden emin ol
        context = self.context if self.context else {}
        serializer = TaskAttachmentSerializer(attachments, many=True, context=context)
        return serializer.data
    
    def create(self, validated_data):
        """Create a new task for the authenticated user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_user_id = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'category', 'priority', 'due_date', 'assigned_user_id']
        extra_kwargs = {
            'due_date': {'required': False, 'allow_null': True},
            'id': {'read_only': True}  # ID yalnızca okunabilir olmalı
        }
    
    def validate_due_date(self, value):
        """Bitiş tarihinin şu andan en az 30 dakika sonra olduğunu doğrula"""
        if value is None or value == '':
            # Tarih zorunlu değilse None kabul et
            return None
        
        # String ise datetime'a çevir
        if isinstance(value, str):
            try:
                from django.utils.dateparse import parse_datetime
                value = parse_datetime(value)
                if value is None:
                    return None
            except (ValueError, TypeError):
                return None
        
        now = timezone.now()
        min_due_date = now + timedelta(minutes=30)
        
        if value < min_due_date:
            raise serializers.ValidationError(
                f"Görev tarihi en az {min_due_date.strftime('%d.%m.%Y %H:%M')} tarihinden sonra olmalıdır. "
                f"(En az 30 dakika sonrası)"
            )
        
        return value
    
    def create(self, validated_data):
        """Kimlik doğrulanmış kullanıcı için yeni bir görev oluştur"""
        # assigned_user_id write_only field olduğu için validated_data'da olmamalı
        # Bu alan perform_create'de request.data'dan alınacak
        validated_data.pop('assigned_user_id', None)
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Görev eklentileri için serializer"""
    file_size_mb = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'task', 'original_filename', 'file_size', 
            'file_size_mb', 'uploaded_at', 'uploaded_by', 'file_url'
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by', 'file_size']
    
    def get_file_size_mb(self, obj):
        """Dosya boyutunu MB'a dönüştür"""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0
    
    def get_file_url(self, obj):
        """Dosya URL'ini al"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class TaskAttachmentCreateSerializer(serializers.ModelSerializer):
    """Görev eklentileri oluşturmak için serializer"""
    
    class Meta:
        model = TaskAttachment
        fields = ['file', 'task']
    
    def validate_file(self, value):
        """Dosya boyutunu ve türünü doğrula"""
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Dosya boyutu 10MB\'dan büyük olamaz. Mevcut boyut: {value.size / (1024*1024):.2f}MB'
            )
        
        allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx']
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'Bu dosya türü desteklenmiyor. İzin verilen türler: {", ".join(allowed_extensions)}'
            )
        
        return value
    
    def validate_task(self, value):
        """Kullanıcının göreve sahip olduğundan emin ol"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("İstek bilgisi bulunamadı.")
        if value.user != request.user:
            raise serializers.ValidationError("Bu göreve dosya ekleyemezsiniz. Görev size ait değil.")
        return value
    
    def create(self, validated_data):
        """Kullanıcı bilgisiyle eklenti oluştur"""
        # uploaded_by perform_create'de ayarlanacak, ancak güvenlik için burada da ayarlıyoruz
        if 'uploaded_by' not in validated_data:
            validated_data['uploaded_by'] = self.context['request'].user
        if 'original_filename' not in validated_data:
            validated_data['original_filename'] = validated_data['file'].name
        if 'file_size' not in validated_data:
            validated_data['file_size'] = validated_data['file'].size
        return super().create(validated_data)
