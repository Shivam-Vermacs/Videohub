/**
 * Socket Service
 * ===============
 * Manages Socket.io connection for real-time updates.
 * Provides methods to connect, subscribe to events, and disconnect.
 * Handles race conditions with pending subscription queue.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.pendingSubscriptions = [];
  }

  /**
   * Connect to the socket server with JWT authentication
   * @param {string} token - JWT access token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (!token) {
      console.warn('Cannot connect socket: No token provided');
      return;
    }

    console.log('Connecting to socket server...');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected:', this.socket.id);
      
      // Process pending subscriptions
      this.processPendingSubscriptions();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.processPendingSubscriptions();
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });
  }

  /**
   * Process any pending subscriptions waiting for connection
   */
  processPendingSubscriptions() {
    while (this.pendingSubscriptions.length > 0) {
      const { eventName, callback } = this.pendingSubscriptions.shift();
      this.addListener(eventName, callback);
    }
  }

  /**
   * Add event listener to socket
   */
  addListener(eventName, callback) {
    if (!this.socket) return;

    const handler = (data) => {
      console.log(`📹 ${eventName} received:`, data);
      callback(data);
    };

    this.socket.on(eventName, handler);
    this.listeners.set(eventName, handler);
  }

  /**
   * Disconnect from the socket server
   */
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      this.pendingSubscriptions = [];
    }
  }

  /**
   * Subscribe to video status updates
   * Handles race condition by queuing if not yet connected
   * @param {Function} callback - Function to call when update received
   * @returns {Function} Unsubscribe function
   */
  subscribeToVideoUpdates(callback) {
    const eventName = 'videoStatusUpdate';

    // If socket connected, add listener immediately
    if (this.socket?.connected) {
      this.addListener(eventName, callback);
    } else if (this.socket) {
      // Socket exists but not connected yet - queue it
      console.log('Socket connecting, queuing subscription...');
      this.pendingSubscriptions.push({ eventName, callback });
    } else {
      // No socket at all - queue for when connect() is called
      console.log('Socket not initialized, queuing subscription...');
      this.pendingSubscriptions.push({ eventName, callback });
    }

    // Return unsubscribe function
    return () => {
      if (this.socket && this.listeners.has(eventName)) {
        const handler = this.listeners.get(eventName);
        this.socket.off(eventName, handler);
        this.listeners.delete(eventName);
      }
      // Also remove from pending if not yet processed
      this.pendingSubscriptions = this.pendingSubscriptions.filter(
        sub => !(sub.eventName === eventName && sub.callback === callback)
      );
    };
  }

  /**
   * Unsubscribe from video updates
   */
  unsubscribeFromVideoUpdates() {
    if (this.socket && this.listeners.has('videoStatusUpdate')) {
      const handler = this.listeners.get('videoStatusUpdate');
      this.socket.off('videoStatusUpdate', handler);
      this.listeners.delete('videoStatusUpdate');
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit: Socket not connected');
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
