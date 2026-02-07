// components/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    AlertCircle,
    CheckCircle,
    Home,
    Mail,
    Phone,
    Globe,
    Shield,
    Sparkles,
    Leaf,
    Sprout,
    CloudRain,
    Sun,
    Calendar,
    BarChart3,
    Users,
    Truck,
    Cloud,
    Droplets,
    Thermometer
} from 'lucide-react';
import userAPI from '../../../apis/user';
import { kabAuthStore } from '../../../lib/kabAuthStore';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [systemStats, setSystemStats] = useState({
        farms: 128,
        workers: 45,
        crops: 320,
        equipment: 28
    });
    const [weather, setWeather] = useState({
        temp: 28,
        humidity: 65,
        rainfall: 12,
        condition: 'Sunny'
    });

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = () => {
            const isLoggedIn = kabAuthStore.isAuthenticated();
            if (isLoggedIn) {
                const redirectPath = location.state?.from?.pathname || '/dashboard';
                navigate(redirectPath, { replace: true });
            }
        };

        checkAuth();
        
        // Simulate system stats
        const interval = setInterval(() => {
            setSystemStats(prev => ({
                ...prev,
                crops: prev.crops + Math.floor(Math.random() * 3)
            }));
        }, 10000);
        
        return () => clearInterval(interval);
    }, [navigate, location]);

    // Check for password reset success message
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const resetSuccess = params.get('resetSuccess');
        const verified = params.get('verified');

        if (resetSuccess === 'true') {
            setSuccess('Password has been reset successfully! Please login with your new password.');
        }

        if (verified === 'true') {
            setSuccess('Your account has been verified successfully! Please login.');
        }
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setError('Please enter your username or email');
            return false;
        }
        if (!formData.password) {
            setError('Please enter your password');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const isEmail = formData.username.includes('@');
            const response = await userAPI.loginUser(
                isEmail ? '' : formData.username,
                formData.password,
                isEmail ? formData.username : undefined
            );

            if (response.status && response.data) {
                const kabUser = {
                    ...response.data.user,
                    permissions: response.data.user.role === 'admin'
                        ? ['can_manage_all', 'can_view_all', 'can_export_all']
                        : response.data.user.role === 'manager'
                            ? ['can_manage_workers', 'can_manage_assignments', 'can_view_reports']
                            : ['can_view_own', 'can_update_profile']
                };

                kabAuthStore.setAuthData({
                    user: kabUser,
                    token: response.data.token,
                    expiresIn: response.data.expiresIn
                });

                if (formData.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }

                setLoginAttempts(0);
                setSuccess('Login successful! Redirecting...');

                console.log('User logged in:', {
                    id: kabUser.id,
                    username: kabUser.username,
                    role: kabUser.role,
                    permissions: kabUser.permissions
                });

                setTimeout(() => {
                    const redirectPath = location.state?.from?.pathname || '/dashboard';
                    navigate(redirectPath, { replace: true });
                }, 1000);
            }
        } catch (err: any) {
            const attempts = loginAttempts + 1;
            setLoginAttempts(attempts);

            let errorMessage = err.message || 'Login failed. Please try again.';
            if (attempts >= 3) {
                errorMessage = 'Multiple failed attempts. Please check your credentials or contact support.';
            }
            setError(errorMessage);
            if (attempts >= 5) {
                setFormData(prev => ({ ...prev, password: '' }));
                setError('Too many failed attempts. Please try again later or reset your password.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    const handleDemoLogin = (role: 'admin' | 'manager' | 'user') => {
        const demoCredentials = {
            admin: { username: 'admin@kabisilya.com', password: 'Admin@123' },
            manager: { username: 'manager@kabisilya.com', password: 'Manager@123' },
            user: { username: 'farmer@kabisilya.com', password: 'Farmer@123' }
        };

        setFormData({
            ...demoCredentials[role],
            rememberMe: false
        });

        setSuccess(`Demo ${role} credentials loaded. Click Login to continue.`);
    };

    const getCurrentSeason = () => {
        const month = new Date().getMonth();
        if (month >= 5 && month <= 10) return { name: 'Rainy Season', icon: CloudRain, color: 'var(--accent-sky)' };
        return { name: 'Dry Season', icon: Sun, color: 'var(--accent-gold)' };
    };

    const currentSeason = getCurrentSeason();

    const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(e);
        if (e.target.checked) {
            localStorage.setItem('rememberMe', JSON.stringify(formData));
        } else {
            localStorage.removeItem('rememberMe');
        }
    };

    useEffect(() => {
        const cachedData = localStorage.getItem('rememberMe');
        if (cachedData) {
            setFormData(JSON.parse(cachedData));
        }
    }, []);

    // Remember Me Checkbox
    <div className="flex items-center mb-4">
        <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleRememberMeChange}
            className="mr-2"
        />
        <label className="text-sm">Remember Me</label>
    </div>

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-green-50 to-amber-50">
            {/* Left Panel - Brand & Stats */}
            <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-8" style={{
                background: 'var(--gradient-primary)',
                borderRight: '1px solid var(--border-color)'
            }}>
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                            <Leaf className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Kabisilya Management</h1>
                            <p className="text-sm text-white/80">Agricultural Management System</p>
                        </div>
                    </div>

                    {/* Season & Weather */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {React.createElement(currentSeason.icon, {
                                    className: "w-5 h-5",
                                    style: { color: 'white' }
                                })}
                                <span className="text-white font-medium">{currentSeason.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90">
                                <Thermometer className="w-4 h-4" />
                                <span>{weather.temp}°C</span>
                            </div>
                        </div>
                        
                        {/* Weather Details */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                <Cloud className="w-5 h-5 mx-auto mb-1 text-white" />
                                <p className="text-xs text-white/90">{weather.condition}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                <Droplets className="w-5 h-5 mx-auto mb-1 text-white" />
                                <p className="text-xs text-white/90">{weather.humidity}%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                <CloudRain className="w-5 h-5 mx-auto mb-1 text-white" />
                                <p className="text-xs text-white/90">{weather.rainfall}mm</p>
                            </div>
                        </div>
                    </div>

                    {/* System Stats */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold mb-3">System Overview</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-white/20">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white text-lg font-bold">{systemStats.farms}</span>
                                </div>
                                <p className="text-xs text-white/80">Active Farms</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-white/20">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white text-lg font-bold">{systemStats.workers}</span>
                                </div>
                                <p className="text-xs text-white/80">Workers</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-white/20">
                                        <Sprout className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white text-lg font-bold">{systemStats.crops}</span>
                                </div>
                                <p className="text-xs text-white/80">Crop Types</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-white/20">
                                        <Truck className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white text-lg font-bold">{systemStats.equipment}</span>
                                </div>
                                <p className="text-xs text-white/80">Equipment</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Footer */}
                <div className="text-white/70">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => window.open('tel:+631234567890', '_blank')}
                            className="text-xs flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Phone className="w-3 h-3" />
                            Support
                        </button>
                        <button
                            onClick={() => window.open('mailto:support@kabisilya.com', '_blank')}
                            className="text-xs flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Mail className="w-3 h-3" />
                            Email
                        </button>
                        <button
                            onClick={() => window.open('https://kabisilya.com', '_blank')}
                            className="text-xs flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Globe className="w-3 h-3" />
                            Website
                        </button>
                    </div>
                    <p className="text-xs">
                        © {new Date().getFullYear()} Kabisilya Management System
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 rounded-full" style={{ background: 'var(--gradient-primary)' }}>
                                <Leaf className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
                                    Kabisilya Management
                                </h1>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Agricultural Management System
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="rounded-xl transition-all duration-300 ease-in-out" style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 8px 32px rgba(42, 98, 61, 0.12)'
                    }}>
                        <div className="p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Welcome Back
                                </h2>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Sign in to manage your farm operations
                                </p>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{
                                    backgroundColor: 'var(--accent-rust-light)',
                                    border: '1px solid var(--accent-rust)'
                                }}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-rust)' }} />
                                    <p className="text-sm" style={{ color: 'var(--accent-rust)' }}>{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{
                                    backgroundColor: 'var(--accent-green-light)',
                                    border: '1px solid var(--accent-green)'
                                }}>
                                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-green)' }} />
                                    <p className="text-sm" style={{ color: 'var(--accent-green)' }}>{success}</p>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Username/Email Field */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Username or Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-1"
                                            style={{
                                                background: 'var(--input-bg)',
                                                border: '1px solid var(--input-border)',
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="Enter username or email"
                                            disabled={loading}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            className="text-xs hover:underline transition-colors"
                                            style={{ color: 'var(--primary-color)' }}
                                            disabled={loading}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-12 py-3 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-1"
                                            style={{
                                                background: 'var(--input-bg)',
                                                border: '1px solid var(--input-border)',
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="Enter your password"
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={loading}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Security */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="rememberMe"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleRememberMeChange}
                                            className="w-4 h-4 rounded transition-colors"
                                            style={{
                                                borderColor: 'var(--input-border)',
                                                backgroundColor: formData.rememberMe ? 'var(--primary-color)' : 'var(--input-bg)'
                                            }}
                                            disabled={loading}
                                        />
                                        <label htmlFor="rememberMe" className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Remember me
                                        </label>
                                    </div>

                                    {loginAttempts > 0 && (
                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            <Shield className="w-3 h-3 mr-1" />
                                            Attempts: {loginAttempts}/5
                                        </div>
                                    )}
                                </div>

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    style={{
                                        background: 'var(--gradient-primary)',
                                        color: 'var(--sidebar-text)',
                                        boxShadow: '0 4px 15px rgba(42, 98, 61, 0.3)'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: 'white' }}></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5 mr-2" />
                                            Sign In
                                        </>
                                    )}
                                </button>

                                {/* Demo Credentials */}
                                <div className="mt-6">
                                    <p className="text-center text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                                        Quick Demo Access
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['admin', 'manager', 'user'] as const).map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => handleDemoLogin(role)}
                                                disabled={loading}
                                                className="py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md capitalize"
                                                style={{
                                                    background: 'var(--card-secondary-bg)',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                            >
                                                <Sparkles className="w-3 h-3 inline mr-1" />
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>

                            {/* Divider */}
                            <div className="my-6 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2" style={{
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-tertiary)'
                                    }}>
                                        Don't have an account?
                                    </span>
                                </div>
                            </div>

                            {/* Additional Actions */}
                            <div className="space-y-3">
                                <Link
                                    to="/register"
                                    className="block w-full py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 hover:shadow-md"
                                    style={{
                                        background: 'var(--card-secondary-bg)',
                                        color: 'var(--primary-color)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    Create New Account
                                </Link>

                                <Link
                                    to="/"
                                    className="block w-full py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 hover:shadow-md flex items-center justify-center"
                                    style={{
                                        background: 'var(--card-secondary-bg)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Back to Home
                                </Link>
                            </div>

                            {/* Security Tips */}
                            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                <div className="flex items-start gap-2">
                                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary-color)' }} />
                                    <div>
                                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            Security Tips
                                        </p>
                                        <ul className="text-xs mt-1 space-y-1" style={{ color: 'var(--text-tertiary)' }}>
                                            <li>• Never share your login credentials</li>
                                            <li>• Ensure you're on the official Kabisilya site</li>
                                            <li>• Log out after each session on shared devices</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Footer */}
                    <div className="lg:hidden mt-6 text-center">
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            © {new Date().getFullYear()} Kabisilya Management System.
                            <span className="mx-2">•</span>
                            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                            <span className="mx-2">•</span>
                            <Link to="/terms" className="hover:underline">Terms of Service</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;