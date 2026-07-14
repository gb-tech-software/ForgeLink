/**
 * ForgeLink Error Handler
 * Provides centralized error handling, recovery, and user-facing messages
 */

export class ForgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export const ErrorCodes = {
  // File/Storage errors
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',

  // Command execution errors
  COMMAND_TIMEOUT: 'COMMAND_TIMEOUT',
  COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',
  COMMAND_FAILED: 'COMMAND_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Project detection errors
  PROJECT_TYPE_UNKNOWN: 'PROJECT_TYPE_UNKNOWN',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',

  // Network/Preview errors
  PREVIEW_FAILED: 'PREVIEW_FAILED',
  SERVER_NOT_RUNNING: 'SERVER_NOT_RUNNING',

  // System errors
  SDK_NOT_AVAILABLE: 'SDK_NOT_AVAILABLE',
  DEVICE_STORAGE_FULL: 'DEVICE_STORAGE_FULL',
  MEMORY_LOW: 'MEMORY_LOW',

  // Unknown errors
  UNKNOWN: 'UNKNOWN',
};

export const ErrorMessages = {
  [ErrorCodes.STORAGE_ACCESS_DENIED]: 'Storage access denied. Please grant permissions in Settings.',
  [ErrorCodes.FILE_NOT_FOUND]: 'File not found.',
  [ErrorCodes.FILE_WRITE_ERROR]: 'Failed to write file. Check permissions and storage space.',
  [ErrorCodes.DIRECTORY_NOT_FOUND]: 'Directory not found.',
  [ErrorCodes.COMMAND_TIMEOUT]: 'Command timed out. Try with a simpler command.',
  [ErrorCodes.COMMAND_NOT_FOUND]: 'Command not found. Ensure it is installed.',
  [ErrorCodes.COMMAND_FAILED]: 'Command failed. Check the output for details.',
  [ErrorCodes.PERMISSION_DENIED]: 'Permission denied.',
  [ErrorCodes.PROJECT_TYPE_UNKNOWN]: 'Unknown project type. Manually select a command.',
  [ErrorCodes.PROJECT_NOT_FOUND]: 'No valid project found in directory.',
  [ErrorCodes.PREVIEW_FAILED]: 'Preview failed. Check if dev server is running.',
  [ErrorCodes.SERVER_NOT_RUNNING]: 'Dev server not running. Start with a build command first.',
  [ErrorCodes.SDK_NOT_AVAILABLE]: 'Android SDK not available.',
  [ErrorCodes.DEVICE_STORAGE_FULL]: 'Device storage is full.',
  [ErrorCodes.MEMORY_LOW]: 'Device memory is low.',
  [ErrorCodes.UNKNOWN]: 'An unknown error occurred.',
};

export function getErrorMessage(error) {
  if (error instanceof ForgeError) {
    return ErrorMessages[error.code] || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function handleError(error, context = '') {
  console.error(`[ERROR] ${context}`, error);

  if (error instanceof ForgeError) {
    return {
      code: error.code,
      message: ErrorMessages[error.code] || error.message,
      details: error.details,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      code: ErrorCodes.UNKNOWN,
      message: 'Syntax error in command or configuration',
      details: { originalError: error.message },
    };
  }

  if (error instanceof TypeError) {
    return {
      code: ErrorCodes.UNKNOWN,
      message: 'Type error: Invalid operation',
      details: { originalError: error.message },
    };
  }

  return {
    code: ErrorCodes.UNKNOWN,
    message: getErrorMessage(error),
    details: { originalError: error.toString() },
  };
}
