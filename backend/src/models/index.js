/**
 * Models Index
 * ------------
 * Centralized export of all Mongoose models.
 * Import models from this file for consistency.
 */

import User, { UserRoles } from './User.js';
import Video, { VideoStatus, SensitivityStatus } from './Video.js';

export {
  // Models
  User,
  Video,
  
  // Enums
  UserRoles,
  VideoStatus,
  SensitivityStatus,
};

export default {
  User,
  Video,
};
