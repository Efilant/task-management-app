import React, { useEffect } from 'react';
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  AlertCircle,
  PlayCircle,
  X,
  Paperclip,
  Download,
  Eye,
  User,
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInHours, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { attachmentService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { isAdmin } = useAuth();

  // Hata ayıklama: Eklentileri logla
  useEffect(() => {
    if (task) {
      console.log('TaskCard - Task ID:', task.id, 'Title:', task.title);
      console.log('TaskCard - Attachments:', task.attachments);
      console.log('TaskCard - Attachments type:', typeof task.attachments);
      console.log('TaskCard - Is array:', Array.isArray(task.attachments));
      if (task.attachments) {
        console.log('TaskCard - Attachments length:', task.attachments.length);
      }
    }
  }, [task]);

  // Güvenli tarih formatlaması fonksiyonu
  const safeFormatDate = (dateString, formatString, options = {}) => {
    try {
      if (!dateString) return 'Tarih belirtilmemiş';

      const date = new Date(dateString);

      // Geçersiz tarih kontrolü
      if (isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }

      return format(date, formatString, options);
    } catch (error) {
      console.error('Tarih formatlaması hatası:', error);
      return 'Tarih hatası';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  const getStatusBasedCardColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 shadow-green-100';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 shadow-yellow-100';
      case 'cancelled':
        return 'bg-red-50 border-red-200 shadow-red-100';
      default:
        return 'bg-gray-50 border-gray-200 shadow-gray-100';
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'work':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'personal':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'shopping':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'health':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'education':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'finance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'travel':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeBasedColor = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') {
      return 'text-gray-600';
    }

    try {
      const now = new Date();
      const due = new Date(dueDate);

      // Geçersiz tarih kontrolü
      if (isNaN(due.getTime())) {
        return 'text-gray-600';
      }

      const hoursLeft = differenceInHours(due, now);
      const daysLeft = differenceInDays(due, now);

      if (hoursLeft < 0) {
        return 'text-red-700 font-bold'; // Süresi geçmiş
      } else if (hoursLeft <= 1) {
        return 'text-red-600 font-bold'; // 1 saatten az
      } else if (hoursLeft <= 2) {
        return 'text-red-500 font-bold'; // 2 saatten az
      } else if (hoursLeft <= 6) {
        return 'text-red-500 font-semibold'; // 6 saatten az
      } else if (hoursLeft <= 12) {
        return 'text-orange-600 font-semibold'; // 12 saatten az
      } else if (hoursLeft <= 24) {
        return 'text-orange-500 font-semibold'; // 1 günden az
      } else if (daysLeft <= 2) {
        return 'text-orange-500 font-medium'; // 2 günden az
      } else if (daysLeft <= 3) {
        return 'text-yellow-600 font-medium'; // 3 günden az
      } else if (daysLeft <= 7) {
        return 'text-yellow-500 font-medium'; // 1 haftadan az
      } else if (daysLeft <= 14) {
        return 'text-blue-600 font-medium'; // 2 haftadan az
      } else if (daysLeft <= 30) {
        return 'text-blue-500 font-medium'; // 1 aydan az
      } else {
        return 'text-green-600'; // 1 aydan fazla
      }
    } catch (error) {
      console.error('Tarih hesaplama hatası:', error);
      return 'text-gray-600';
    }
  };

  const getTimeBasedCardColor = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') {
      return '';
    }

    try {
      const now = new Date();
      const due = new Date(dueDate);

      // Geçersiz tarih kontrolü
      if (isNaN(due.getTime())) {
        return '';
      }

      const hoursLeft = differenceInHours(due, now);
      const daysLeft = differenceInDays(due, now);

      if (hoursLeft < 0) {
        return 'ring-4 ring-red-400 bg-red-50'; // Süresi geçmiş
      } else if (hoursLeft <= 1) {
        return 'ring-4 ring-red-300 bg-red-25'; // 1 saatten az
      } else if (hoursLeft <= 2) {
        return 'ring-3 ring-red-200 bg-red-25'; // 2 saatten az
      } else if (hoursLeft <= 6) {
        return 'ring-2 ring-red-200 bg-red-25'; // 6 saatten az
      } else if (hoursLeft <= 12) {
        return 'ring-2 ring-orange-200 bg-orange-25'; // 12 saatten az
      } else if (hoursLeft <= 24) {
        return 'ring-2 ring-orange-200 bg-orange-25'; // 1 günden az
      } else if (daysLeft <= 2) {
        return 'ring-1 ring-orange-200 bg-orange-25'; // 2 günden az
      } else if (daysLeft <= 3) {
        return 'ring-1 ring-yellow-200 bg-yellow-25'; // 3 günden az
      } else if (daysLeft <= 7) {
        return 'ring-1 ring-yellow-200 bg-yellow-25'; // 1 haftadan az
      } else if (daysLeft <= 14) {
        return 'ring-1 ring-blue-200 bg-blue-25'; // 2 haftadan az
      } else if (daysLeft <= 30) {
        return 'ring-1 ring-blue-200 bg-blue-25'; // 1 aydan az
      } else {
        return 'ring-1 ring-green-200 bg-green-25'; // 1 aydan fazla
      }
    } catch (error) {
      console.error('Tarih hesaplama hatası:', error);
      return '';
    }
  };

  const shouldShowRibbon = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') {
      return false;
    }

    try {
      const now = new Date();
      const due = new Date(dueDate);

      // Geçersiz tarih kontrolü
      if (isNaN(due.getTime())) {
        return false;
      }

      const hoursLeft = differenceInHours(due, now);
      return hoursLeft <= 24 && hoursLeft >= 0; // 24 saat içinde bitiyor
    } catch (error) {
      console.error('Ribbon tarih hesaplama hatası:', error);
      return false;
    }
  };

  const getRibbonInfo = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') {
      return null;
    }

    try {
      const now = new Date();
      const due = new Date(dueDate);

      // Geçersiz tarih kontrolü
      if (isNaN(due.getTime())) {
        return null;
      }

      const hoursLeft = differenceInHours(due, now);
      const daysLeft = differenceInDays(due, now);

      if (hoursLeft < 0) {
        return {
          text: 'SÜRESİ GEÇMİŞ!',
          color: 'bg-red-700 text-white',
          icon: '⚠️'
        };
      } else if (hoursLeft <= 1) {
        return {
          text: '1 SAAT KALDI!',
          color: 'bg-red-600 text-white',
          icon: '🚨'
        };
      } else if (hoursLeft <= 2) {
        return {
          text: '2 SAAT KALDI!',
          color: 'bg-red-500 text-white',
          icon: '🚨'
        };
      } else if (hoursLeft <= 6) {
        return {
          text: '6 SAAT KALDI!',
          color: 'bg-red-400 text-white',
          icon: '⏰'
        };
      } else if (hoursLeft <= 12) {
        return {
          text: '12 SAAT KALDI',
          color: 'bg-orange-600 text-white',
          icon: '⏳'
        };
      } else if (hoursLeft <= 24) {
        return {
          text: 'BUGÜN BİTİYOR!',
          color: 'bg-orange-500 text-white',
          icon: '📅'
        };
      } else if (daysLeft <= 2) {
        return {
          text: '2 GÜN KALDI',
          color: 'bg-orange-400 text-white',
          icon: '📆'
        };
      } else if (daysLeft <= 3) {
        return {
          text: '3 GÜN KALDI',
          color: 'bg-yellow-500 text-white',
          icon: '📆'
        };
      } else if (daysLeft <= 7) {
        return {
          text: '1 HAFTA KALDI',
          color: 'bg-yellow-400 text-white',
          icon: '📅'
        };
      } else if (daysLeft <= 14) {
        return {
          text: '2 HAFTA KALDI',
          color: 'bg-blue-500 text-white',
          icon: '📅'
        };
      } else if (daysLeft <= 30) {
        return {
          text: '1 AY KALDI',
          color: 'bg-blue-400 text-white',
          icon: '📅'
        };
      } else {
        return {
          text: 'UZUN SÜRE VAR',
          color: 'bg-green-500 text-white',
          icon: '✅'
        };
      }
    } catch (error) {
      console.error('Ribbon bilgi hesaplama hatası:', error);
      return null;
    }
  };

  const getStatusName = (status) => {
    const statusNames = {
      pending: 'Bekleyen',
      in_progress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return statusNames[status] || status;
  };

  const getPriorityName = (priority) => {
    const priorityNames = {
      urgent: 'Acil',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
    };
    return priorityNames[priority] || priority;
  };

  const isOverdue = task.due_date && isAfter(new Date(), new Date(task.due_date)) && task.status !== 'completed';
  const isDueSoon = task.due_date && isBefore(new Date(task.due_date), addDays(new Date(), 3)) && task.status !== 'completed';

  const handleStatusClick = () => {
    if (task.status === 'completed') {
      onStatusChange(task.id, 'pending');
    } else if (task.status === 'pending') {
      onStatusChange(task.id, 'in_progress');
    } else if (task.status === 'in_progress') {
      onStatusChange(task.id, 'completed');
    }
  };

  const handleCancelClick = () => {
    onStatusChange(task.id, 'cancelled');
  };

  return (
    <div className={`relative rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 ${getStatusBasedCardColor(task.status)} ${getTimeBasedCardColor(task.due_date, task.status)} ${task.status === 'completed' ? 'opacity-75' : ''
      }`}>
      {/* Kurdele - Yaklaşan görevler için */}
      {getRibbonInfo(task.due_date, task.status) && (
        <div className={`absolute -top-2 -right-2 ${getRibbonInfo(task.due_date, task.status).color} text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 animate-pulse`}>
          {getRibbonInfo(task.due_date, task.status).icon} {getRibbonInfo(task.due_date, task.status).text}
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${task.status === 'completed' ? 'line-through' : ''
            }`}>
            {task.title}
          </h3>
          {/* Admin için görev sahibi bilgisi */}
          {isAdmin && (task.user_username || task.user_email) && (
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <User className="h-3 w-3 mr-1" />
              <span>{task.user_username || task.user_email}</span>
            </div>
          )}
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {task.status !== 'cancelled' && task.status !== 'completed' && (
            <button
              onClick={handleCancelClick}
              className="p-1 text-gray-400 hover:text-red-600"
              title="İptal Et"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 shadow-sm ${getStatusColor(task.status)}`}>
            {task.status === 'pending' && '⏳'}
            {task.status === 'in_progress' && '🔄'}
            {task.status === 'completed' && '✅'}
            {task.status === 'cancelled' && '❌'}
            <span className="ml-1">{getStatusName(task.status)}</span>
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 shadow-sm ${getPriorityColor(task.priority)}`}>
            {task.priority === 'urgent' && '🚨'}
            {task.priority === 'high' && '🔴'}
            {task.priority === 'medium' && '🟡'}
            {task.priority === 'low' && '🟢'}
            <span className="ml-1">{getPriorityName(task.priority)}</span>
          </span>
        </div>
        <button
          onClick={handleStatusClick}
          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${task.status === 'completed'
            ? 'bg-green-100 text-green-600 hover:bg-green-200 shadow-lg'
            : task.status === 'in_progress'
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-lg'
              : task.status === 'cancelled'
                ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-lg'
            }`}
        >
          {task.status === 'completed' ? (
            <CheckCircle className="h-6 w-6" />
          ) : task.status === 'in_progress' ? (
            <PlayCircle className="h-6 w-6" />
          ) : task.status === 'cancelled' ? (
            <X className="h-6 w-6" />
          ) : (
            <Circle className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Category */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 shadow-sm ${getCategoryBadgeColor(task.category)}`}>
          {task.category === 'work' && '💼'}
          {task.category === 'personal' && '👤'}
          {task.category === 'shopping' && '🛒'}
          {task.category === 'health' && '🏥'}
          {task.category === 'education' && '📚'}
          {task.category === 'finance' && '💰'}
          {task.category === 'travel' && '✈️'}
          {task.category === 'other' && '📝'}
          <span className="ml-1">{getCategoryName(task.category)}</span>
        </span>
      </div>

      {/* Due Date */}
      {task.due_date && (
        <div className="flex items-center text-sm mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span className={getTimeBasedColor(task.due_date, task.status)}>
            {safeFormatDate(task.due_date, 'dd MMMM yyyy, HH:mm', { locale: tr })}
          </span>
          {isOverdue && (
            <AlertCircle className="h-4 w-4 ml-2 text-red-600" />
          )}
          {isDueSoon && !isOverdue && (
            <Clock className="h-4 w-4 ml-2 text-yellow-600" />
          )}
        </div>
      )}

      {/* Attachments */}
      {(() => {
        // Hata ayıklama: Sorun giderme için eklentileri logla
        if (task.id && process.env.NODE_ENV === 'development') {
          console.log(`[TaskCard ${task.id}] Attachments check:`, {
            hasAttachments: !!task.attachments,
            isArray: Array.isArray(task.attachments),
            length: task.attachments?.length || 0,
            type: typeof task.attachments,
            attachments: task.attachments
          });
        }
        return null;
      })()}
      {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium text-gray-700">
              📎 Ekler ({task.attachments.length})
            </span>
          </div>
          <div className="space-y-1">
            {task.attachments.slice(0, 3).map((attachment) => (
              <div
                key={attachment.id || attachment.original_filename}
                className="flex items-center justify-between bg-blue-50 p-2 rounded text-xs hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 truncate font-medium" title={attachment.original_filename}>
                    📄 {attachment.original_filename}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {attachment.file_size_mb || (attachment.file_size ? (attachment.file_size / (1024 * 1024)).toFixed(2) : '0')} MB • {safeFormatDate(attachment.uploaded_at, 'dd.MM.yyyy', { locale: tr })}
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      attachmentService.downloadAttachment(attachment.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-200 rounded transition-colors"
                    title="İndir"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {(attachment.original_filename && attachment.original_filename.match(/\.(pdf|png|jpg|jpeg)$/i)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        attachmentService.previewAttachment(attachment.id);
                      }}
                      className="text-green-600 hover:text-green-800 p-1 hover:bg-green-200 rounded transition-colors"
                      title="Önizle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {task.attachments.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-1">
                +{task.attachments.length - 3} daha fazla dosya
              </p>
            )}
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="text-xs text-gray-500 mt-4">
        Oluşturulma: {safeFormatDate(task.created_at, 'dd MMMM yyyy', { locale: tr })}
      </div>
    </div>
  );
};

export default TaskCard;
