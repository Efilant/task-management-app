# Görev Yönetim Uygulaması - Proje Dokümantasyonu

Bu dokümantasyon, görev yönetim uygulamasının tüm dosyalarını, methodlarını, bağlantılarını ve işlevlerini detaylı bir şekilde açıklamaktadır.

---

## 📁 Backend Yapısı

### 🔐 Authentication (Kimlik Doğrulama) Modülü

#### `backend/authentication/models.py`
**Amaç**: Kullanıcı profilleri ve doğrulama token'ları için model tanımları.

**Sınıflar ve Methodlar:**
- **`UserProfile`**: Kullanıcı profil modeli
  - `role` (CharField): Kullanıcı rolü ('user' veya 'admin')
  - `verification_token` (CharField): E-posta doğrulama için 6 haneli kod
  - `reset_token` (CharField): Şifre sıfırlama için 6 haneli kod
  - `email_verified` (BooleanField): E-posta doğrulama durumu
  - `is_admin` (property): Kullanıcının admin olup olmadığını kontrol eder
  - `is_reset_token_valid()`: Sıfırlama token'ının geçerli olup olmadığını kontrol eder (3 dakika)
  - `is_verification_token_valid()`: Doğrulama token'ının geçerli olup olmadığını kontrol eder (3 dakika)

**Veritabanı İlişkileri:**
- `User` modeli ile OneToOneField ilişkisi (her kullanıcının bir profili var)

---

#### `backend/authentication/views.py`
**Amaç**: Kullanıcı kaydı, giriş, e-posta doğrulama ve şifre yönetimi için API endpoint'leri.

**Endpoint'ler ve Methodlar:**

1. **`register(request)`** - POST `/api/auth/register/`
   - **İşlev**: Yeni kullanıcı kaydı
   - **İşlemler**:
     - E-posta formatı doğrulama
     - Şifre güç kontrolü (min 8 karakter, büyük/küçük harf, rakam, özel karakter)
     - Kullanıcı adı ve e-posta benzersizlik kontrolü
     - 6 haneli doğrulama kodu oluşturma ve e-posta gönderme
     - Kullanıcıyı `is_active=False` olarak oluşturma
   - **Dönen Veri**: Kullanıcı bilgileri ve e-posta gönderim durumu

2. **`verify_email(request)`** - POST `/api/auth/verify-email/`
   - **İşlev**: E-posta adresini 6 haneli kod ile doğrular
   - **Parametreler**: `code`, `email`
   - **İşlemler**:
     - Kodu ve e-postayı kontrol eder
     - Kullanıcıyı `is_active=True` yapar
     - Doğrulama kodunu temizler

3. **`resend_verification_code(request)`** - POST `/api/auth/resend-verification-code/`
   - **İşlev**: Yeni doğrulama kodu gönderir
   - **Parametreler**: `email`
   - **İşlemler**: Yeni 6 haneli kod oluşturup e-posta gönderir

4. **`login(request)`** - POST `/api/auth/login/`
   - **İşlev**: Kullanıcı girişi ve JWT token oluşturma
   - **Parametreler**: `username`, `password`
   - **İşlemler**:
     - Kullanıcı kimlik doğrulama
     - E-posta doğrulama kontrolü
     - JWT access ve refresh token oluşturma
     - Kullanıcı rolünü response'a ekleme
   - **Dönen Veri**: Kullanıcı bilgileri, access token, refresh token

5. **`refresh_token(request)`** - POST `/api/auth/refresh/`
   - **İşlev**: JWT access token'ı yeniler
   - **Parametreler**: `refresh` (refresh token)
   - **Dönen Veri**: Yeni access token

6. **`logout(request)`** - POST `/api/auth/logout/`
   - **İşlev**: Kullanıcı çıkışı (token doğal olarak süresi dolacak)

7. **`profile(request)`** - GET/PUT `/api/auth/profile/`
   - **GET**: Kullanıcı profil bilgilerini getirir (rol dahil)
   - **PUT**: Kullanıcı profil bilgilerini günceller
   - **Parametreler (PUT)**: `username`, `email`, `first_name`, `last_name`
   - **İşlemler**: E-posta formatı ve benzersizlik kontrolü

8. **`change_password(request)`** - POST `/api/auth/change-password/`
   - **İşlev**: Kullanıcı şifresini değiştirir
   - **Parametreler**: `current_password`, `new_password`
   - **İşlemler**: Mevcut şifre doğrulama ve yeni şifre güç kontrolü

9. **`request_password_reset(request)`** - POST `/api/auth/request-password-reset/`
   - **İşlev**: Şifre sıfırlama kodu gönderir
   - **Parametreler**: `email`
   - **İşlemler**: 6 haneli sıfırlama kodu oluşturup e-posta gönderir (3 dakika geçerli)

10. **`reset_password(request)`** - POST `/api/auth/reset-password/`
    - **İşlev**: Şifreyi 6 haneli kod ile sıfırlar
    - **Parametreler**: `code`, `email`, `new_password`
    - **İşlemler**: Kod ve e-posta kontrolü, yeni şifre güç kontrolü, şifre değiştirme

**Yardımcı Fonksiyonlar:**
- `validate_password_strength(password)`: Şifre güç kontrolü yapar
- `validate_email(email)`: E-posta formatı kontrolü yapar

