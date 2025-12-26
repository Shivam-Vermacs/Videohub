/**
 * Layout Component
 * ================
 * Main layout wrapper with sidebar navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Video, 
  Upload, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // Base navigation links
  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/videos', label: 'Videos', icon: Video },
  ];

  // Add Admin Panel link if user is admin
  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
  }

  // If not authenticated, show simple layout without sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Simple Navbar for unauthenticated users */}
        <header className="navbar">
          <div className="container navbar-content">
            <Link to="/" className="navbar-brand">
              <div className="icon-box icon-box-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                <Video size={18} />
              </div>
              <span>VideoHub</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="btn btn-ghost btn-icon"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="dashboard-layout">
      {/* Sidebar - Desktop */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b" style={{ 
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)'
      }}>
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div style={{ 
              width: 32, 
              height: 32, 
              background: 'var(--color-primary)', 
              borderRadius: 8, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white'
            }}>
              <Video size={16} />
            </div>
            <span>VideoHub</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-icon"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t animate-fade-in p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <nav className="space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-3 p-3 rounded-lg transition"
                  style={{
                    background: isActive(path) ? 'var(--color-primary)' : undefined,
                    color: isActive(path) ? 'white' : 'var(--color-text-secondary)',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button onClick={toggleTheme} className="btn btn-ghost btn-icon">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={logout} className="btn btn-ghost text-error" style={{ color: 'var(--color-error)' }}>
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="md:hidden h-14" /> {/* Spacer for mobile header */}
        <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
