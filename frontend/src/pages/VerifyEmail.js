import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // URL'den email parametresini al
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!code || !email) {
            setError('Lütfen e-posta adresinizi ve doğrulama kodunu girin');
            setLoading(false);
            return;
        }

        if (code.length !== 6) {
            setError('Doğrulama kodu 6 haneli olmalıdır');
            setLoading(false);
            return;
        }

        try {
            const response = await authService.verifyEmail({ code, email });
            setMessage(response.data.message || 'E-posta adresi başarıyla doğrulandı!');
            toast.success('E-posta doğrulandı! Giriş yapabilirsiniz.');

            // 2 saniye sonra login sayfasına yönlendir
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'E-posta doğrulama sırasında bir hata oluştu.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            toast.error('Lütfen e-posta adresinizi girin');
            return;
        }

        setResendLoading(true);
        setError('');
        setMessage('');

        try {
            await authService.resendVerificationCode(email);
            setMessage('Yeni doğrulama kodu gönderildi!');
            setCode(''); // Kodu temizle
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Kod gönderilirken bir hata oluştu';
            setError(errorMessage);
        } finally {
            setResendLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Sadece rakam
        if (value.length <= 6) {
            setCode(value);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        E-posta Doğrulama
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin
                    </p>
                    <p className="mt-1 text-center text-xs text-orange-600">
                        ⏰ Kod 3 dakika geçerlidir
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            E-posta Adresi
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="E-posta adresiniz"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            Doğrulama Kodu
                        </label>
                        <div className="mt-1">
                            <input
                                id="code"
                                name="code"
                                type="text"
                                maxLength="6"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl font-mono tracking-widest"
                                placeholder="123456"
                                value={code}
                                onChange={handleCodeChange}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            6 haneli doğrulama kodunu girin
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || code.length !== 6 || !email}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    E-postayı Doğrula
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Resend Code Button */}
                <div className="text-center">
                    <button
                        onClick={handleResendCode}
                        disabled={resendLoading || !email}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resendLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Yeni Kod Gönder
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                        Kod süresi dolduysa yeni kod gönderebilirsiniz
                    </p>
                </div>

                {message && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Giriş sayfasına geri dön
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;