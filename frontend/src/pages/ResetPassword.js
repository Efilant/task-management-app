import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [status, setStatus] = useState('form'); // form, success, error
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push('En az 8 karakter');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('En az bir büyük harf');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('En az bir küçük harf');
        }

        if (!/\d/.test(password)) {
            errors.push('En az bir rakam');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('En az bir özel karakter');
        }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Validate password in real-time
        if (name === 'new_password') {
            const errors = validatePassword(value);
            setPasswordErrors(errors);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setStatus('error');
            setMessage('Geçersiz şifre sıfırlama bağlantısı');
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            setMessage('Şifreler eşleşmiyor!');
            return;
        }

        if (passwordErrors.length > 0) {
            setMessage('Şifre güvenlik gereksinimleri karşılanmıyor!');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, formData.new_password);
            setStatus('success');
            setMessage('Şifre başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz.');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Şifre sıfırlama sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-12 w-12 text-green-600" />;
            case 'error':
                return <XCircle className="h-12 w-12 text-red-600" />;
            default:
                return <Lock className="h-12 w-12 text-blue-600" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'bg-green-100';
            case 'error':
                return 'bg-red-100';
            default:
                return 'bg-blue-100';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${getStatusColor()}`}>
                        {getStatusIcon()}
                    </div>

                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {status === 'success' && 'Şifre Sıfırlandı!'}
                        {status === 'error' && 'Sıfırlama Hatası'}
                        {status === 'form' && 'Yeni Şifre Belirleyin'}
                    </h2>

                    <p className="mt-2 text-center text-sm text-gray-600">
                        {status === 'form' && 'Yeni şifrenizi belirleyin'}
                        {(status === 'success' || status === 'error') && message}
                    </p>
                </div>

                {status === 'form' && (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new_password" className="sr-only">
                                    Yeni Şifre
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="new_password"
                                        name="new_password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Yeni şifre"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-500"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.new_password && (
                                    <div className="mt-2">
                                        <div className="text-xs text-gray-600 mb-2">Şifre Güvenlik Gereksinimleri:</div>
                                        <div className="space-y-1">
                                            {[
                                                { text: 'En az 8 karakter', test: formData.new_password.length >= 8 },
                                                { text: 'En az bir büyük harf', test: /[A-Z]/.test(formData.new_password) },
                                                { text: 'En az bir küçük harf', test: /[a-z]/.test(formData.new_password) },
                                                { text: 'En az bir rakam', test: /\d/.test(formData.new_password) },
                                                { text: 'En az bir özel karakter', test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.new_password) },
                                            ].map((requirement, index) => (
                                                <div key={index} className="flex items-center text-xs">
                                                    {requirement.test ? (
                                                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                                                    )}
                                                    <span className={requirement.test ? 'text-green-600' : 'text-red-600'}>
                                                        {requirement.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="sr-only">
                                    Şifre Tekrar
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Şifre tekrar"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-500"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className="text-red-600 text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Şifreyi Sıfırla'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {(status === 'success' || status === 'error') && (
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Giriş Yap
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
