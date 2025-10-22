"""
Task serializers for API.
"""

from rest_framework import serializers
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
    
    def create(self, validated_data):
        """Create a new task for the authenticated user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
