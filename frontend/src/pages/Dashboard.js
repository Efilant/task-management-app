import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, CheckCircle, Circle, AlertCircle, X, User } from 'lucide-react';
import { taskService, attachmentService } from '../services/authService';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    user: 'all',
  });
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, searchTerm, filters, sortBy]);

  const fetchUsers = async () => {
    try {
      const response = await taskService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskService.getTasks();
      const tasks = response.data.results || response.data;
      // Hata ayıklama: Eklentilerin dahil olup olmadığını kontrol et
      if (process.env.NODE_ENV === 'development' && tasks.length > 0) {
        console.log('Sample task with attachments:', tasks[0]);
        console.log('Attachments in task:', tasks[0].attachments);
        console.log('Attachments type:', typeof tasks[0].attachments);
        console.log('Is array:', Array.isArray(tasks[0].attachments));
      }
      setTasks(tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Arama filtresi (başlık, açıklama, kullanıcı adı ve e-posta)
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.user_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Öncelik filtresi
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Kategori filtresi
    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Kullanıcı filtresi
    if (filters.user !== 'all') {
      filtered = filtered.filter(task => task.user === parseInt(filters.user));
    }

    // Sıralama
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'due_date':
          return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (taskData, files = []) => {
    try {
      console.log('Creating task with data:', JSON.stringify(taskData, null, 2));
      console.log('Files to upload:', files.length);

      const response = await taskService.createTask(taskData);
      console.log('Task created response:', response);
      console.log('Task created response.data:', response.data);
      console.log('Task created response.data.id:', response.data?.id);

      // ID'yi farklı şekillerde almayı dene
      const taskId = response.data?.id || response.data?.pk || response.id || response.pk;
      console.log('Created task ID (after fallback):', taskId);

      if (!taskId) {
        toast.error('Görev oluşturuldu ama ID alınamadı!');
        await fetchTasks();
        setShowModal(false);
        return;
      }

      // Varsa dosyaları yükle
      let uploadSuccessCount = 0;
      let uploadFailCount = 0;

      if (files.length > 0 && taskId) {
        console.log(`Starting to upload ${files.length} files to task ${taskId}`);

        for (const file of files) {
          try {
            console.log('Uploading file to task:', taskId, 'File:', file.name, 'Size:', file.size);
            const uploadResponse = await attachmentService.uploadAttachment(taskId, file);
            uploadSuccessCount++;
            console.log('File uploaded successfully:', file.name, 'Response:', uploadResponse);
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            uploadFailCount++;
            // Biri başarısız olsa bile diğer dosyalara devam et
          }
        }

        if (uploadSuccessCount > 0 && uploadFailCount === 0) {
          toast.success(`${uploadSuccessCount} dosya başarıyla yüklendi!`);
        } else if (uploadSuccessCount > 0 && uploadFailCount > 0) {
          toast.error(`${uploadSuccessCount} dosya yüklendi, ${uploadFailCount} dosya başarısız oldu`);
        } else if (uploadFailCount > 0 && uploadSuccessCount === 0) {
          toast.error('Tüm dosyalar yüklenirken hata oluştu!');
        }
      } else if (files.length > 0) {
        console.warn('Files selected but no taskId available, taskId:', taskId);
      }

      // Dosyalar yüklendiyse biraz bekle (backend'de işlenmesi için)
      if (files.length > 0 && uploadSuccessCount > 0) {
        console.log('Waiting for backend to process attachments...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Görevleri yeniden yükle (attachments dahil)
      console.log('Refreshing tasks list after creation...');
      await fetchTasks();

      // Attachments'ların geldiğini kontrol et
      if (taskId && files.length > 0) {
        const createdTask = tasks.find(t => t.id === taskId);
        if (createdTask) {
          console.log('Created task found in list:', createdTask);
          console.log('Task attachments:', createdTask.attachments);
        } else {
          console.warn('Created task not found in list, taskId:', taskId);
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));

      // Daha detaylı hata mesajı
      let errorMessage = 'Görev oluşturulurken bir hata oluştu';
      if (error.response?.data) {
        const errorData = error.response.data;
        // Nested error mesajlarını kontrol et
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.join(', ');
        } else {
          // Field errors'ı birleştir
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors.push(`${key}: ${errorData[key].join(', ')}`);
            } else {
              fieldErrors.push(`${key}: ${errorData[key]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(' | ');
          }
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleUpdateTask = async (taskData, files = []) => {
    try {
      const response = await taskService.updateTask(editingTask.id, taskData);
      const taskId = editingTask.id;

      // Upload new files if any
      if (files.length > 0 && taskId) {
        let uploadSuccessCount = 0;
        let uploadFailCount = 0;
        for (const file of files) {
          try {
            console.log('Uploading file to task:', taskId, 'File:', file.name);
            await attachmentService.uploadAttachment(taskId, file);
            uploadSuccessCount++;
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            console.error('Error details:', error.response?.data);
            uploadFailCount++;
            // Biri başarısız olsa bile diğer dosyalara devam et
          }
        }
        if (uploadSuccessCount > 0 && uploadFailCount === 0) {
          toast.success(`${uploadSuccessCount} dosya başarıyla yüklendi!`);
        } else if (uploadSuccessCount > 0 && uploadFailCount > 0) {
          toast.error(`${uploadSuccessCount} dosya yüklendi, ${uploadFailCount} dosya başarısız oldu`);
        }
      }

      // Görevleri yeniden yükle
      await fetchTasks();

      setShowModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Görev güncellenirken bir hata oluştu';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      // Görevleri yeniden yükle
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      let response;
      if (newStatus === 'completed') {
        response = await taskService.markCompleted(taskId);
      } else if (newStatus === 'in_progress') {
        response = await taskService.markInProgress(taskId);
      } else {
        response = await taskService.updateTask(taskId, { status: newStatus });
      }

      // Görevleri yeniden yükle
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const getStatusCounts = () => {
    return {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      in_progress: tasks.filter(task => task.status === 'in_progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Görev Yönetim Merkezi</h1>
        <p className="text-gray-600">
          {isAdmin
            ? 'Tüm görevleri yönetin ve takip edin (Admin)'
            : `Kendi görevlerinizi yönetin ve takip edin (${user?.username || 'Kullanıcı'})`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Circle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Görev</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Devam Ediyor</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.in_progress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">İptal Edilmiş</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Görevlerde ara..."
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtreler:</span>
              </div>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">📋 Tüm Durumlar</option>
                <option value="pending">⏳ Bekleyen</option>
                <option value="in_progress">🔄 Devam Ediyor</option>
                <option value="completed">✅ Tamamlanan</option>
                <option value="cancelled">❌ İptal Edildi</option>
              </select>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="all">⚡ Tüm Öncelikler</option>
                <option value="urgent">🚨 Acil</option>
                <option value="high">🔴 Yüksek</option>
                <option value="medium">🟡 Orta</option>
                <option value="low">🟢 Düşük</option>
              </select>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="all">📂 Tüm Kategoriler</option>
                <option value="work">💼 İş</option>
                <option value="personal">👤 Kişisel</option>
                <option value="shopping">🛒 Alışveriş</option>
                <option value="health">🏥 Sağlık</option>
                <option value="education">📚 Eğitim</option>
                <option value="finance">💰 Finans</option>
                <option value="travel">✈️ Seyahat</option>
                <option value="other">📝 Diğer</option>
              </select>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">📅 En Yeni</option>
                <option value="due_date">⏰ Bitiş Tarihi</option>
                <option value="priority">⚡ Öncelik</option>
                <option value="title">🔤 Alfabetik</option>
              </select>

              {isAdmin && (
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                >
                  <option value="all">👤 Tüm Kişiler</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Görev
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Circle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Görev bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(f => f !== 'all')
              ? 'Arama kriterlerinize uygun görev bulunamadı.'
              : 'Henüz görev eklenmemiş. İlk görevinizi eklemek için yukarıdaki butona tıklayın.'}
          </p>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={closeModal}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}
    </div>
  );
};

export default Dashboard;
