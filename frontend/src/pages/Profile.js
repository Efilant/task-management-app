import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        console.log('DEBUG: fetchProfile çağrıldı');
        console.log('DEBUG: Current user:', user);
        console.log('DEBUG: isAuthenticated:', !!user && !!localStorage.getItem('access_token'));

        try {
            console.log('DEBUG: authService.getProfile çağrılıyor...');
            const response = await authService.getProfile();
            const userData = response.data;
            console.log('DEBUG: Profile data received:', userData);
            setProfileData({
                username: userData.username || '',
                email: userData.email || '',
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
            });
            setLoading(false);
        } catch (error) {
            console.error('DEBUG: fetchProfile error:', error);
            console.error('DEBUG: Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error || 'Profil bilgileri yüklenirken bir hata oluştu';
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await authService.updateProfile(profileData);
            setUser(response.data.user);
            toast.success('Profil başarıyla güncellendi!');
            setSaving(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error || 'Profil güncellenirken bir hata oluştu';
            toast.error(errorMessage);
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Yeni şifreler eşleşmiyor!');
            return;
        }

        if (passwordData.new_password.length < 8) {
            toast.error('Yeni şifre en az 8 karakter olmalıdır!');
            return;
        }

        setSaving(true);

        try {
            await authService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
            setShowPasswordForm(false);
            toast.success('Şifre başarıyla değiştirildi!');
            setSaving(false);
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.error || 'Şifre değiştirilirken bir hata oluştu';
            toast.error(errorMessage);
            setSaving(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil Ayarları</h1>
                <p className="text-gray-600">Hesap bilgilerinizi yönetin ve güncelleyin</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 ml-3">Profil Bilgileri</h2>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Kullanıcı Adı
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={profileData.username}
                                onChange={handleProfileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                E-posta
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Ad
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={profileData.first_name}
                                    onChange={handleProfileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Soyad
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={profileData.last_name}
                                    onChange={handleProfileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Kaydet
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Password Change */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Eye className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">Şifre Değiştir</h2>
                        </div>
                        <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            {showPasswordForm ? 'İptal' : 'Değiştir'}
                        </button>
                    </div>

                    {showPasswordForm ? (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mevcut Şifre
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        id="current_password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('current')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Yeni Şifre
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        id="new_password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Yeni Şifre Tekrar
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Şifreyi Değiştir
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Eye className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-4">Şifrenizi güvenli bir şekilde değiştirin</p>
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Şifre Değiştir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
