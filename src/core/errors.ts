/**
 * VibeLearning Error Handling
 *
 * Custom error classes and error handling utilities for
 * graceful failure with user-friendly messages.
 */

import { ERROR_CODES, type ErrorCode } from './constants.js';

/**
 * Base error class for VibeLearning
 */
export class VibeLearningError extends Error {
  readonly code: ErrorCode;
  readonly suggestion: string | undefined;

  constructor(code: ErrorCode, message: string, suggestion?: string) {
    super(message);
    this.name = 'VibeLearningError';
    this.code = code;
    this.suggestion = suggestion;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VibeLearningError);
    }
  }

  toResponse(): {
    success: false;
    code: ErrorCode;
    message: string;
    suggestion?: string | undefined;
  } {
    return {
      success: false,
      code: this.code,
      message: this.message,
      ...(this.suggestion ? { suggestion: this.suggestion } : {}),
    };
  }
}

/**
 * Database connection error
 */
export class DatabaseConnectionError extends VibeLearningError {
  constructor(originalError?: Error) {
    super(
      ERROR_CODES.DB_CONNECTION_ERROR,
      'Failed to connect to the learning database',
      'Check if ~/.vibe-learning/ folder has proper permissions'
    );
    this.name = 'DatabaseConnectionError';
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Database query error
 */
export class DatabaseQueryError extends VibeLearningError {
  constructor(operation: string, originalError?: Error) {
    super(
      ERROR_CODES.DB_QUERY_ERROR,
      `Database operation failed: ${operation}`,
      'This might be a temporary issue. Please try again.'
    );
    this.name = 'DatabaseQueryError';
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Invalid input error
 */
export class InvalidInputError extends VibeLearningError {
  constructor(field: string, reason: string) {
    super(ERROR_CODES.INVALID_INPUT, `Invalid ${field}: ${reason}`, `Please check the ${field} value and try again.`);
    this.name = 'InvalidInputError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends VibeLearningError {
  constructor(resource: string, identifier: string) {
    super(ERROR_CODES.NOT_FOUND, `${resource} not found: ${identifier}`, `The requested ${resource} does not exist.`);
    this.name = 'NotFoundError';
  }
}

/**
 * File write error
 */
export class FileWriteError extends VibeLearningError {
  constructor(path: string, originalError?: Error) {
    super(ERROR_CODES.FILE_WRITE_ERROR, `Failed to write file: ${path}`, 'Check if the directory exists and has write permissions.');
    this.name = 'FileWriteError';
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Internal error for unexpected situations
 */
export class InternalError extends VibeLearningError {
  constructor(message: string, originalError?: Error) {
    super(ERROR_CODES.INTERNAL_ERROR, message, 'An unexpected error occurred. Please report this issue.');
    this.name = 'InternalError';
    if (originalError) {
      this.cause = originalError;
    }
  }
}

/**
 * Wraps an operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMapper?: (error: unknown) => VibeLearningError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof VibeLearningError) {
      throw error;
    }

    if (errorMapper) {
      throw errorMapper(error);
    }

    throw new InternalError(error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error : undefined);
  }
}

/**
 * Validates a required field
 */
export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null) {
    throw new InvalidInputError(fieldName, 'is required');
  }
  return value;
}

/**
 * Validates a string is not empty
 */
export function validateNotEmpty(value: string, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    throw new InvalidInputError(fieldName, 'cannot be empty');
  }
  return value;
}

/**
 * Validates a number is within range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): number {
  if (value < min || value > max) {
    throw new InvalidInputError(fieldName, `must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Validates a value is one of allowed values
 */
export function validateOneOf<T extends string>(value: string, allowed: readonly T[], fieldName: string): T {
  if (!allowed.includes(value as T)) {
    throw new InvalidInputError(fieldName, `must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}
