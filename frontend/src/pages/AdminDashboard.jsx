/**
 * Admin Dashboard Page
 * ====================
 * Admin-only moderation panel to view and manage ALL videos.
 * Displays videos from all users with moderation controls.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAllVideosAdmin, toggleSensitivityStatus } from '../services/videoService';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Video, 
  RefreshCw,
  Eye,
  Clock,
  Filter,
  List
} from 'lucide-react';
import VideoCard from '../components/VideoCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'flagged', 'safe'
  const [stats, setStats] = useState({ total: 0, flagged: 0, safe: 0, pending: 0 });

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filter === 'flagged') params.sensitivityStatus = 'flagged';
      if (filter === 'safe') params.sensitivityStatus = 'safe';
      
      const response = await getAllVideosAdmin(params);
      
      if (response.success) {
        setVideos(response.data || []);
        
        // Calculate stats from unfiltered response for accurate totals
        if (filter === 'all') {
          const allVideos = response.data || [];
          setStats({
            total: allVideos.length,
            flagged: allVideos.filter(v => v.sensitivityStatus === 'flagged').length,
            safe: allVideos.filter(v => v.sensitivityStatus === 'safe').length,
            pending: allVideos.filter(v => v.sensitivityStatus === 'pending' || !v.sensitivityStatus).length,
          });
        }
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchVideos();
    }
  }, [user, filter]);

  // Handle moderation action
  const handleToggleSensitivity = async (videoId, newStatus) => {
    try {
      const response = await toggleSensitivityStatus(videoId, newStatus);
      if (response.success) {
        // Update local state
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, sensitivityStatus: newStatus } : v
        ));
        // Refresh stats
        const unfilteredResponse = await getAllVideosAdmin({});
        if (unfilteredResponse.success) {
          const allVideos = unfilteredResponse.data || [];
          setStats({
            total: allVideos.length,
            flagged: allVideos.filter(v => v.sensitivityStatus === 'flagged').length,
            safe: allVideos.filter(v => v.sensitivityStatus === 'safe').length,
            pending: allVideos.filter(v => v.sensitivityStatus === 'pending' || !v.sensitivityStatus).length,
          });
        }
      }
    } catch (err) {
      console.error('Toggle sensitivity error:', err);
      alert('Failed to update video status');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        color: 'var(--text-muted)',
        gap: '16px'
      }}>
        <Shield size={64} style={{ opacity: 0.5 }} />
        <span style={{ fontSize: '18px', fontWeight: '500' }}>Admin access required</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '36px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '26px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: 0
          }}>
            <Shield size={28} style={{ color: 'var(--primary)' }} />
            Admin Moderation Panel
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>
            Review and moderate all videos across the platform
          </p>
        </div>
        <button
          onClick={fetchVideos}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '36px'
      }}>
        <StatCard 
          icon={<Video size={22} />}
          label="Total Videos"
          value={stats.total}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard 
          icon={<AlertTriangle size={22} />}
          label="Flagged"
          value={stats.flagged}
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.1)"
        />
        <StatCard 
          icon={<CheckCircle size={22} />}
          label="Safe"
          value={stats.safe}
          color="#22c55e"
          bgColor="rgba(34, 197, 94, 0.1)"
        />
        <StatCard 
          icon={<Clock size={22} />}
          label="Pending Review"
          value={stats.pending}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '36px',
        padding: '10px',
        background: 'var(--color-bg-alt, rgba(0,0,0,0.04))',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        width: 'fit-content',
      }}>
        <FilterTab 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
          icon={<List size={16} />}
          label="All Videos"
        />
        <FilterTab 
          active={filter === 'flagged'} 
          onClick={() => setFilter('flagged')}
          icon={<AlertTriangle size={16} />}
          label="Flagged"
          variant="danger"
        />
        <FilterTab 
          active={filter === 'safe'} 
          onClick={() => setFilter('safe')}
          icon={<CheckCircle size={16} />}
          label="Safe"
          variant="success"
        />
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          color: '#ef4444',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          gap: '16px',
          color: 'var(--text-muted)'
        }}>
          <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', opacity: 0.6 }} />
          <span style={{ fontSize: '14px' }}>Loading videos...</span>
        </div>
      ) : (
        <>
          {/* Video Grid */}
          {videos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              color: 'var(--text-muted)',
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px dashed var(--border-color)'
            }}>
              <Video size={56} style={{ marginBottom: '16px', opacity: 0.4 }} />
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No videos found</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                {filter !== 'all' ? 'Try changing the filter' : 'Videos will appear here once uploaded'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '28px'
            }}>
              {videos.map(video => (
                <AdminVideoCard 
                  key={video.id} 
                  video={video}
                  onToggleSensitivity={handleToggleSensitivity}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Stat Card Component with hover animations & border glow
function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div 
      style={{
        background: 'var(--card-bg)',
        borderRadius: '14px',
        padding: '18px 20px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 28px ${color}25`;
        e.currentTarget.style.borderColor = color;
        const iconEl = e.currentTarget.querySelector('.stat-icon');
        if (iconEl) {
          iconEl.style.transform = 'scale(1.2) rotate(-8deg)';
          iconEl.style.boxShadow = `0 4px 12px ${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        const iconEl = e.currentTarget.querySelector('.stat-icon');
        if (iconEl) {
          iconEl.style.transform = 'scale(1) rotate(0deg)';
          iconEl.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div 
          className="stat-icon"
          style={{ 
            color, 
            background: bgColor,
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {value}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// Filter Tab Component - High contrast for dark/light mode
function FilterTab({ active, onClick, icon, label, variant }) {
  // Vibrant colors for alive UI
  const getColors = () => {
    if (!active) {
      return {
        bg: 'transparent',
        text: 'var(--text-muted)',
        border: 'transparent',
        hover: 'var(--bg-secondary)',
      };
    }
    switch (variant) {
      case 'danger':
        return { 
          bg: '#f43f5e',           // Rose
          text: '#ffffff', 
          border: '#f43f5e',
          shadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
        };
      case 'success':
        return { 
          bg: '#10b981',           // Emerald
          text: '#ffffff', 
          border: '#10b981',
          shadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
        };
      default:
        return { 
          bg: '#6366f1',           // Indigo
          text: '#ffffff', 
          border: '#6366f1',
          shadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
        };
    }
  };

  const colors = getColors();

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        background: colors.bg,
        color: colors.text,
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? '600' : '500',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? colors.shadow : 'none',
        letterSpacing: '0.2px',
        transform: 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors.hover || 'var(--bg-secondary)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        } else {
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
        }
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = active ? 'scale(1.02)' : 'translateY(-2px)';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Admin Video Card with moderation controls - Clean layout with breathing room
function AdminVideoCard({ video, onToggleSensitivity }) {
  const isFlagged = video.sensitivityStatus === 'flagged';
  const navigate = useNavigate();

  return (
    <div 
      style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${isFlagged ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-color)'}`,
        boxShadow: isFlagged 
          ? '0 4px 20px rgba(244, 63, 94, 0.12), 0 2px 6px rgba(0,0,0,0.04)'
          : '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isFlagged 
          ? '0 12px 32px rgba(244, 63, 94, 0.18)'
          : '0 12px 32px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isFlagged 
          ? '0 4px 20px rgba(244, 63, 94, 0.12), 0 2px 6px rgba(0,0,0,0.04)'
          : '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Video Display */}
      <VideoCard video={video} />
      
      {/* Admin Controls - Better spacing */}
      <div style={{
        padding: '18px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        {/* Uploader Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px 14px',
          background: 'var(--card-bg)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}>
          <Users size={16} style={{ color: 'var(--primary)', opacity: 0.8 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Uploaded by:</span>
          <strong style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>
            {video.uploadedBy?.username || video.uploadedBy?.email || 'Unknown'}
          </strong>
        </div>
        
        {/* Moderation Buttons - Proper gap */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {isFlagged ? (
            <button
              onClick={() => onToggleSensitivity(video.id, 'safe')}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.transform = 'scale(1.2) rotate(10deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              }}
            >
              <CheckCircle size={15} style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              Mark as Safe
            </button>
          ) : (
            <button
              onClick={() => onToggleSensitivity(video.id, 'flagged')}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(244, 63, 94, 0.5)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.transform = 'scale(1.15) rotate(-15deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 63, 94, 0.35)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              }}
            >
              <AlertTriangle size={15} style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              Flag Content
            </button>
          )}
          <button
            onClick={() => navigate(`/watch/${video.id}`)}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(3px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.5)';
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'scale(1.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.35)';
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateX(1px) scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateX(3px) scale(1.05)';
            }}
          >
            <Eye size={15} style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            View
          </button>
        </div>
      </div>
    </div>
  );
}