---

#### `backend/authentication/urls.py`
**Amaç**: Authentication endpoint'leri için URL yönlendirmeleri.

**URL Pattern'leri:**
- `/register/` → `register` view
- `/login/` → `login` view
- `/logout/` → `logout` view
- `/refresh/` → `refresh_token` view
- `/verify-email/` → `verify_email` view
- `/resend-verification-code/` → `resend_verification_code` view
- `/request-password-reset/` → `request_password_reset` view
- `/reset-password/` → `reset_password` view
- `/profile/` → `profile` view
- `/change-password/` → `change_password` view

---

### 📋 Tasks API (Görev API) Modülü

#### `backend/tasks_api/models.py`
**Amaç**: Görev ve görev eklentileri için veritabanı modelleri.

**Sınıflar:**

1. **`Task`**: Görev modeli
   - **Alanlar**:
     - `title` (CharField): Görev başlığı
     - `description` (TextField): Görev açıklaması
     - `category` (CharField): Kategori (work, personal, shopping, health, education, finance, travel, other)
     - `status` (CharField): Durum (pending, in_progress, completed, cancelled)
     - `priority` (CharField): Öncelik (low, medium, high, urgent)
     - `due_date` (DateTimeField): Bitiş tarihi
     - `created_at` (DateTimeField): Oluşturulma tarihi (otomatik)
     - `updated_at` (DateTimeField): Güncellenme tarihi (otomatik)
     - `user` (ForeignKey): Görev sahibi (User modeline bağlı)
   - **Property'ler**:
     - `is_overdue`: Görevin süresi geçmiş olup olmadığını kontrol eder
     - `days_until_due`: Bitiş tarihine kadar kalan gün sayısını hesaplar
   - **İlişkiler**:
     - `user`: User modeli ile ForeignKey
     - `attachments`: TaskAttachment modeli ile reverse relation (related_name)

2. **`TaskAttachment`**: Görev eklentileri modeli
   - **Alanlar**:
     - `task` (ForeignKey): İlişkili görev
     - `file` (FileField): Dosya (PDF, PNG, JPG, DOCX, XLSX - max 10MB)
     - `original_filename` (CharField): Orijinal dosya adı
     - `file_size` (PositiveIntegerField): Dosya boyutu (bytes)
     - `uploaded_at` (DateTimeField): Yüklenme tarihi
     - `uploaded_by` (ForeignKey): Yükleyen kullanıcı
   - **Methodlar**:
     - `save()`: Orijinal dosya adını ve boyutunu otomatik kaydeder
     - `delete()`: Dosyayı fiziksel olarak siler

**Yardımcı Fonksiyonlar:**
- `validate_file_size(value)`: Dosya boyutunun 10MB'dan fazla olmadığını kontrol eder
- `validate_file_type(value)`: Dosya türünün izin verilen türlerden olduğunu kontrol eder
- `attachment_upload_path(instance, filename)`: Eklentiler için dinamik yükleme yolu oluşturur (`media/attachments/task_{task_id}/{uuid}.ext`)

---

#### `backend/tasks_api/serializers.py`
**Amaç**: Django modellerini JSON'a çevirmek ve JSON'dan modele dönüştürmek için serializer'lar.

**Serializer'lar:**

1. **`TaskSerializer`**: Görev serializasyonu (okuma)
   - **Eklenen Alanlar**:
     - `is_overdue`: Süresi geçmiş mi?
     - `days_until_due`: Bitişe kadar kalan gün
     - `attachments`: İlişkili eklentiler (SerializerMethodField)
     - `user_username`: Görev sahibinin kullanıcı adı
     - `user_email`: Görev sahibinin e-posta adresi
   - **Methodlar**:
     - `get_attachments()`: Görev eklentilerini getirir
     - `get_user_username()`: Görev sahibinin kullanıcı adını döndürür
     - `get_user_email()`: Görev sahibinin e-posta adresini döndürür

2. **`TaskCreateSerializer`**: Görev oluşturma serializasyonu
   - **Alanlar**: `id` (read-only), `title`, `description`, `category`, `priority`, `due_date`, `assigned_user_id` (write-only, optional)
   - **Validasyon**:
     - `validate_due_date()`: Bitiş tarihinin en az 30 dakika sonrası olmasını kontrol eder. String tarihleri otomatik olarak datetime'a çevirir.
   - **Methodlar**:
     - `create()`: `assigned_user_id` alanını `validated_data`'dan çıkarır (perform_create'de işlenir)
   - **Not**: Admin `assigned_user_id` ile görevi başka kullanıcıya atayabilir. Normal kullanıcılar bu alanı gönderemez.

3. **`TaskAttachmentSerializer`**: Eklenti serializasyonu (okuma)
   - **Eklenen Alanlar**:
     - `file_size_mb`: Dosya boyutu MB cinsinden
     - `file_url`: Dosya URL'i (absolute URL)
   - **Methodlar**:
     - `get_file_size_mb()`: Dosya boyutunu MB'a dönüştürür
     - `get_file_url()`: Dosya için tam URL oluşturur

