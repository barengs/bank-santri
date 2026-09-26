import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setCredentials } from '../store/slices/authSlice';
import { LogIn, ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch(setCredentials({
                    user: data.user,
                    token: data.access_token
                }));
                toast.success('Selamat datang kembali!');
                navigate('/');
            } else {
                toast.error(data.message || 'Email atau password salah');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSSOLogin = () => {
        const portalUrl = window.config?.portal_url || 'http://localhost:5173';
        window.location.href = `${portalUrl}/login?redirect=${window.location.origin}/auth/sso`;
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo & Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-md text-white mb-3 shadow-sm">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Bank Santri</h1>
                    <p className="text-xs text-slate-500">Sistem Manajemen Keuangan Pesantren</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-md shadow-sm p-6 border border-gray-200">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="admin@pesantren.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-1.5" />
                                    Sign In Lokal
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-white text-slate-400">Atau masuk melalui</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSSOLogin}
                        className="w-full flex items-center justify-center py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 text-xs font-medium rounded-md transition-all group shadow-sm"
                    >
                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                        Portal Utama (SSO)
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Bank Santri Ecosystem
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
