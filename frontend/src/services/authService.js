import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kimlik doğrulama token'ını eklemek için istek interceptor'ı
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token yenilemeyi işlemek için yanıt interceptor'ı
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Yeni token ile orijinal isteği yeniden dene
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Yenileme başarısız, giriş sayfasına yönlendir
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      });
      toast.success('Giriş başarılı!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Giriş yapılırken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      toast.success('Kayıt başarılı!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Kayıt olurken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  logout: async (refreshToken) => {
    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
      toast.success('Çıkış yapıldı');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh/', { refresh: refreshToken });
  },

  verifyEmail: async (data) => {
    try {
      const response = await api.post('/auth/verify-email/', data);
      toast.success('E-posta adresi başarıyla doğrulandı!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'E-posta doğrulama sırasında bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/request-password-reset/', { email });
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Şifre sıfırlama talebi sırasında bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await api.post('/auth/reset-password/', data);
      toast.success('Şifre başarıyla sıfırlandı!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Şifre sıfırlama sırasında bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  // Profil yönetimi
  getProfile: async () => {
    try {
      console.log('DEBUG: getProfile çağrıldı');
      const token = localStorage.getItem('access_token');
      console.log('DEBUG: Access token:', token ? 'Mevcut' : 'Yok');

      const response = await api.get('/auth/profile/');
      console.log('DEBUG: Profile response:', response.data);
      return response;
    } catch (error) {
      console.error('DEBUG: getProfile error:', error);
      console.error('DEBUG: Error response:', error.response?.data);
      const message = error.response?.data?.error || 'Profil bilgileri yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile/', profileData);
      toast.success('Profil başarıyla güncellendi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Profil güncellenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password/', passwordData);
      toast.success('Şifre başarıyla değiştirildi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Şifre değiştirilirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put('/auth/update-user-role/', {
        user_id: userId,
        role: role
      });
      toast.success('Kullanıcı rolü başarıyla güncellendi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Rol güncellenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  resendVerificationCode: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification-code/', { email });
      toast.success('Yeni doğrulama kodu gönderildi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Kod gönderilirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },
};

export const taskService = {
  getTasks: async (params = {}) => {
    try {
      const response = await api.get('/tasks/', { params });
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görevler yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getTask: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}/`);
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  createTask: async (taskData) => {
    try {
      console.log('createTask - Sending data:', JSON.stringify(taskData, null, 2));
      const response = await api.post('/tasks/', taskData);
      console.log('createTask - Success response:', response);
      toast.success('Görev başarıyla oluşturuldu!');
      return response;
    } catch (error) {
      console.error('createTask - Error:', error);
      console.error('createTask - Error response:', error.response?.data);
      console.error('createTask - Error status:', error.response?.status);

      // Detaylı hata mesajı
      let message = 'Görev oluşturulurken bir hata oluştu';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          message = errorData.error;
        } else if (errorData.detail) {
          message = errorData.detail;
        } else if (typeof errorData === 'string') {
          message = errorData;
        } else if (Array.isArray(errorData)) {
          message = errorData.join(', ');
        } else {
          // Field errors
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors.push(`${key}: ${errorData[key].join(', ')}`);
            } else if (typeof errorData[key] === 'string') {
              fieldErrors.push(`${key}: ${errorData[key]}`);
            } else {
              fieldErrors.push(`${key}: ${JSON.stringify(errorData[key])}`);
            }
          });
          if (fieldErrors.length > 0) {
            message = fieldErrors.join(' | ');
          }
        }
      }
      toast.error(message);
      throw error;
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const response = await api.patch(`/tasks/${id}/`, taskData);
      toast.success('Görev başarıyla güncellendi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev güncellenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}/`);
      toast.success('Görev başarıyla silindi!');
    } catch (error) {
      const message = error.response?.data?.error || 'Görev silinirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  markCompleted: async (id) => {
    try {
      const response = await api.patch(`/tasks/${id}/mark_completed/`);
      toast.success('Görev tamamlandı olarak işaretlendi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev durumu güncellenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  markInProgress: async (id) => {
    try {
      const response = await api.patch(`/tasks/${id}/mark_in_progress/`);
      toast.success('Görev devam ediyor olarak işaretlendi!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev durumu güncellenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getStats: async (params = {}) => {
    try {
      const response = await api.get('/tasks/stats/', { params });
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'İstatistikler yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getRecentTasks: async () => {
    try {
      const response = await api.get('/tasks/recent/');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Son görevler yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getOverdueTasks: async () => {
    try {
      const response = await api.get('/tasks/overdue/');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Süresi geçen görevler yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/tasks/users/');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Kullanıcılar yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  // Admin fonksiyonları
  getAllTasks: async () => {
    try {
      const response = await api.get('/tasks/all_tasks/');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Tüm görevler yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/tasks/users/');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Kullanıcılar yüklenirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

  assignTask: async (taskId, userId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/assign/`, { user_id: userId });
      toast.success('Görev başarıyla atandı!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev atanırken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },

};

export const attachmentService = {
  uploadAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Görev ID'sinin tam sayı olarak gönderildiğinden emin ol
      formData.append('task', parseInt(taskId, 10));

      console.log('Uploading file:', file.name, 'to task:', taskId);

      const response = await api.post('/tasks/attachments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(`${file.name} başarıyla yüklendi!`);
      return response;
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);

      let message = 'Dosya yüklenirken bir hata oluştu';
      if (error.response?.data) {
        // İç içe hata mesajlarını kontrol et
        if (error.response.data.file) {
          message = Array.isArray(error.response.data.file)
            ? error.response.data.file[0]
            : error.response.data.file;
        } else if (error.response.data.task) {
          message = Array.isArray(error.response.data.task)
            ? error.response.data.task[0]
            : error.response.data.task;
        } else if (error.response.data.error) {
          message = error.response.data.error;
        } else if (error.response.data.detail) {
          message = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          message = error.response.data;
        } else if (error.response.data.non_field_errors) {
          message = Array.isArray(error.response.data.non_field_errors)
            ? error.response.data.non_field_errors[0]
            : error.response.data.non_field_errors;
        }
      } else if (error.message) {
        message = error.message;
      }

      toast.error(`${file.name}: ${message}`);
      throw error;
    }
  },

  getAttachments: async (taskId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('getAttachments - Fetching for task:', taskId);
      }
      const response = await api.get(`/tasks/attachments/by_task/?task_id=${taskId}`);
      if (process.env.NODE_ENV === 'development') {
        console.log('getAttachments - Response:', response);
        console.log('getAttachments - Response data:', response.data);
      }
      return response;
    } catch (error) {
      console.error('getAttachments - Error:', error);
      if (error.response?.status !== 404) {
        console.error('getAttachments - Error response:', error.response?.data);
        const message = error.response?.data?.error || 'Dosyalar yüklenirken bir hata oluştu';
        toast.error(message);
      }
      throw error;
    }
  },

  downloadAttachment: async (attachmentId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/tasks/attachments/${attachmentId}/download/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Dosya indirilemedi');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Content-Disposition başlığından dosya adını al
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `attachment_${attachmentId}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Dosya indirildi!');
    } catch (error) {
      toast.error('Dosya indirilemedi');
      throw error;
    }
  },

  previewAttachment: async (attachmentId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/tasks/attachments/${attachmentId}/preview/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Dosya görüntülenemedi');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Dosya görüntülenemedi');
      throw error;
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      await api.delete(`/tasks/attachments/${attachmentId}/`);
      toast.success('Dosya başarıyla silindi!');
    } catch (error) {
      const message = error.response?.data?.error || 'Dosya silinirken bir hata oluştu';
      toast.error(message);
      throw error;
    }
  },
};

export default api;