4. **`TaskAttachmentCreateSerializer`**: Eklenti oluşturma serializasyonu
   - **Validasyon**:
     - `validate_file()`: Dosya boyutu (10MB) ve türü kontrolü
     - `validate_task()`: Kullanıcının göreve sahip olduğunu kontrol eder
   - **Methodlar**:
     - `create()`: Orijinal dosya adı ve boyutunu otomatik kaydeder

---

#### `backend/tasks_api/views.py`
**Amaç**: Görev ve eklenti işlemleri için API view'ları.

**ViewSet'ler:**

1. **`TaskViewSet`**: Görev CRUD işlemleri
   - **Permission**: `IsAuthenticated`, `IsOwnerOrAdmin`
   - **Filter**: `status`, `priority`, `category`
   - **Search**: `title`, `description`
   - **Ordering**: `created_at`, `updated_at`, `due_date`, `priority`, `title`
   
   **Methodlar:**
   
   - **`get_queryset()`**: 
     - Admin: Tüm görevleri döndürür (attachments ve user ile prefetch)
     - Normal kullanıcı: Sadece kendi görevlerini döndürür (attachments ile prefetch)
   
   - **`create()`**: (Override edilmiş)
     - Görev oluşturma işlemini yönetir
     - Görev oluşturulduktan sonra response'u `TaskSerializer` ile serialize eder
     - Response'da `id` ve tüm görev bilgileri (attachments dahil) döner
     - **Amaç**: Frontend'de görev ID'sini ve eklentileri alabilmek için
   
   - **`perform_create()`**: 
     - Admin: `assigned_user_id` varsa görevi o kullanıcıya atar
     - Normal kullanıcı: Görevi kendisine atar
     - Debug logları içerir (geliştirme ortamında)
   
   - **`perform_update()`**: 
     - Admin: `assigned_user_id` varsa görevi yeniden atayabilir
     - Normal kullanıcı: Sadece görev bilgilerini günceller
   
   **Custom Actions:**
   
   - **`mark_completed`** - PATCH `/api/tasks/{id}/mark_completed/`
     - Görevi tamamlandı olarak işaretler
   
   - **`mark_in_progress`** - PATCH `/api/tasks/{id}/mark_in_progress/`
     - Görevi devam ediyor olarak işaretler
   
   - **`stats`** - GET `/api/tasks/stats/?user_id={user_id}`
     - Kullanıcı için görev istatistikleri
     - Admin `user_id` parametresi ile herhangi bir kullanıcının istatistiklerini görebilir
     - **Dönen Veri**: 
       - Toplam görev sayısı
       - Durum bazlı görev sayıları (pending, in_progress, completed, cancelled)
       - Süresi geçen görevler
       - Bugün/ bu hafta biten görevler
       - Tamamlanma oranı
       - Kategori ve öncelik dağılımları
   
   - **`recent`** - GET `/api/tasks/recent/`
     - Son oluşturulan 10 görevi döndürür
   
   - **`overdue`** - GET `/api/tasks/overdue/`
     - Süresi geçen görevleri döndürür
   
   - **`all_tasks`** - GET `/api/tasks/all_tasks/` (Admin only)
     - Tüm görevleri döndürür (sadece admin)
   
   - **`users`** - GET `/api/tasks/users/` (Admin only)
     - Tüm aktif kullanıcıları döndürür (görev ataması için)
     - **Dönen Veri**: `id`, `username`, `email`, `first_name`, `last_name`
   
   - **`assign`** - PATCH `/api/tasks/{id}/assign/` (Admin only)
     - Görevi bir kullanıcıya atar
     - **Parametreler**: `user_id`

2. **`TaskAttachmentViewSet`**: Eklenti CRUD işlemleri
   - **Permission**: `IsAuthenticated`
   - **Parser**: `MultiPartParser`, `FormParser` (dosya yükleme için)
   
   **Methodlar:**
   
   - **`get_queryset()`**: Kullanıcının görevlerine ait eklentileri döndürür
   
   - **`perform_create()`**: Yükleyici kullanıcıyı otomatik ayarlar
   
   **Custom Actions:**
   
   - **`download`** - GET `/api/tasks/attachments/{id}/download/`
     - Eklenti dosyasını indirir
     - Content-Disposition header ile orijinal dosya adını korur
   
   - **`preview`** - GET `/api/tasks/attachments/{id}/preview/`
     - Eklenti dosyasını önizler (resim ve PDF için)
     - Content-Type header ile uygun MIME type ayarlar
   
   - **`by_task`** - GET `/api/tasks/attachments/by_task/?task_id={task_id}`
     - Belirli bir göreve ait tüm eklentileri döndürür
     - **Parametreler**: `task_id` (query parameter)

---

#### `backend/tasks_api/permissions.py`
**Amaç**: Özel izin kontrol sınıfları.

**İzin Sınıfları:**

1. **`IsOwnerOrAdmin`**: Görev sahibi veya admin kontrolü
   - **`has_object_permission()`**: 
     - Admin: Her şeye erişebilir
     - Sahip: Sadece kendi görevlerine erişebilir
   - **`has_permission()`**: Kullanıcının kimlik doğrulanmış olması gerekir
   - **Kullanım**: `TaskViewSet` için default permission

2. **`IsAdmin`**: Sadece admin kontrolü
   - **`has_permission()`**: Kullanıcının admin olması gerekir
   - **Kullanım**: Admin-only endpoint'ler için (`all_tasks`, `users`, `assign`)

