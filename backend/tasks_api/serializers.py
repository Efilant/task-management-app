"""
Task serializers for API.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'status', 
            'priority', 'due_date', 'created_at', 'updated_at',
            'is_overdue', 'days_until_due'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create a new task for the authenticated user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'category', 'priority', 'due_date']
    
    def validate_due_date(self, value):
        """Validate that due_date is at least 30 minutes from now"""
        now = timezone.now()
        min_due_date = now + timedelta(minutes=30)
        
        if value < min_due_date:
            raise serializers.ValidationError(
                f"Görev tarihi en az {min_due_date.strftime('%d.%m.%Y %H:%M')} tarihinden sonra olmalıdır. "
                f"(En az 30 dakika sonrası)"
            )
        
        return value
    
    def create(self, validated_data):
        """Create a new task for the authenticated user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
