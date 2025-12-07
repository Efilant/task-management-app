"""
API için görev view'ları.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from datetime import timedelta
import os

from .models import Task, TaskAttachment
from .serializers import TaskSerializer, TaskCreateSerializer, TaskAttachmentSerializer, TaskAttachmentCreateSerializer
from .permissions import IsOwnerOrAdmin, IsAdmin

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Kimlik doğrulanmış kullanıcının görevlerini döndür, admin ise tüm görevleri döndür"""
        if hasattr(self.request.user, 'profile') and self.request.user.profile.is_admin:
            # Admin tüm görevleri görebilir
            return Task.objects.all().prefetch_related('attachments', 'user')
        # Normal kullanıcılar sadece kendi görevlerini görebilir
        return Task.objects.filter(user=self.request.user).prefetch_related('attachments')
    
    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Görev oluştururken kullanıcıyı ayarla"""
        import traceback
        try:
            print(f"DEBUG: perform_create called - User: {self.request.user.username}, Is Admin: {hasattr(self.request.user, 'profile') and self.request.user.profile.is_admin}")
            print(f"DEBUG: Request data: {self.request.data}")
            
            # Admin görevleri başka kullanıcılara atayabilir
            assigned_user_id = self.request.data.get('assigned_user_id')
            print(f"DEBUG: assigned_user_id from request: {assigned_user_id}")
            
            # assigned_user_id varsa ve admin ise
            if assigned_user_id is not None and assigned_user_id != '':
                try:
                    assigned_user_id = int(assigned_user_id)
                    if hasattr(self.request.user, 'profile') and self.request.user.profile.is_admin:
                        try:
                            assigned_user = User.objects.get(id=assigned_user_id)
                            print(f"DEBUG: Assigning task to user: {assigned_user.username}")
                            serializer.save(user=assigned_user)
                            return
                        except (User.DoesNotExist, ValueError) as e:
                            # Kullanıcı bulunamazsa veya geçersiz ID ise kendisine atar
                            print(f"DEBUG: Error assigning user: {e}")
                            serializer.save(user=self.request.user)
                            return
                except (ValueError, TypeError) as e:
                    # assigned_user_id geçersiz bir değerse kendisine atar
                    print(f"DEBUG: Error parsing assigned_user_id: {e}")
                    pass
            
            # Normal kullanıcılar veya admin ama assigned_user_id yoksa kendileri için görev oluşturur
            print(f"DEBUG: Saving task for user: {self.request.user.username}")
            serializer.save(user=self.request.user)
        except Exception as e:
            print(f"DEBUG: Error in perform_create: {e}")
            print(traceback.format_exc())
            raise
    
    def create(self, request, *args, **kwargs):
        """Görev oluştur ve response'da ID'yi döndür"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Oluşturulan görevi TaskSerializer ile serialize et (ID ve tüm bilgileri içerir)
        task = serializer.instance
        task_serializer = TaskSerializer(task, context={'request': request})
        
        print(f"DEBUG: Created task ID: {task.id}")
        print(f"DEBUG: Response data: {task_serializer.data}")
        
        return Response(task_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_update(self, serializer):
        """Görev güncellemesini işle, admin'in görevleri yeniden atamasına izin ver"""
        # Admin görevleri başka kullanıcılara yeniden atayabilir
        assigned_user_id = self.request.data.get('assigned_user_id')
        if assigned_user_id and hasattr(self.request.user, 'profile') and self.request.user.profile.is_admin:
            try:
                assigned_user = User.objects.get(id=assigned_user_id)
                serializer.save(user=assigned_user)
                return
            except User.DoesNotExist:
                pass
        # Normal güncelleme (kullanıcı değişikliği yok veya admin değil)
        serializer.save()
    
    @action(detail=True, methods=['patch'])
    def mark_completed(self, request, pk=None):
        """Bir görevi tamamlandı olarak işaretle"""
        task = self.get_object()
        task.status = 'completed'
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_in_progress(self, request, pk=None):
        """Bir görevi devam ediyor olarak işaretle"""
        task = self.get_object()
        task.status = 'in_progress'
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Kullanıcı için görev istatistiklerini al"""
        # Admin user_id parametresi ile herhangi bir kullanıcının istatistiklerini görüntüleyebilir
        user_id = request.query_params.get('user_id')
        if user_id and hasattr(request.user, 'profile') and request.user.profile.is_admin:
            try:
                from django.contrib.auth.models import User
                target_user = User.objects.get(id=user_id)
                user_tasks = Task.objects.filter(user=target_user).prefetch_related('attachments')
            except User.DoesNotExist:
                user_tasks = self.get_queryset()
        else:
            user_tasks = self.get_queryset()
        
        total_tasks = user_tasks.count()
        completed_tasks = user_tasks.filter(status='completed').count()
        pending_tasks = user_tasks.filter(status='pending').count()
        in_progress_tasks = user_tasks.filter(status='in_progress').count()
        cancelled_tasks = user_tasks.filter(status='cancelled').count()
        
        # Süresi geçen görevler
        overdue_tasks = user_tasks.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()
        
        # Bugün biten görevler
        today = timezone.now().date()
        due_today = user_tasks.filter(
            due_date__date=today,
            status__in=['pending', 'in_progress']
        ).count()
        
        # Bu hafta biten görevler
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        due_this_week = user_tasks.filter(
            due_date__date__range=[week_start, week_end],
            status__in=['pending', 'in_progress']
        ).count()
        
        # Kategori dağılımı
        category_stats = user_tasks.values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Öncelik dağılımı
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
        """Son oluşturulan görevleri al"""
        recent_tasks = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Süresi geçen görevleri al"""
        overdue_tasks = self.get_queryset().filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        )
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def all_tasks(self, request):
        """Tüm görevleri al (sadece admin)"""
        tasks = Task.objects.all().prefetch_related('attachments', 'user')
        serializer = self.get_serializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def users(self, request):
        """Görev ataması için tüm kullanıcıları al (sadece admin)"""
        users = User.objects.filter(is_active=True).select_related('profile')
        user_list = []
        for user in users:
            user_role = user.profile.role if hasattr(user, 'profile') else 'user'
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user_role
            })
        return Response(user_list)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def assign(self, request, pk=None):
        """Bir görevi bir kullanıcıya ata (sadece admin)"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            task.user = user
            task.save()
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """Görev eklentileri için ViewSet"""
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Kimlik doğrulanmış kullanıcıya ait görevlerin eklentilerini döndür"""
        return TaskAttachment.objects.filter(task__user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return TaskAttachmentCreateSerializer
        return TaskAttachmentSerializer
    
    def perform_create(self, serializer):
        """Bir eklenti oluştururken yükleyiciyi ayarla"""
        try:
            serializer.save(uploaded_by=self.request.user)
        except Exception as e:
            import traceback
            print(f"Error creating attachment: {e}")
            print(traceback.format_exc())
            raise
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Eklenti dosyasını indir"""
        attachment = self.get_object()
        
        # Kullanıcının göreve sahip olduğundan emin ol
        if attachment.task.user != request.user:
            return Response(
                {'error': 'Bu dosyaya erişim yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not attachment.file:
            return Response(
                {'error': 'Dosya bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            response = FileResponse(
                attachment.file.open('rb'),
                content_type='application/octet-stream'
            )
            response['Content-Disposition'] = f'attachment; filename="{attachment.original_filename}"'
            return response
        except Exception as e:
            return Response(
                {'error': f'Dosya indirilemedi: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Eklenti dosyasını önizle (resimler ve PDF'ler için)"""
        attachment = self.get_object()
        
        # Kullanıcının göreve sahip olduğundan emin ol
        if attachment.task.user != request.user:
            return Response(
                {'error': 'Bu dosyaya erişim yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not attachment.file:
            return Response(
                {'error': 'Dosya bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # İçerik türünü belirle
        ext = os.path.splitext(attachment.original_filename)[1].lower()
        content_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
        }
        
        content_type = content_types.get(ext, 'application/octet-stream')
        
        try:
            response = FileResponse(
                attachment.file.open('rb'),
                content_type=content_type
            )
            response['Content-Disposition'] = f'inline; filename="{attachment.original_filename}"'
            return response
        except Exception as e:
            return Response(
                {'error': f'Dosya görüntülenemedi: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Belirli bir görev için tüm eklentileri al"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'error': 'task_id parametresi gereklidir.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id, user=request.user)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Görev bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        attachments = TaskAttachment.objects.filter(task=task)
        serializer = self.get_serializer(attachments, many=True, context={'request': request})
        return Response(serializer.data)
