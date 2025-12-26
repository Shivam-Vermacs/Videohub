/**
 * User Model
 * ----------
 * Mongoose schema for user authentication and authorization.
 * Includes password hashing, JWT generation, and role-based access.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

const { Schema } = mongoose;

/**
 * Available user roles
 */
export const UserRoles = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
};

/**
 * User Schema Definition
 */
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRoles),
        message: 'Role must be one of: viewer, editor, admin',
      },
      default: UserRoles.VIEWER,
    },
    organization: {
      type: String,
      trim: true,
      default: null,
      index: true, // Index for multi-tenant queries
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Indexes for performance
 * Note: email and username indexes are created automatically due to unique: true in schema
 */
userSchema.index({ organization: 1, role: 1 });

/**
 * Pre-save middleware: Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set password changed timestamp (skip for new documents)
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method: Compare password for authentication
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: Generate JWT access token
 * @returns {string} - JWT token
 */
userSchema.methods.generateAuthToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    organization: this.organization,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Instance method: Check if password was changed after a given timestamp
 * @param {number} timestamp - JWT issued at timestamp
 * @returns {boolean} - True if password was changed after timestamp
 */
userSchema.methods.passwordChangedAfter = function (timestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return timestamp < changedTimestamp;
  }
  return false;
};

/**
 * Instance method: Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

/**
 * Static method: Find user by email with password
 * @param {string} email - User email
 * @returns {Promise<User|null>} - User document or null
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Static method: Find active users by organization
 * @param {string} organization - Organization name
 * @returns {Promise<User[]>} - Array of user documents
 */
userSchema.statics.findByOrganization = function (organization) {
  return this.find({ organization, isActive: true });
};

const User = mongoose.model('User', userSchema);

export default User;
