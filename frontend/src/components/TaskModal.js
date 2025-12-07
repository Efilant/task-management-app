import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Paperclip, Trash2, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { attachmentService, taskService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TaskModal = ({ task, onClose, onSave }) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    due_date: '',
    due_time: '',
    assigned_user_id: null,
  });

  const [errors, setErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (task) {
      if (process.env.NODE_ENV === 'development') {
        console.log('TaskModal - Task loaded:', task);
        console.log('TaskModal - Task attachments:', task.attachments);
      }

      const taskDate = task.due_date ? new Date(task.due_date) : null;
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'other',
        priority: task.priority || 'medium',
        due_date: taskDate ? format(taskDate, 'yyyy-MM-dd') : '',
        due_time: taskDate ? format(taskDate, 'HH:mm') : '',
        assigned_user_id: task.user_id || null,
      });

      // Düzenlemede her zaman en güncel veriyi almak için eklentileri yükle
      if (task.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log('TaskModal - Loading attachments for task ID:', task.id);
        }
        // Önce task.attachments varsa onu ayarla (anında görüntüleme için)
        if (task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('TaskModal - Setting attachments from task:', task.attachments);
          }
          setExistingAttachments(task.attachments);
        }
        // Sonra API'den taze veri yükle (farklıysa bu üzerine yazacak)
        loadAttachments(task.id);
      } else if (task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('TaskModal - Setting attachments from task (no ID):', task.attachments);
        }
        setExistingAttachments(task.attachments);
      } else {
        setExistingAttachments([]);
      }
    } else {
      setExistingAttachments([]);
    }
    setSelectedFiles([]);
  }, [task]);

  const loadUsers = async () => {
    try {
      const response = await taskService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAttachments = async (taskId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading attachments for task:', taskId);
      }
      const response = await attachmentService.getAttachments(taskId);

      if (process.env.NODE_ENV === 'development') {
        console.log('Attachments response:', response);
        console.log('Attachments data:', response.data);
      }

      if (response.data) {
        // Hem array hem de object yanıtlarını işle
        const attachments = Array.isArray(response.data) ? response.data : (response.data.results || []);
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting attachments:', attachments);
        }
        setExistingAttachments(attachments);
      } else {
        setExistingAttachments([]);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      if (error.response?.status !== 404) {
        console.error('Error response:', error.response?.data);
      }
      // 404 durumunda eklentileri temizleme (eklenti olmaması geçerli bir durum)
      if (error.response?.status === 404) {
        setExistingAttachments([]);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Kullanıcı yazmaya başladığında hatayı temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir';
    }

    // Admin için kullanıcı seçimi zorunlu
    if (isAdmin && !formData.assigned_user_id) {
      newErrors.assigned_user_id = 'Lütfen bir kullanıcı seçin';
    }

    if (formData.due_date) {
      const selectedDate = new Date(`${formData.due_date}T${formData.due_time || '00:00'}`);
      const now = new Date();
      const minDate = new Date(now.getTime() + 30 * 60 * 1000); // 30 dakika sonrası

      if (selectedDate < minDate) {
        const minDateTime = minDate.toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        newErrors.due_date = `Görev tarihi en az ${minDateTime} tarihinden sonra olmalıdır. (En az 30 dakika sonrası)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();

      if (file.size > maxSize) {
        toast.error(`${file.name} dosyası 10MB'dan büyük!`);
        return false;
      }
      if (!allowedTypes.includes(ext)) {
        toast.error(`${file.name} desteklenmeyen dosya türü! (PDF, PNG, JPG, DOCX, XLSX)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) {
      try {
        await attachmentService.deleteAttachment(attachmentId);
        setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let dueDate = null;
    if (formData.due_date) {
      if (formData.due_time) {
        // Tarih ve saat birlikte
        dueDate = new Date(`${formData.due_date}T${formData.due_time}`).toISOString();
      } else {
        // Sadece tarih
        dueDate = new Date(formData.due_date).toISOString();
      }
    }

    // Temiz taskData oluştur
    const taskData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      category: formData.category,
      priority: formData.priority,
    };

    // Tarih varsa ekle, yoksa ekleme (null gönderilmesin)
    if (dueDate) {
      taskData.due_date = dueDate;
    }

    // Admin için assigned_user_id zorunlu olarak ekle (sadece admin için)
    if (isAdmin) {
      if (!formData.assigned_user_id) {
        setErrors({ assigned_user_id: 'Lütfen bir kullanıcı seçin' });
        return;
      }
      taskData.assigned_user_id = parseInt(formData.assigned_user_id, 10);
    }

    // Normal kullanıcılar için assigned_user_id gönderme (backend otomatik kendisine atayacak)

    console.log('TaskModal - Submitting task data:', JSON.stringify(taskData, null, 2));
    console.log('TaskModal - Is admin:', isAdmin);
    console.log('TaskModal - Assigned user ID:', taskData.assigned_user_id);

    // Görevi kaydet ve yüklenecek dosyaları geçir
    await onSave(taskData, selectedFiles);
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const categories = [
    { value: 'work', label: 'İş' },
    { value: 'personal', label: 'Kişisel' },
    { value: 'shopping', label: 'Alışveriş' },
    { value: 'health', label: 'Sağlık' },
    { value: 'education', label: 'Eğitim' },
    { value: 'finance', label: 'Finans' },
    { value: 'travel', label: 'Seyahat' },
    { value: 'other', label: 'Diğer' },
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {task ? 'Görev Düzenle' : 'Yeni Görev'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Görev başlığını girin"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Görev açıklamasını girin"
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Kategori
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Öncelik
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Admin: Assign User */}
                {isAdmin && (
                  <div>
                    <label htmlFor="assigned_user_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Kullanıcı Ata (Admin) *
                    </label>
                    <select
                      id="assigned_user_id"
                      name="assigned_user_id"
                      value={formData.assigned_user_id || ''}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.assigned_user_id ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Kullanıcı seçin...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name || ''} {user.last_name || ''} ({user.username})
                        </option>
                      ))}
                    </select>
                    {errors.assigned_user_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.assigned_user_id}</p>
                    )}
                  </div>
                )}

                {/* Due Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.due_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.due_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="due_time" className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Bitiş Saati
                    </label>
                    <input
                      type="time"
                      id="due_time"
                      name="due_time"
                      value={formData.due_time}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                    <Paperclip className="inline h-4 w-4 mr-1" />
                    Dosya Ekle (PDF, PNG, JPG, DOCX, XLSX - Max 10MB)
                  </label>
                  <input
                    type="file"
                    id="files"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Birden fazla dosya seçebilirsiniz. Her dosya en fazla 10MB olabilir.
                  </p>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <span className="text-gray-700 truncate flex-1">{file.name}</span>
                          <span className="text-gray-500 mx-2">{formatFileSize(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📎 Mevcut Dosyalar ({existingAttachments.length}):
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {existingAttachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between bg-blue-50 p-2 rounded text-sm border border-blue-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 truncate font-medium">📄 {attachment.original_filename}</p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {attachment.file_size_mb || (attachment.file_size ? formatFileSize(attachment.file_size) : '0 MB')} • {format(new Date(attachment.uploaded_at), 'dd.MM.yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <button
                                type="button"
                                onClick={() => attachmentService.downloadAttachment(attachment.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="İndir"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {(attachment.original_filename.match(/\.(pdf|png|jpg|jpeg)$/i)) && (
                                <button
                                  type="button"
                                  onClick={() => attachmentService.previewAttachment(attachment.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Önizle"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={uploading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                {uploading ? 'Yükleniyor...' : (task ? 'Güncelle' : 'Oluştur')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
