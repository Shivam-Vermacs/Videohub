/**
 * VideoCard Component
 * ====================
 * Modern, premium video card with Dribbble-inspired design.
 * Features: smooth shadows, refined typography, elegant hover effects.
 */

import { Clock, FileVideo, AlertCircle, CheckCircle, Loader, AlertTriangle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// API base URL for thumbnails
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format date to relative or absolute string
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * VideoCard Component
 */
export default function VideoCard({ video }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    id,
    title,
    status,
    duration,
    filesize,
    thumbnailPath,
    createdAt,
    processingProgress,
    sensitivityStatus,
  } = video;

  // Handle card click
  const handleClick = (e) => {
    console.log('VideoCard clicked!', { id, title, status, sensitivityStatus });
    
    // Block flagged content for non-admin users
    if (sensitivityStatus === 'flagged' && user?.role !== 'admin') {
      alert('⚠️ This content is flagged as sensitive and cannot be viewed.');
      console.log('Access denied: Flagged content, user role:', user?.role);
      return;
    }
    
    if (status === 'completed') {
      console.log('Navigating to /watch/' + id);
      navigate(`/watch/${id}`);
    }
  };

  // Construct thumbnail URL
  const thumbnailUrl = thumbnailPath 
    ? `${API_BASE_URL}/${thumbnailPath}`
    : null;

  // Status configuration - Vibrant & Alive
  const statusConfig = {
    processing: {
      label: 'Processing',
      color: '#f59e0b',           // Amber
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
      icon: Loader,
    },
    completed: {
      label: 'Ready',
      color: '#10b981',           // Emerald
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      icon: CheckCircle,
    },
    failed: {
      label: 'Failed',
      color: '#f43f5e',           // Rose
      bgColor: 'rgba(244, 63, 94, 0.12)',
      borderColor: 'rgba(244, 63, 94, 0.25)',
      icon: AlertCircle,
    },
    uploading: {
      label: 'Uploading',
      color: '#6366f1',           // Indigo
      bgColor: 'rgba(99, 102, 241, 0.12)',
      borderColor: 'rgba(99, 102, 241, 0.25)',
      icon: Loader,
    },
    flagged: {
      label: 'Flagged',
      color: '#f43f5e',           // Rose
      bgColor: 'rgba(244, 63, 94, 0.12)',
      borderColor: 'rgba(244, 63, 94, 0.25)',
      icon: AlertTriangle,
    },
  };

  const displayStatus = sensitivityStatus === 'flagged' ? 'flagged' : status;
  const currentStatus = statusConfig[displayStatus] || statusConfig.processing;
  const StatusIcon = currentStatus.icon;
  const isFlagged = sensitivityStatus === 'flagged';
  const isBlurred = isFlagged && user?.role !== 'admin';
  const isClickable = status === 'completed' && !isBlurred;

  return (
    <div
      onClick={handleClick}
      className="video-card"
      style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isFlagged 
          ? '1.5px solid rgba(239, 68, 68, 0.35)' 
          : '1px solid var(--border-color, rgba(0,0,0,0.08))',
        cursor: isClickable ? 'pointer' : (isBlurred ? 'not-allowed' : 'default'),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isFlagged 
          ? '0 4px 20px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(0,0,0,0.04)' 
          : '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isFlagged 
          ? '0 4px 20px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
          : '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)';
      }}
    >
      {/* Thumbnail Area - 16:9 Aspect Ratio */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          overflow: 'hidden',
        }}
      >
        {status === 'completed' && thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isBlurred ? 'blur(16px) brightness(0.7)' : 'none',
                transition: 'transform 0.4s ease',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Play Button Overlay for clickable cards */}
            {isClickable && (
              <div
                className="play-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0)',
                  transition: 'all 0.3s ease',
                  opacity: 0,
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  transform: 'scale(0.9)',
                  transition: 'transform 0.3s ease',
                }}>
                  <Play size={24} style={{ color: '#1a1a2e', marginLeft: '3px' }} fill="#1a1a2e" />
                </div>
              </div>
            )}
          </>
        ) : null}
        
        {/* Sensitive Content Overlay */}
        {isBlurred && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 2,
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '600',
              color: '#fff',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}>
              Sensitive Content
            </span>
          </div>
        )}
        
        {/* Fallback/Processing/Failed State */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: status === 'completed' && thumbnailUrl ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: status === 'failed' 
              ? 'linear-gradient(135deg, #2d1f1f 0%, #1a1a2e 100%)' 
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          {status === 'processing' || status === 'uploading' ? (
            <>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Loader 
                  size={24} 
                  style={{ 
                    color: '#60a5fa',
                    animation: 'spin 1s linear infinite',
                  }} 
                />
              </div>
              <span style={{ 
                fontSize: '13px', 
                color: '#94a3b8',
                fontWeight: 500,
              }}>
                {processingProgress ? `${processingProgress}%` : 'Processing...'}
              </span>
            </>
          ) : status === 'failed' ? (
            <>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertCircle size={24} style={{ color: '#f87171' }} />
              </div>
              <span style={{ 
                fontSize: '13px', 
                color: '#f87171',
                fontWeight: 500,
              }}>
                Processing Failed
              </span>
            </>
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileVideo size={24} style={{ color: '#64748b' }} />
            </div>
          )}
        </div>

        {/* Duration Badge */}
        {status === 'completed' && duration > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              letterSpacing: '0.3px',
            }}
          >
            <Clock size={12} />
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px 18px 18px' }}>
        {/* Title */}
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
          }}
          title={title}
        >
          {title || 'Untitled Video'}
        </h3>

        {/* Metadata Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <span style={{ 
            fontSize: '13px', 
            color: 'var(--text-muted)', 
            fontWeight: 400,
            opacity: 0.8,
          }}>
            {formatFileSize(filesize)}
          </span>
          <span style={{ 
            fontSize: '13px', 
            color: 'var(--text-muted)', 
            fontWeight: 400,
            opacity: 0.8,
          }}>
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: currentStatus.bgColor,
            color: currentStatus.color,
            fontSize: '12px',
            fontWeight: 600,
            border: `1px solid ${currentStatus.borderColor}`,
            letterSpacing: '0.2px',
          }}
        >
          <StatusIcon 
            size={13} 
            style={status === 'processing' || status === 'uploading' 
              ? { animation: 'spin 1s linear infinite' } 
              : {}
            } 
          />
          {currentStatus.label}
        </div>
      </div>

      {/* CSS for animations and hover effects */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .video-card:hover .play-overlay {
          opacity: 1 !important;
          background: rgba(0,0,0,0.4) !important;
        }
        .video-card:hover .play-overlay > div {
          transform: scale(1) !important;
        }
        .video-card:hover img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
