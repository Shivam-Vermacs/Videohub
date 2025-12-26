import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Clock, Calendar, User, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import * as videoService from '../services/videoService';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Format date to readable string
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Format duration from seconds to HH:MM:SS or MM:SS
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

export default function WatchVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await videoService.getVideoById(id);
        console.log('Video API Response:', response);
        
        if (response.success) {
          // Backend returns response.data.video, not response.data
          const videoData = response.data.video || response.data;
          console.log('Parsed video data:', videoData);
          setVideo(videoData);
        } else {
          setError('Failed to load video');
        }
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError(err.response?.data?.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <div className="spinner spinner-lg" />
        </div>
      </Layout>
    );
  }

  if (error || !video) {
    return (
      <Layout>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
          <PlayCircle size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
            {error || 'Video not found'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            The video you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // Construct video stream URL with JWT token
  console.log('Building stream URL. Token exists:', !!token, 'Token length:', token?.length);
  console.log('Token first 50 chars:', token?.substring(0, 50));
  const videoStreamUrl = `${API_BASE_URL}/api/videos/stream/${id}?token=${token}`;
  console.log('Stream URL:', videoStreamUrl);

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Main content - Two column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '32px',
        }}>
          {/* Video Player Column */}
          <div>
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}>
              {videoError ? (
                <div style={{
                  aspectRatio: '16/9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-secondary)',
                  padding: '48px',
                }}>
                  <PlayCircle size={48} style={{ color: 'var(--error)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    Playback Error
                  </h3>
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                    Unable to play this video. Please try again later.
                  </p>
                </div>
              ) : (
                <video
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    display: 'block',
                    background: '#000',
                  }}
                  src={videoStreamUrl}
                  onError={() => {
                    console.error('Video playback error');
                    setVideoError(true);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Video Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginTop: '24px',
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}>
              {video.title || 'Untitled Video'}
            </h1>

            {/* Description (if exists) */}
            {video.description && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
              }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-muted)',
                }}>
                  Description
                </h3>
                <p style={{ 
                  color: 'var(--text-primary)', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {video.description}
                </p>
              </div>
            )}
          </div>

          {/* Video Details Sidebar */}
          <div>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}>
                Video Details
              </h2>

              {/* Metadata items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Duration */}
                {video.duration > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Clock size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Duration
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: '600' }}>
                        {formatDuration(video.duration)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Calendar size={20} style={{ color: '#22C55E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      Uploaded
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>
                      {formatDate(video.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Uploaded by */}
                {video.uploadedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <User size={20} style={{ color: '#A855F7' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Uploaded by
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: '600' }}>
                        {video.uploadedBy.username || video.uploadedBy.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Organization (if exists) */}
                {video.organization && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--bg-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Organization
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: '600' }}>
                        {video.organization}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical details */}
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-color)',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-muted)',
                }}>
                  Technical Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>File Size</span>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{video.filesizeFormatted || 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Format</span>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{video.mimeType || 'video/mp4'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status</span>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '500',
                      color: video.status === 'completed' ? 'var(--success)' : 'var(--text-primary)',
                    }}>
                      {video.status === 'completed' ? 'Ready' : video.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
