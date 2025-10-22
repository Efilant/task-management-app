"""
Task views for API.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return tasks for the authenticated user"""
        return Task.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Set the user when creating a task"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def mark_completed(self, request, pk=None):
        """Mark a task as completed"""
        task = self.get_object()
        task.status = 'completed'
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_in_progress(self, request, pk=None):
        """Mark a task as in progress"""
        task = self.get_object()
        task.status = 'in_progress'
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get task statistics for the user"""
        user_tasks = self.get_queryset()
        
        total_tasks = user_tasks.count()
        completed_tasks = user_tasks.filter(status='completed').count()
        pending_tasks = user_tasks.filter(status='pending').count()
        in_progress_tasks = user_tasks.filter(status='in_progress').count()
        cancelled_tasks = user_tasks.filter(status='cancelled').count()
        
        # Overdue tasks
        overdue_tasks = user_tasks.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()
        
        # Tasks due today
        today = timezone.now().date()
        due_today = user_tasks.filter(
            due_date__date=today,
            status__in=['pending', 'in_progress']
        ).count()
        
        # Tasks due this week
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        due_this_week = user_tasks.filter(
            due_date__date__range=[week_start, week_end],
            status__in=['pending', 'in_progress']
        ).count()
        
        # Category breakdown
        category_stats = user_tasks.values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Priority breakdown
        priority_stats = user_tasks.values('priority').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'in_progress_tasks': in_progress_tasks,
            'cancelled_tasks': cancelled_tasks,
            'overdue_tasks': overdue_tasks,
            'due_today': due_today,
            'due_this_week': due_this_week,
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2),
            'category_stats': list(category_stats),
            'priority_stats': list(priority_stats),
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently created tasks"""
        recent_tasks = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks"""
        overdue_tasks = self.get_queryset().filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        )
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)
