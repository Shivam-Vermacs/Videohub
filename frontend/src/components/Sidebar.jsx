/**
 * Sidebar Component
 * =================
 * Left navigation sidebar for dashboard layout
 */

import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Video, 
  Upload, 
  LayoutDashboard, 
  LogOut, 
  Sun,
  Moon,
  Shield,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Film,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

function Sidebar({ collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  // Navigation groups
  const homeLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/videos', label: 'Videos', icon: Video },
  ];
  
  const adminLinks = user?.role === 'admin' ? [
    { path: '/admin', label: 'Admin Panel', icon: Shield },
  ] : [];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const NavItem = ({ path, label, icon: Icon }) => (
    <Link
      to={path}
      className={`sidebar-nav-item ${isActive(path) ? 'active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  const NavGroup = ({ title, links }) => (
    <div className="sidebar-nav-group">
      {!collapsed && <div className="sidebar-nav-group-title">{title}</div>}
      <div className="sidebar-nav-list">
        {links.map(link => (
          <NavItem key={link.path} {...link} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Toggle Button - Floating on edge */}
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <div className="sidebar-logo">
              <Film size={22} />
            </div>
            {!collapsed && <span className="sidebar-brand-text">VideoHub</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavGroup title="Home" links={homeLinks} />
          {adminLinks.length > 0 && (
            <NavGroup title="Admin" links={adminLinks} />
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <button 
            className="sidebar-footer-item"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Help */}
          <button className="sidebar-footer-item" title="Help">
            <HelpCircle size={20} />
            {!collapsed && <span>Get Help</span>}
          </button>

          {/* User Section */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="sidebar-user-role">{user?.role || 'Member'}</div>
              </div>
            )}
            <button 
              className="sidebar-logout"
              onClick={handleLogoutClick}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={handleCancelLogout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCancelLogout}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-message">
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleConfirmLogout}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