3. **`IsOwnerOrReadOnlyAdmin`**: Sahip tam erişim, admin sadece okuma
   - **`has_object_permission()`**: 
     - Admin: Sadece okuma (GET, HEAD, OPTIONS)
     - Sahip: Tüm işlemler
   - **Not**: Şu anda kullanılmıyor, gelecekte kullanılabilir

---

#### `backend/tasks_api/urls.py`
**Amaç**: Tasks API endpoint'leri için URL yönlendirmeleri.

**Router Yapısı:**
- `DefaultRouter` kullanılıyor
- **Önemli**: `attachments` route'u önce kaydedilir (daha spesifik)
- `tasks` route'u sonra kaydedilir (daha genel)

**URL Pattern'leri:**
- `/api/tasks/` → TaskViewSet (list, create)
- `/api/tasks/{id}/` → TaskViewSet (retrieve, update, delete)
- `/api/tasks/{id}/mark_completed/` → mark_completed action
- `/api/tasks/{id}/mark_in_progress/` → mark_in_progress action
- `/api/tasks/stats/` → stats action
- `/api/tasks/recent/` → recent action
- `/api/tasks/overdue/` → overdue action
- `/api/tasks/all_tasks/` → all_tasks action (admin only)
- `/api/tasks/users/` → users action (admin only)
- `/api/tasks/{id}/assign/` → assign action (admin only)
- `/api/tasks/attachments/` → TaskAttachmentViewSet (list, create)
- `/api/tasks/attachments/{id}/` → TaskAttachmentViewSet (retrieve, update, delete)
- `/api/tasks/attachments/{id}/download/` → download action
- `/api/tasks/attachments/{id}/preview/` → preview action
- `/api/tasks/attachments/by_task/` → by_task action

---

#### `backend/tasks_api/signals.py`
**Amaç**: Model silme işlemlerinde otomatik dosya temizleme.

**Signal Handler'lar:**

1. **`cleanup_task_attachments`** (post_delete, Task)
   - **İşlev**: Görev silindiğinde eklenti dizinini temizler
   - **İşlem**: `media/attachments/task_{task_id}/` dizinini siler

2. **`cleanup_attachment_file`** (post_delete, TaskAttachment)
   - **İşlev**: Eklenti silindiğinde fiziksel dosyayı siler
   - **İşlem**: Dosya sisteminden dosyayı kaldırır

---

#### `backend/tasks_api/apps.py`
**Amaç**: Django app konfigürasyonu.

**Yapılandırma:**
- `ready()` metodu: App başlatıldığında signal'leri yükler
- Bu sayede `signals.py` dosyasındaki handler'lar otomatik çalışır

---

### ⚙️ Proje Ayarları

#### `backend/taskmanager_project/settings.py`
**Amaç**: Django proje ayarları.

**Önemli Ayarlar:**
- **INSTALLED_APPS**: 
  - Django apps: admin, auth, contenttypes, sessions, messages, staticfiles
  - Third-party: rest_framework, rest_framework_simplejwt, corsheaders, django_filters
  - Local: tasks_api, authentication

- **MIDDLEWARE**: CORS, Security, Session, CSRF, Auth, Message, XFrameOptions

- **CORS Ayarları**:
  - `CORS_ALLOWED_ORIGINS`: Frontend URL'leri
  - `CORS_ALLOW_CREDENTIALS`: True
  - `CORS_ALLOW_METHODS`: GET, POST, PUT, PATCH, DELETE, OPTIONS
  - `CORS_ALLOW_HEADERS`: Authorization, Content-Type vb.

- **REST_FRAMEWORK**:
  - Authentication: JWT (JSONWebTokenAuthentication)
  - Default permission: IsAuthenticated
  - Pagination: PageNumberPagination (sayfa başına 20 öğe)

- **SIMPLE_JWT**:
  - Access token süresi: 1 saat
  - Refresh token süresi: 7 gün

- **MEDIA**: Dosyalar `media/` klasöründe saklanır
- **STATIC**: Statik dosyalar `static/` klasöründe saklanır

---

#### `backend/taskmanager_project/urls.py`
**Amaç**: Ana URL yönlendirmeleri.

**URL Pattern'leri:**
- `/admin/` → Django standart admin paneli
- `/api-admin/` → Özel API admin paneli
- `/api/auth/` → Authentication endpoint'leri
- `/api/tasks/` → Tasks API endpoint'leri
- **DEBUG modunda**: Media ve static dosyalar için URL pattern'leri eklenir

---

## 🎨 Frontend Yapısı

### 📄 Ana Dosyalar

#### `frontend/src/App.js`
**Amaç**: Ana React uygulama bileşeni ve routing yapılandırması.

**Yapı:**
- **Router**: React Router DOM ile sayfa yönlendirmesi
- **AuthProvider**: Tüm uygulamayı sarmalayarak authentication context'i sağlar
- **Toaster**: React Hot Toast ile bildirim sistemi

**Route'lar:**
- `/login` → Login sayfası (public)
- `/register` → Kayıt sayfası (public)
- `/verify-email` → E-posta doğrulama sayfası (public)
- `/forgot-password` → Şifre sıfırlama isteği sayfası (public)
- `/reset-password` → Şifre sıfırlama sayfası (public)
- `/` → Private route (Layout içinde)
  - `/dashboard` → Görev yönetim sayfası
  - `/stats` → İstatistikler sayfası
  - `/profile` → Profil sayfası
  - `/admin` → Admin paneli sayfası (admin only)

