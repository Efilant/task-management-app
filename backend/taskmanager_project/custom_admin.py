from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.contrib.auth.models import User
from authentication.models import UserProfile
from tasks_api.models import Task
import json

class CustomAdminSite(admin.AdminSite):
    site_header = "Task Management API Admin"
    site_title = "API Admin"
    index_title = "API Yönetim Paneli"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('api-stats/', self.admin_view(self.api_stats_view), name='api_stats'),
            path('api-test/', self.admin_view(self.api_test_view), name='api_test'),
        ]
        return custom_urls + urls
    
    def api_stats_view(self, request):
        """API istatistikleri görünümü"""
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_tasks': Task.objects.count(),
            'completed_tasks': Task.objects.filter(status='completed').count(),
            'pending_tasks': Task.objects.filter(status='pending').count(),
            'in_progress_tasks': Task.objects.filter(status='in_progress').count(),
            'cancelled_tasks': Task.objects.filter(status='cancelled').count(),
        }
        
        html = f"""
        <html>
        <head>
            <title>API İstatistikleri</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
                .stat-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007cba; }}
                .stat-number {{ font-size: 2em; font-weight: bold; color: #007cba; }}
                .stat-label {{ color: #666; margin-top: 5px; }}
            </style>
        </head>
        <body>
            <h1>API İstatistikleri</h1>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">{stats['total_users']}</div>
                    <div class="stat-label">Toplam Kullanıcı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['active_users']}</div>
                    <div class="stat-label">Aktif Kullanıcı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['total_tasks']}</div>
                    <div class="stat-label">Toplam Görev</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['completed_tasks']}</div>
                    <div class="stat-label">Tamamlanan Görev</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['pending_tasks']}</div>
                    <div class="stat-label">Bekleyen Görev</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['in_progress_tasks']}</div>
                    <div class="stat-label">Devam Eden Görev</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{stats['cancelled_tasks']}</div>
                    <div class="stat-label">İptal Edilen Görev</div>
                </div>
            </div>
            <p><a href="/api-admin/">← Admin Paneline Dön</a></p>
        </body>
        </html>
        """
        return HttpResponse(html)
    
    def api_test_view(self, request):
        """API test görünümü"""
        html = f"""
        <html>
        <head>
            <title>API Test Paneli</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .api-section {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                .endpoint {{ background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; }}
                .method {{ font-weight: bold; color: #007cba; }}
                .url {{ font-family: monospace; background: #e9ecef; padding: 2px 4px; }}
            </style>
        </head>
        <body>
            <h1>API Test Paneli</h1>
            
            <div class="api-section">
                <h2>🔐 Authentication API</h2>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/register/</span>
                    <p>Kullanıcı kaydı</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/login/</span>
                    <p>Kullanıcı girişi</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/verify-email/</span>
                    <p>E-posta doğrulama</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/resend-verification-code/</span>
                    <p>Doğrulama kodu yeniden gönder</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/request-password-reset/</span>
                    <p>Şifre sıfırlama isteği</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/reset-password/</span>
                    <p>Şifre sıfırlama</p>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> <span class="url">/api/auth/profile/</span>
                    <p>Profil bilgileri</p>
                </div>
                <div class="endpoint">
                    <span class="method">PUT</span> <span class="url">/api/auth/profile/</span>
                    <p>Profil güncelleme</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/change-password/</span>
                    <p>Şifre değiştirme</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/auth/logout/</span>
                    <p>Çıkış yapma</p>
                </div>
            </div>
            
            <div class="api-section">
                <h2>📋 Tasks API</h2>
                <div class="endpoint">
                    <span class="method">GET</span> <span class="url">/api/tasks/</span>
                    <p>Görevleri listele</p>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> <span class="url">/api/tasks/</span>
                    <p>Yeni görev oluştur</p>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> <span class="url">/api/tasks/{id}/</span>
                    <p>Görev detayı</p>
                </div>
                <div class="endpoint">
                    <span class="method">PUT</span> <span class="url">/api/tasks/{id}/</span>
                    <p>Görev güncelle</p>
                </div>
                <div class="endpoint">
                    <span class="method">DELETE</span> <span class="url">/api/tasks/{id}/</span>
                    <p>Görev sil</p>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> <span class="url">/api/tasks/stats/</span>
                    <p>Görev istatistikleri</p>
                </div>
            </div>
            
            <div class="api-section">
                <h2>🧪 Test Örnekleri</h2>
                <h3>Kullanıcı Kaydı:</h3>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{{"username": "testuser", "email": "test@example.com", "password": "Test123!"}}'
                </pre>
                
                <h3>Giriş Yapma:</h3>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
curl -X POST http://localhost:8000/api/auth/login/ \\
  -H "Content-Type: application/json" \\
  -d '{{"username": "testuser", "password": "Test123!"}}'
                </pre>
                
                <h3>Görev Oluşturma:</h3>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
curl -X POST http://localhost:8000/api/tasks/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{{"title": "Test Görev", "description": "Test açıklaması", "status": "pending", "priority": "medium", "category": "work"}}'
                </pre>
            </div>
            
            <p><a href="/api-admin/">← Admin Paneline Dön</a></p>
        </body>
        </html>
        """
        return HttpResponse(html)

# Custom admin site'i kaydet
custom_admin_site = CustomAdminSite(name='custom_admin')

# Modelleri custom admin site'e kaydet
from django.contrib.auth.admin import UserAdmin
from authentication.admin import CustomUserAdmin, UserProfileAdmin
from tasks_api.admin import TaskAdmin

custom_admin_site.register(User, CustomUserAdmin)
custom_admin_site.register(UserProfile, UserProfileAdmin)
custom_admin_site.register(Task, TaskAdmin)
