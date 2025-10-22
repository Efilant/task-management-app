from django.contrib import admin
from .models import Task

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
