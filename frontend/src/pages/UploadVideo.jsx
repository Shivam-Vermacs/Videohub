/**
 * Upload Video Page
 * =================
 * Clean upload interface with drag-and-drop and progress tracking
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileVideo,
  UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as videoService from '../services/videoService';

const ALLOWED_TYPES = [
  'video/mp4', 
  'video/mpeg', 
  'video/quicktime', 
  'video/x-msvideo', 
  'video/webm', 
  'video/x-matroska'
];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function UploadVideo() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (selectedFile) => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return 'Invalid file type. Supported: MP4, MPEG, MOV, AVI, WebM, MKV';
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFile) => {
    const error = validateFile(selectedFile);
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
    setStatus('idle');
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setErrorMessage('Please select a video file');
      setStatus('error');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a title');
      setStatus('error');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());

    abortControllerRef.current = new AbortController();
    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      await videoService.uploadVideo(
        formData,
        (progress) => setUploadProgress(progress),
        abortControllerRef.current.signal
      );
      setStatus('success');
      toast.success('Video uploaded successfully!');
      setTimeout(() => navigate('/videos'), 1500);
    } catch (error) {
      if (error.name === 'CanceledError') {
        setStatus('idle');
        return;
      }
      setErrorMessage(error.response?.data?.message || error.message || 'Upload failed');
      setStatus('error');
      toast.error('Upload failed');
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('idle');
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Upload Video</h1>
        <p className="text-secondary">
          Supported formats: MP4, MPEG, MOV, AVI, WebM, MKV
        </p>
      </div>

      {/* Upload Card */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Drop Zone */}
          <div
            className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${status === 'error' ? 'dropzone-error' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
          >
            {status === 'success' ? (
              <div className="text-center py-4">
                <div 
                  className="icon-box icon-box-lg mx-auto mb-4"
                  style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                >
                  <CheckCircle size={28} />
                </div>
                <p className="font-semibold mb-1">Upload Complete!</p>
                <p className="text-secondary text-sm">Redirecting to videos...</p>
              </div>
            ) : status === 'uploading' ? (
              <div className="w-full space-y-4">
                <div className="flex items-center gap-4">
                  <div className="icon-box icon-box-md flex-shrink-0">
                    <FileVideo size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file?.name}</p>
                    <p className="text-secondary text-sm">{formatFileSize(file?.size || 0)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div>
                  <div className="progress">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-secondary">Uploading...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelUpload}
                  className="btn btn-ghost text-error w-full"
                >
                  Cancel Upload
                </button>
              </div>
            ) : file ? (
              <div className="flex items-center gap-4 w-full">
                <div className="icon-box icon-box-md flex-shrink-0">
                  <FileVideo size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-secondary text-sm">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="btn btn-ghost btn-icon text-secondary"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="icon-box icon-box-lg mx-auto mb-4">
                  <UploadCloud size={28} />
                </div>
                <p className="font-semibold mb-1">Drop your video here</p>
                <p className="text-secondary text-sm mb-4">or click to browse</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                >
                  Select File
                </button>
                <p className="text-tertiary text-xs mt-4">
                  Max size: {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div 
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label form-label-required">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="form-input"
              disabled={status === 'uploading'}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for your video"
              rows={3}
              className="form-input"
              disabled={status === 'uploading'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || status === 'uploading' || status === 'success'}
            className="btn btn-primary btn-lg btn-full"
          >
            {status === 'uploading' ? (
              <>
                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Video
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadVideo;