**Toast Ayarları:**
- Position: top-right
- Success: 3 saniye
- Error: 5 saniye

---

#### `frontend/src/context/AuthContext.js`
**Amaç**: Global authentication state yönetimi.

**Context Değerleri:**
- `user`: Güncel kullanıcı bilgileri (id, username, email, role vb.)
- `token`: JWT access token
- `loading`: Yükleme durumu
- `isAuthenticated`: Kullanıcının giriş yapıp yapmadığı (boolean)
- `isAdmin`: Kullanıcının admin olup olmadığı (boolean)

**Methodlar:**
- `login(username, password)`: Kullanıcı girişi yapar, token'ları localStorage'a kaydeder
- `register(userData)`: Yeni kullanıcı kaydı yapar
- `logout()`: Kullanıcı çıkışı yapar, token'ları temizler
- `refreshToken()`: Access token'ı yeniler

**Hook:**
- `useAuth()`: AuthContext'i kullanmak için hook (component'lerde kullanılır)

---

#### `frontend/src/services/authService.js`
**Amaç**: Backend API ile iletişim için servis fonksiyonları.

**Axios Instance:**
- Base URL: `process.env.REACT_APP_API_URL` veya `http://localhost:8000/api`
- **Request Interceptor**: Her istekte Authorization header'ına token ekler
- **Response Interceptor**: 401 hatası durumunda token'ı otomatik yeniler

**Servisler:**

1. **`authService`**: Kimlik doğrulama işlemleri
   - `login(username, password)`: Giriş yapar
   - `register(userData)`: Kayıt yapar
   - `logout(refreshToken)`: Çıkış yapar
   - `refreshToken(refreshToken)`: Token yeniler
   - `verifyEmail(data)`: E-posta doğrular
   - `requestPasswordReset(email)`: Şifre sıfırlama kodu ister
   - `resetPassword(data)`: Şifreyi sıfırlar
   - `getProfile()`: Profil bilgilerini getirir
   - `updateProfile(profileData)`: Profil bilgilerini günceller
   - `changePassword(passwordData)`: Şifre değiştirir
   - `resendVerificationCode(email)`: Doğrulama kodunu yeniden gönderir

2. **`taskService`**: Görev işlemleri
   - `getTasks(params)`: Görevleri getirir (filtreleme parametreleri ile)
   - `getTask(id)`: Tek bir görevi getirir
   - `createTask(taskData)`: Yeni görev oluşturur
   - `updateTask(id, taskData)`: Görevi günceller
   - `deleteTask(id)`: Görevi siler
   - `markCompleted(id)`: Görevi tamamlandı olarak işaretler
   - `markInProgress(id)`: Görevi devam ediyor olarak işaretler
   - `getStats(params)`: İstatistikleri getirir (admin için user_id parametresi ile)
   - `getRecentTasks()`: Son görevleri getirir
   - `getOverdueTasks()`: Süresi geçen görevleri getirir
   - `getAllTasks()`: Tüm görevleri getirir (admin only)
   - `getUsers()`: Tüm kullanıcıları getirir (admin only)
   - `assignTask(taskId, userId)`: Görevi bir kullanıcıya atar (admin only)

3. **`attachmentService`**: Eklenti işlemleri
   - `uploadAttachment(taskId, file)`: Dosya yükler (FormData ile)
   - `getAttachments(taskId)`: Göreve ait eklentileri getirir
   - `downloadAttachment(attachmentId)`: Dosyayı indirir (blob download)
   - `previewAttachment(attachmentId)`: Dosyayı yeni sekmede açar
   - `deleteAttachment(attachmentId)`: Eklentiyi siler

---

### 📱 Sayfalar (Pages)

#### `frontend/src/pages/Dashboard.js`
**Amaç**: Ana görev yönetim sayfası.

**Özellikler:**
- **İstatistik Kartları**: Toplam, bekleyen, devam eden, tamamlanan, iptal edilmiş görev sayıları
- **Filtreleme**: Durum, öncelik, kategori
- **Arama**: Başlık ve açıklamada arama
- **Sıralama**: Tarih, öncelik, alfabetik
- **Görev Grid'i**: TaskCard component'leri ile görev listesi
- **Modal**: TaskModal ile görev oluşturma/düzenleme

**Methodlar:**
- `fetchTasks()`: Backend'den görevleri çeker (attachments dahil), prefetch ile optimize edilmiştir
- `handleCreateTask(taskData, files)`: 
  - Yeni görev oluşturur
  - Response'dan görev ID'sini alır (fallback mekanizması ile)
  - Dosyaları sırayla yükler (her dosya için ayrı istek)
  - Yükleme başarı/hata durumlarını takip eder
  - Dosyalar yüklendikten sonra 1 saniye bekler (backend işleme süresi için)
  - Görevleri yeniden yükler ve attachments'ların geldiğini kontrol eder
