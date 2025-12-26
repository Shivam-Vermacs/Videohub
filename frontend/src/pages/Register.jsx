/**
 * Register Page
 * =============
 * Clean registration form with proper spacing and validation
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Video, 
  AlertCircle,
  Building2,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
    organization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return 'Username is required';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        organization: formData.organization.trim() || undefined,
      });
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'var(--color-error)', 'var(--color-warning)', 'var(--color-primary)', 'var(--color-success)'];
    
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
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

      {/* Register Card */}
      <div className="card-elevated p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-secondary">Join the video platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="flex items-center gap-3 p-4 mb-6 rounded-lg"
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="form-input-wrapper">
              <User size={18} className="form-input-icon-left" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className="form-input form-input-icon"
                autoComplete="username"
              />
            </div>
          </div>

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
                className="form-input form-input-icon"
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
                placeholder="Minimum 8 characters"
                className="form-input form-input-icon"
                style={{ paddingRight: '3rem' }}
                autoComplete="new-password"
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
            {/* Password Strength */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        background: level <= passwordStrength.strength 
                          ? passwordStrength.color 
                          : 'var(--color-border)'
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon-left" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="form-input form-input-icon"
                style={{ paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="form-input-icon-right btn btn-ghost btn-icon"
                style={{ padding: '4px' }}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input"
            >
              <option value="viewer">Viewer</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Organization */}
          <div className="form-group">
            <label className="form-label">
              Organization <span className="text-tertiary font-normal">(Optional)</span>
            </label>
            <div className="form-input-wrapper">
              <Building2 size={18} className="form-input-icon-left" />
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Your company or team"
                className="form-input form-input-icon"
              />
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
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-secondary text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
