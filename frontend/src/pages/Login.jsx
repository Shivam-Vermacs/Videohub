/**
 * Login Page
 * ==========
 * Clean, centered login form with proper styling
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Video, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-icon absolute top-4 right-4"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8">
        <div 
          className="icon-box icon-box-md" 
          style={{ background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-xl)' }}
        >
          <Video size={24} />
        </div>
        <span className="text-2xl font-bold">VideoHub</span>
      </Link>

      {/* Login Card */}
      <div className="card-elevated p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-secondary">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="flex items-center gap-3 p-4 mb-6 rounded-lg"
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
          >
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input-wrapper">
              <Mail size={18} className="form-input-icon-left" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`form-input form-input-icon ${error ? 'form-input-error' : ''}`}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon-left" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`form-input form-input-icon ${error ? 'form-input-error' : ''}`}
                style={{ paddingRight: '3rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="form-input-icon-right btn btn-ghost btn-icon"
                style={{ padding: '4px' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg btn-full mt-6"
          >
            {isLoading ? (
              <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-secondary text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