- `handleUpdateTask(taskData, files)`: Görevi günceller, yeni dosyalar ekler
- `handleDeleteTask(taskId)`: Görevi siler
- `handleStatusChange(taskId, newStatus)`: Görev durumunu değiştirir
- `filterAndSortTasks()`: Filtreleme ve sıralama işlemlerini yapar

**Admin Özellikleri:**
- Header'da "Tüm görevleri yönetin (Admin)" mesajı
- Normal kullanıcı için "Kendi görevlerinizi yönetin" mesajı

---

#### `frontend/src/pages/Stats.js`
**Amaç**: Görev istatistikleri ve analiz sayfası.

**Özellikler:**
- **İstatistik Kartları**: Toplam görev, tamamlanma oranı, süresi geçen, bu hafta, iptal edilmiş
- **Grafikler** (Chart.js ile):
  - Görev Durumu Dağılımı (Doughnut chart)
  - Öncelik Dağılımı (Bar chart)
  - Kategori Dağılımı (Doughnut chart)
  - Kategoriye Göre Tamamlanma Durumu (Doughnut chart)
- **Kategori Filtreleme**: Belirli bir kategori için detaylı istatistikler

**Admin Özellikleri:**
- Kullanıcı seçim dropdown'ı
- Seçilen kullanıcının istatistiklerini gösterir
- Header'da seçili kullanıcı bilgisi

**Methodlar:**
- `fetchStats()`: İstatistikleri getirir (admin için user_id parametresi ile)
- `fetchCategoryTasks()`: Kategori bazlı görevleri getirir
- `fetchUsers()`: Tüm kullanıcıları getirir (admin için)

---

#### `frontend/src/pages/AdminPanel.js`
**Amaç**: Admin paneli - tüm görevleri ve kullanıcıları yönetme.

**Özellikler:**
- **İstatistik Kartları**: Toplam görev, toplam kullanıcı, aktif görevler
- **Tab'lar**: 
  - "Tüm Görevler": Tüm kullanıcıların görevlerini gösterir
  - "Kullanıcılar": Tüm kullanıcıları gösterir
- **Görev Tablosu**:
  - Görev başlığı ve açıklaması
  - Kullanıcı bilgileri (username, email)
  - Durum ve öncelik
  - Bitiş tarihi
  - İşlemler: Görev atama, silme
- **Arama**: Görev başlığı, açıklama, kullanıcı adında arama
- **Modal**: Görev atama modal'ı (kullanıcı seçimi)

**Methodlar:**
- `fetchAllTasks()`: Tüm görevleri getirir
- `fetchUsers()`: Tüm kullanıcıları getirir
- `handleAssignTask(taskId, userId)`: Görevi bir kullanıcıya atar
- `handleDeleteTask(taskId)`: Görevi siler

**Permission Kontrolü:**
- Admin değilse Dashboard'a yönlendirir

---

#### `frontend/src/pages/Login.js`
**Amaç**: Kullanıcı giriş sayfası.

**Özellikler:**
- Kullanıcı adı ve şifre girişi
- E-posta doğrulama gerekirse VerifyEmail sayfasına yönlendirme
- Kayıt ve şifre sıfırlama linkleri

---

#### `frontend/src/pages/Register.js`
**Amaç**: Yeni kullanıcı kayıt sayfası.

**Özellikler:**
- Kullanıcı adı, e-posta, şifre, ad, soyad girişi
- Şifre güç kontrolü
- Kayıt sonrası VerifyEmail sayfasına yönlendirme

---

#### `frontend/src/pages/VerifyEmail.js`
**Amaç**: E-posta doğrulama sayfası.

**Özellikler:**
- 6 haneli doğrulama kodu girişi
- Kod yeniden gönderme
- Doğrulama sonrası Login sayfasına yönlendirme

---

#### `frontend/src/pages/ForgotPassword.js`
**Amaç**: Şifre sıfırlama isteği sayfası.

**Özellikler:**
- E-posta adresi girişi
- Şifre sıfırlama kodu gönderme
- Kod sonrası ResetPassword sayfasına yönlendirme

---

#### `frontend/src/pages/ResetPassword.js` / `PasswordReset.js`
**Amaç**: Şifre sıfırlama sayfası.

**Özellikler:**
- 6 haneli kod ve yeni şifre girişi
- Şifre güç kontrolü
- Şifre sıfırlama sonrası Login sayfasına yönlendirme

---

#### `frontend/src/pages/Profile.js`
**Amaç**: Kullanıcı profil yönetimi sayfası.

**Özellikler:**
- Profil bilgilerini görüntüleme (username, email, ad, soyad)
- Profil bilgilerini güncelleme
- Şifre değiştirme

---

### 🧩 Bileşenler (Components)

#### `frontend/src/components/Layout.js`
**Amaç**: Ana layout bileşeni (navbar ve outlet).

**Özellikler:**
- **Navigation Bar**:
  - Logo/Başlık
  - Dashboard linki
  - İstatistikler linki
  - Profil linki
  - Admin Paneli linki (sadece admin için)
  - Çıkış butonu
- **Outlet**: Alt route'lar için içerik alanı (React Router)

**Methodlar:**
- `handleLogout()`: Kullanıcı çıkışı yapar

---

#### `frontend/src/components/PrivateRoute.js`
**Amaç**: Korumalı route bileşeni.

