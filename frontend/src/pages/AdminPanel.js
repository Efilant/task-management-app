import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/authService';
import { Shield, Users, ListTodo, UserPlus, Search, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState(null);

  const fetchAllTasks = useCallback(async () => {
    try {
      console.log('Fetching all tasks...');
      const response = await taskService.getAllTasks();
      console.log('All tasks response:', response);
      const tasksData = response.data.results || response.data || [];
      console.log('Tasks data:', tasksData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Görevler yüklenirken bir hata oluştu');
      setTasks([]);
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      const response = await taskService.getUsers();
      console.log('Users response:', response);
      const usersData = Array.isArray(response.data) ? response.data : [];
      console.log('Users data:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu');
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && user) {
      fetchAllTasks();
      fetchUsers();
    }
  }, [isAdmin, user, fetchAllTasks, fetchUsers]);

  const handleAssignTask = async (taskId, userId) => {
    try {
      await taskService.assignTask(taskId, userId);
      toast.success('Görev başarıyla atandı!');
      setShowAssignModal(false);
      setAssigningTaskId(null);
      fetchAllTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Görev atanırken bir hata oluştu');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      try {
        await taskService.deleteTask(taskId);
        toast.success('Görev başarıyla silindi!');
        fetchAllTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Görev silinirken bir hata oluştu');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.user_username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Admin durumunu kontrol etmeden önce kullanıcının yüklenmesini bekle
  if (user === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

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
        <div className="flex items-center mb-2">
          <Shield className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
        </div>
        <p className="text-gray-600">Tüm görevleri ve kullanıcıları yönetin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ListTodo className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Görev</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Görevler</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <ListTodo className="inline h-4 w-4 mr-2" />
              Tüm Görevler ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              Kullanıcılar ({users.length})
            </button>
          </nav>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Görevlerde ara (başlık, açıklama, kullanıcı)..."
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tasks Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Görev
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öncelik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bitiş Tarihi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description || 'Açıklama yok'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{task.user_username || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{task.user_email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {task.status === 'completed' ? 'Tamamlandı' :
                            task.status === 'in_progress' ? 'Devam Ediyor' :
                              task.status === 'pending' ? 'Bekleyen' : 'İptal Edildi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.priority === 'urgent' ? '🚨 Acil' :
                          task.priority === 'high' ? '🔴 Yüksek' :
                            task.priority === 'medium' ? '🟡 Orta' : '🟢 Düşük'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setAssigningTaskId(task.id);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Görev Ata"
                          >
                            <UserPlus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Sil"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <ListTodo className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Görev bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Arama kriterlerinize uygun görev bulunamadı.' : 'Henüz görev yok.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Kullanıcı bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz kullanıcı yok.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((userItem) => (
                  <div key={userItem.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {userItem.first_name || ''} {userItem.last_name || ''}
                          {(!userItem.first_name && !userItem.last_name) && userItem.username}
                        </h3>
                        <p className="text-sm text-gray-500">{userItem.username}</p>
                        <p className="text-xs text-gray-400">{userItem.email}</p>
                      </div>
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Görev Ata</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kullanıcı Seçin
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedUser || ''}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Kullanıcı seçin...</option>
                      {users.map((userItem) => (
                        <option key={userItem.id} value={userItem.id}>
                          {userItem.first_name || ''} {userItem.last_name || ''}
                          {(!userItem.first_name && !userItem.last_name) && userItem.username} ({userItem.username})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    if (selectedUser) {
                      handleAssignTask(assigningTaskId, selectedUser);
                    } else {
                      toast.error('Lütfen bir kullanıcı seçin');
                    }
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Ata
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setAssigningTaskId(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
