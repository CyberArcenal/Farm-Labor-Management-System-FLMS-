// components/auth/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Shield, Home } from 'lucide-react';
import userAPI from '../../../apis/user';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!userAPI.validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.forgotPassword(email);
      
      if (response.status) {
        setSuccess('Password reset instructions have been sent to your email.');
        setEmail('');
      } else {
        setError(response.message || 'Failed to send reset instructions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-soil-texture">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: 'var(--primary-color)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        {/* Forgot Password Card */}
        <div className="compact-card rounded-xl p-8" style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(42, 98, 61, 0.1)'
        }}>
          <div className="text-center mb-6">
            <div className="p-3 rounded-full inline-flex mb-4" style={{
              background: 'var(--accent-sky-light)',
              border: '1px solid var(--accent-sky)'
            }}>
              <Shield className="w-8 h-8" style={{ color: 'var(--accent-sky)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Reset Your Password
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your email address and we'll send you instructions to reset your password.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-1"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter your registered email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: 'var(--gradient-primary)',
                color: 'var(--sidebar-text)'
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: 'white' }}></div>
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <strong>Note:</strong> The reset link will expire in 24 hours.
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="underline hover:no-underline"
                  style={{ color: 'var(--primary-color)' }}
                >
                  try again
                </button>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Home className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;