**Özellikler:**
- Kullanıcı giriş yapmamışsa Login sayfasına yönlendirir
- Yükleme durumunda loading gösterir
- Giriş yapılmışsa children'ı render eder

---

#### `frontend/src/components/TaskCard.js`
**Amaç**: Tek bir görev kartı bileşeni.

**Özellikler:**
- Görev bilgileri (başlık, açıklama, kategori, durum, öncelik, tarih)
- Admin için görev sahibi bilgisi
- Durum butonları (tamamlandı, devam ediyor, bekleyen)
- İptal butonu
- Düzenle ve sil butonları
- Eklentiler listesi (varsa)
  - Dosya adı, boyutu, yüklenme tarihi
  - İndir ve önizle butonları

**Methodlar:**
- `getStatusBasedCardColor()`: Duruma göre kart rengi
- `getTimeBasedCardColor()`: Bitiş tarihine göre kart rengi (süre yaklaşıyorsa)
- `shouldShowRibbon()`: Süresi yaklaşan görevler için kurdele gösterimi
- `getRibbonInfo()`: Kurdele bilgisi (kaç saat/gün kaldı)

**Görsel Özellikler:**
- Durum renkleri: Yeşil (tamamlandı), Mavi (devam ediyor), Gri (bekleyen), Kırmızı (iptal)
- Süreye göre renk: Kırmızı (süresi geçmiş), Turuncu (yakında), Sarı (orta), Mavi (uzak)
- Animasyonlu kurdele (süresi yaklaşan görevler için)

---

#### `frontend/src/components/TaskModal.js`
**Amaç**: Görev oluşturma/düzenleme modal bileşeni.

**Özellikler:**
- Form alanları: Başlık, açıklama, kategori, öncelik, bitiş tarihi, bitiş saati
- **Admin için**: Kullanıcı seçim dropdown'ı (zorunlu)
- Dosya yükleme: Çoklu dosya seçimi, dosya önizleme, seçilen dosyaları kaldırma
- Mevcut eklentiler: Listeleme, indirme, önizleme, silme
- Validasyon: Başlık zorunlu, tarih en az 30 dakika sonrası

