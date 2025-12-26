/**
 * Logger Utility
 * --------------
 * Centralized logging with timestamps, log levels, and colored output.
 * In production, this can be replaced with Winston or similar.
 */

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Log levels with their configurations
 */
const LOG_LEVELS = {
  ERROR: { level: 0, color: colors.red, label: 'ERROR' },
  WARN: { level: 1, color: colors.yellow, label: 'WARN' },
  INFO: { level: 2, color: colors.green, label: 'INFO' },
  DEBUG: { level: 3, color: colors.cyan, label: 'DEBUG' },
};

/**
 * Get current log level from environment
 */
const getCurrentLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL?.toUpperCase();
  
  if (logLevel && LOG_LEVELS[logLevel]) {
    return LOG_LEVELS[logLevel].level;
  }
  
  // Default levels based on environment
  return env === 'production' ? LOG_LEVELS.INFO.level : LOG_LEVELS.DEBUG.level;
};

/**
 * Format timestamp for log output
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @returns {string} Formatted log string
 */
const formatMessage = (level, message, meta = null) => {
  const config = LOG_LEVELS[level];
  const timestamp = getTimestamp();
  const isProduction = process.env.NODE_ENV === 'production';
  
  let logString;
  
  if (isProduction) {
    // JSON format for production (easier to parse by log aggregators)
    const logObj = {
      timestamp,
      level: config.label,
      message,
      ...(meta && { meta }),
    };
    logString = JSON.stringify(logObj);
  } else {
    // Colored format for development
    const coloredLevel = `${config.color}${colors.bright}[${config.label}]${colors.reset}`;
    const coloredTimestamp = `${colors.gray}${timestamp}${colors.reset}`;
    logString = `${coloredTimestamp} ${coloredLevel} ${message}`;
    
    if (meta) {
      logString += `\n${colors.gray}${JSON.stringify(meta, null, 2)}${colors.reset}`;
    }
  }
  
  return logString;
};

/**
 * Logger object with methods for each log level
 */
const logger = {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or metadata
   */
  error: (message, error = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.ERROR.level) {
      const meta = error instanceof Error 
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
      console.error(formatMessage('ERROR', message, meta));
    }
  },

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} meta - Additional metadata
   */
  warn: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.WARN.level) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {object} meta - Additional metadata
   */
  info: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.INFO.level) {
      console.log(formatMessage('INFO', message, meta));
    }
  },

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {object} meta - Additional metadata
   */
  debug: (message, meta = null) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG.level) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },

  /**
   * Log HTTP request (for Morgan integration)
   * @param {string} message - Request log message
   */
  http: (message) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG.level) {
      const timestamp = getTimestamp();
      console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.magenta}[HTTP]${colors.reset} ${message}`);
    }
  },
};

export default logger;
