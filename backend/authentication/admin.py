from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

# UserProfile için inline admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profil Bilgileri'
    fields = ('verification_token', 'verification_token_sent_at', 'reset_token', 'reset_token_expires')
    readonly_fields = ('verification_token_sent_at', 'reset_token_expires')

# User modelini genişlet
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

# Mevcut User admin'i kaldır ve yenisini kaydet
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# UserProfile için ayrı admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'verification_token', 'verification_token_sent_at', 'reset_token', 'reset_token_expires')
    list_filter = ('verification_token_sent_at', 'reset_token_expires')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('verification_token_sent_at', 'reset_token_expires')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