**Methodlar:**
- `handleFileSelect()`: Dosya seçimi ve validasyonu (boyut max 10MB, tür: PDF, PNG, JPG, DOCX, XLSX)
- `removeSelectedFile()`: Seçilen dosyayı listeden kaldırır
- `handleDeleteAttachment()`: Mevcut eklentiyi siler (onay ile)
- `loadAttachments()`: Göreve ait eklentileri yükler (API'den)
- `validateForm()`: Form validasyonu
  - Başlık zorunlu
  - Admin için kullanıcı seçimi zorunlu
  - Tarih en az 30 dakika sonrası olmalı
- `handleSubmit()`: Form gönderimi (create veya update)
  - Temiz `taskData` oluşturur (sadece gerekli alanlar)
  - Tarih varsa ISO formatına çevirir
  - Admin için `assigned_user_id` ekler (parseInt ile)
  - Normal kullanıcılar için `assigned_user_id` gönderilmez
  - `onSave(taskData, selectedFiles)` çağrılır

**Admin Özellikleri:**
- Kullanıcı seçim dropdown'ı (zorunlu, "Kullanıcı seçin..." placeholder)
- `users` state'i ile kullanıcı listesi yüklenir (`taskService.getUsers()`)
- Seçilen kullanıcıya görev atanır (`assigned_user_id` ile)
- "Kendime ata" seçeneği kaldırılmıştır (admin mutlaka bir kullanıcı seçmelidir)

---

## 🔄 Veri Akışı

### Görev Oluşturma Akışı:
1. Kullanıcı TaskModal'da formu doldurur (admin için kullanıcı seçer - zorunlu)
2. TaskModal `handleSubmit()`:
   - Form validasyonu yapılır
   - Temiz `taskData` oluşturulur (sadece gerekli alanlar)
   - Admin için `assigned_user_id` eklenir
   - `onSave(taskData, selectedFiles)` çağrılır
3. Dashboard `handleCreateTask()`:
   - `taskService.createTask(taskData)` ile görev oluşturulur
   - Backend'den response döner (TaskSerializer ile, ID dahil)
   - Görev ID'si alınır (response.data.id, fallback mekanizması ile)
4. Dosyalar varsa `attachmentService.uploadAttachment()` ile sırayla yüklenir
5. Her dosya yükleme başarı/hata durumu loglanır
6. Dosyalar yüklendikten sonra 1 saniye beklenir (backend işleme süresi)
7. `fetchTasks()` ile görevler yeniden yüklenir (attachments dahil)
8. Oluşturulan görev ve attachments'larının geldiği kontrol edilir

### Görev Güncelleme Akışı:
1. Kullanıcı TaskCard'da "Düzenle" butonuna tıklar
2. TaskModal açılır, mevcut görev bilgileri yüklenir
3. Kullanıcı değişiklikleri yapar
4. Form submit edilir → `Dashboard.handleUpdateTask()`
5. `taskService.updateTask()` ile görev güncellenir
6. Yeni dosyalar varsa yüklenir
7. Görevler yeniden yüklenir

### Authentication Akışı:
1. Kullanıcı kayıt olur → `register()`
2. 6 haneli kod e-postaya gönderilir
3. Kullanıcı kodu girer → `verify_email()`
4. Kullanıcı aktif hale gelir
5. Kullanıcı giriş yapar → `login()`
6. JWT token'lar alınır (access + refresh)
7. Token localStorage'a kaydedilir
8. Her API isteğinde token Authorization header'ına eklenir
9. Token süresi dolduğunda otomatik yenilenir (interceptor)

---

## 🔐 Güvenlik

### Backend:
- **JWT Authentication**: Tüm API endpoint'leri kimlik doğrulama gerektirir
- **Permission Classes**: Görev sahibi veya admin kontrolü
- **Password Validation**: Güçlü şifre gereksinimleri
- **Email Verification**: E-posta doğrulama zorunlu
- **CORS**: Sadece izin verilen origin'lerden istek kabul edilir

### Frontend:
- **Private Routes**: Korumalı sayfalar
- **Token Storage**: localStorage'da token saklama
- **Auto Token Refresh**: Token süresi dolunca otomatik yenileme
- **Error Handling**: API hatalarında kullanıcıya bildirim

---

## 📊 Veritabanı Şeması

### User (Django built-in)
- id, username, email, password, first_name, last_name, is_active, date_joined

### UserProfile
- id, user_id (OneToOne), role, verification_token, reset_token, email_verified

### Task
- id, title, description, category, status, priority, due_date, created_at, updated_at, user_id (ForeignKey)

### TaskAttachment
- id, task_id (ForeignKey), file (FileField), original_filename, file_size, uploaded_at, uploaded_by_id (ForeignKey)

---

## 🚀 API Endpoint Özeti

### Authentication:
- `POST /api/auth/register/` - Kayıt
- `POST /api/auth/login/` - Giriş
- `POST /api/auth/logout/` - Çıkış
- `POST /api/auth/refresh/` - Token yenileme
- `POST /api/auth/verify-email/` - E-posta doğrulama
- `POST /api/auth/resend-verification-code/` - Kod yeniden gönderme
- `POST /api/auth/request-password-reset/` - Şifre sıfırlama isteği
- `POST /api/auth/reset-password/` - Şifre sıfırlama
- `GET /api/auth/profile/` - Profil bilgileri
- `PUT /api/auth/profile/` - Profil güncelleme
- `POST /api/auth/change-password/` - Şifre değiştirme

### Tasks:
- `GET /api/tasks/` - Görev listesi
- `POST /api/tasks/` - Görev oluşturma
- `GET /api/tasks/{id}/` - Görev detayı
- `PATCH /api/tasks/{id}/` - Görev güncelleme
- `DELETE /api/tasks/{id}/` - Görev silme
- `PATCH /api/tasks/{id}/mark_completed/` - Tamamlandı işaretle
- `PATCH /api/tasks/{id}/mark_in_progress/` - Devam ediyor işaretle
- `GET /api/tasks/stats/` - İstatistikler
- `GET /api/tasks/recent/` - Son görevler
- `GET /api/tasks/overdue/` - Süresi geçen görevler
- `GET /api/tasks/all_tasks/` - Tüm görevler (admin)
- `GET /api/tasks/users/` - Tüm kullanıcılar (admin)
- `PATCH /api/tasks/{id}/assign/` - Görev atama (admin)

### Attachments:
- `GET /api/tasks/attachments/` - Eklenti listesi
- `POST /api/tasks/attachments/` - Eklenti yükleme
- `GET /api/tasks/attachments/{id}/` - Eklenti detayı
- `DELETE /api/tasks/attachments/{id}/` - Eklenti silme
- `GET /api/tasks/attachments/{id}/download/` - Eklenti indirme
- `GET /api/tasks/attachments/{id}/preview/` - Eklenti önizleme
- `GET /api/tasks/attachments/by_task/?task_id={id}` - Göreve ait eklentiler

---

## 🎯 Önemli Notlar

1. **Dosya Yükleme**: FormData kullanılır, multipart/form-data content-type
2. **Token Yönetimi**: Access token 1 saat, refresh token 7 gün geçerli
3. **Dosya Boyutu**: Maksimum 10MB per dosya
4. **Dosya Türleri**: PDF, PNG, JPG, DOCX, XLSX
5. **E-posta Doğrulama**: 6 haneli kod, 3 dakika geçerli
6. **Şifre Sıfırlama**: 6 haneli kod, 3 dakika geçerli
7. **Admin Kontrolleri**: Backend'de `IsAdmin` permission class ile kontrol edilir
8. **Role-Based Access**: Normal kullanıcılar sadece kendi görevlerini görür, admin tüm görevleri görür

---

## 📝 Kullanılan Teknolojiler

### Backend:
- Django 4.x
- Django REST Framework
- JWT (Simple JWT)
- PostgreSQL/SQLite
- Pillow (dosya işleme)

### Frontend:
- React 18.x
- React Router DOM
- Axios
- Chart.js (istatistik grafikleri)
- React Hot Toast (bildirimler)
- Lucide React (ikonlar)
- Tailwind CSS (stil)

---

Bu dokümantasyon, projenin tüm dosyalarını, methodlarını ve bağlantılarını detaylı bir şekilde açıklamaktadır. Herhangi bir sorunuz veya eksik gördüğünüz bir nokta varsa lütfen bildirin.
