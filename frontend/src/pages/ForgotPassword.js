import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authService.requestPasswordReset({ email });
            setEmailSent(true);
            toast.success('Şifre sıfırlama kodu e-posta adresinize gönderildi.');

            // 2 saniye sonra PasswordReset sayfasına yönlendir
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Şifre sıfırlama isteği sırasında bir hata oluştu.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            E-posta Gönderildi!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            <strong>{email}</strong> adresine şifre sıfırlama kodu gönderildi.
                        </p>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            E-postanızı kontrol edin ve 6 haneli kodu kullanarak şifrenizi sıfırlayın.
                        </p>
                    </div>

                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Şifremi Unuttum
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">
                            E-posta Adresi
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="E-posta adresiniz"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Şifre Sıfırlama Kodu Gönder'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                        <ArrowLeft className="h-4 w-4 inline mr-1" />
                        Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;