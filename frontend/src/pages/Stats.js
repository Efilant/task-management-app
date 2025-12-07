import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { taskService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Calendar, TrendingUp, Target, AlertCircle, X, User } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const getCategoryName = (category) => {
  const categoryNames = {
    work: 'İş',
    personal: 'Kişisel',
    shopping: 'Alışveriş',
    health: 'Sağlık',
    education: 'Eğitim',
    finance: 'Finans',
    travel: 'Seyahat',
    other: 'Diğer',
  };
  return categoryNames[category] || category;
};

const Stats = () => {
  const { isAdmin, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('work'); // Varsayılan kategori
  const [categoryTasks, setCategoryTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    fetchStats();
  }, [isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [selectedUserId, isAdmin]);

  useEffect(() => {
    if (stats) {
      fetchCategoryTasks();
    }
  }, [selectedCategory, stats, selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await taskService.getUsers();
      setUsers(response.data || []);
      // İlk kullanıcıyı varsayılan olarak seç
      if (response.data && response.data.length > 0) {
        setSelectedUserId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const params = isAdmin && selectedUserId ? { user_id: selectedUserId } : {};
      const response = await taskService.getStats(params);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchCategoryTasks = async () => {
    try {
      const response = await taskService.getTasks();
      const tasks = response.data.results || response.data;
      // Admin seçili kullanıcı için filtrele
      let filteredTasks = tasks;
      if (isAdmin && selectedUserId) {
        filteredTasks = tasks.filter(task => task.user === parseInt(selectedUserId) || task.user_id === parseInt(selectedUserId));
      }
      filteredTasks = filteredTasks.filter(task => task.category === selectedCategory);
      setCategoryTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching category tasks:', error);
    }
  };

  // Kategoriye göre tamamlanma grafiği verisi
  const getCategoryCompletionData = () => {
    const completed = categoryTasks.filter(task => task.status === 'completed').length;
    const notCompleted = categoryTasks.filter(task => task.status !== 'completed').length;

    // Eğer hiç görev yoksa boş grafik göster
    if (categoryTasks.length === 0) {
      return {
        labels: ['Görev Yok'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#E5E7EB'],
            borderColor: ['#9CA3AF'],
            borderWidth: 2,
          },
        ],
      };
    }

    return {
      labels: ['Tamamlanmış', 'Tamamlanmamış'],
      datasets: [
        {
          data: [completed, notCompleted],
          backgroundColor: ['#10B981', '#F59E0B'],
          borderColor: ['#059669', '#D97706'],
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">İstatistikler yüklenemedi</h3>
        <p className="mt-1 text-sm text-gray-500">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  // Görev durumu dağılımı için grafik verisi
  const statusData = {
    labels: ['Bekleyen', 'Devam Ediyor', 'Tamamlanan', 'İptal Edilmiş'],
    datasets: [
      {
        data: [stats.pending_tasks, stats.in_progress_tasks, stats.completed_tasks, stats.cancelled_tasks],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Öncelik dağılımı için grafik verisi
  const priorityData = {
    labels: ['Düşük', 'Orta', 'Yüksek', 'Acil'],
    datasets: [
      {
        label: 'Görev Sayısı',
        data: [
          stats.priority_stats.find(p => p.priority === 'low')?.count || 0,
          stats.priority_stats.find(p => p.priority === 'medium')?.count || 0,
          stats.priority_stats.find(p => p.priority === 'high')?.count || 0,
          stats.priority_stats.find(p => p.priority === 'urgent')?.count || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Kategori dağılımı için grafik verisi
  const categoryData = {
    labels: stats.category_stats.map(cat => {
      const categoryNames = {
        work: 'İş',
        personal: 'Kişisel',
        shopping: 'Alışveriş',
        health: 'Sağlık',
        education: 'Eğitim',
        finance: 'Finans',
        travel: 'Seyahat',
        other: 'Diğer',
      };
      return categoryNames[cat.category] || cat.category;
    }),
    datasets: [
      {
        data: stats.category_stats.map(cat => cat.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const selectedUser = isAdmin && selectedUserId
    ? users.find(u => u.id === parseInt(selectedUserId))
    : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İstatistikler</h1>
            <p className="text-gray-600">
              {isAdmin && selectedUser
                ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''} (${selectedUser.username}) - Görev performansını analiz edin`
                : 'Görev performansınızı analiz edin'}
            </p>
          </div>

          {/* Admin: User Selection */}
          {isAdmin && users.length > 0 && (
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {users.map(userItem => (
                  <option key={userItem.id} value={userItem.id}>
                    {userItem.first_name || ''} {userItem.last_name || ''} ({userItem.username})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Görev</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tamamlanma Oranı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completion_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Süresi Geçen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue_tasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
              <p className="text-2xl font-bold text-gray-900">{stats.due_this_week}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled_tasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Görev Durumu Dağılımı</h3>
          <div className="h-64">
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Öncelik Dağılımı</h3>
          <div className="h-64">
            <Bar data={priorityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Dağılımı</h3>
        <div className="h-64">
          <Doughnut data={categoryData} options={chartOptions} />
        </div>
      </div>

      {/* Category Completion Chart */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kategoriye Göre Tamamlanma Durumu</h3>
          <div className="flex items-center space-x-2">
            <label htmlFor="categorySelect" className="text-sm font-medium text-gray-700">
              Kategori:
            </label>
            <select
              id="categorySelect"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="work">💼 İş</option>
              <option value="personal">👤 Kişisel</option>
              <option value="shopping">🛒 Alışveriş</option>
              <option value="health">🏥 Sağlık</option>
              <option value="education">📚 Eğitim</option>
              <option value="finance">💰 Finans</option>
              <option value="travel">✈️ Seyahat</option>
              <option value="other">📝 Diğer</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>{getCategoryName(selectedCategory)}</strong> kategorisinde toplam <strong>{categoryTasks.length}</strong> görev bulunmaktadır.
          </p>
        </div>

        <div className="h-64">
          <Doughnut data={getCategoryCompletionData()} options={chartOptions} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {categoryTasks.filter(task => task.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Tamamlanmış</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {categoryTasks.filter(task => task.status !== 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Tamamlanmamış</div>
          </div>
        </div>

        {/* Kategoriye göre detaylı durum */}
        {categoryTasks.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Detaylı Durum</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {categoryTasks.filter(task => task.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-600">Bekleyen</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {categoryTasks.filter(task => task.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-600">Devam Ediyor</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {categoryTasks.filter(task => task.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-600">Tamamlanmış</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {categoryTasks.filter(task => task.status === 'cancelled').length}
                </div>
                <div className="text-xs text-gray-600">İptal Edilmiş</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Bugün Biten Görevler</h4>
          <p className="text-3xl font-bold text-blue-600">{stats.due_today}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Bu Hafta Biten Görevler</h4>
          <p className="text-3xl font-bold text-blue-600">{stats.due_this_week}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Süresi Geçen Görevler</h4>
          <p className="text-3xl font-bold text-red-600">{stats.overdue_tasks}</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
