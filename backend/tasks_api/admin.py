from django.contrib import admin
from .models import Task, TaskAttachment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'priority', 'category', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'category', 'created_at', 'due_date')
    search_fields = ('title', 'description', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Görev Bilgileri', {
            'fields': ('title', 'description', 'user')
        }),
        ('Durum ve Öncelik', {
            'fields': ('status', 'priority', 'category')
        }),
        ('Tarihler', {
            'fields': ('due_date', 'created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Yeni görev oluşturuluyorsa
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'task', 'uploaded_by', 'file_size', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('original_filename', 'task__title', 'uploaded_by__username')
    ordering = ('-uploaded_at',)
    readonly_fields = ('uploaded_at', 'file_size')
    
    fieldsets = (
        ('Dosya Bilgileri', {
            'fields': ('task', 'file', 'original_filename', 'uploaded_by')
        }),
        ('Bilgiler', {
            'fields': ('file_size', 'uploaded_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('task', 'uploaded_by')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Yeni eklenti oluşturuluyorsa
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
