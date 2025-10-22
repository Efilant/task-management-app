import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
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

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
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

  // Profile management
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
      const response = await api.post('/tasks/', taskData);
      toast.success('Görev başarıyla oluşturuldu!');
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Görev oluşturulurken bir hata oluştu';
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

  getStats: async () => {
    try {
      const response = await api.get('/tasks/stats/');
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

};

export default api;
