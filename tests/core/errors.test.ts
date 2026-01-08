/**
 * Error Classes Tests
 */

import { describe, it, expect } from 'vitest';
import {
  VibeLearningError,
  InvalidInputError,
  NotFoundError,
  DatabaseConnectionError,
  DatabaseQueryError,
  FileWriteError,
  InternalError,
} from '../../src/core/errors.js';
import { ERROR_CODES } from '../../src/core/constants.js';

describe('Error Classes', () => {
  describe('VibeLearningError', () => {
    it('should create base error with code and message', () => {
      const error = new VibeLearningError(ERROR_CODES.INTERNAL_ERROR, 'Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.name).toBe('VibeLearningError');
    });

    it('should include suggestion if provided', () => {
      const error = new VibeLearningError(
        ERROR_CODES.INTERNAL_ERROR,
        'Test error',
        'Try this fix'
      );

      expect(error.suggestion).toBe('Try this fix');
    });

    it('should generate response object', () => {
      const error = new VibeLearningError(
        ERROR_CODES.INVALID_INPUT,
        'Test error',
        'Check input'
      );
      const response = error.toResponse();

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_INPUT');
      expect(response.message).toBe('Test error');
      expect(response.suggestion).toBe('Check input');
    });

    it('should omit suggestion from response if not provided', () => {
      const error = new VibeLearningError(ERROR_CODES.INTERNAL_ERROR, 'Test error');
      const response = error.toResponse();

      expect(response.suggestion).toBeUndefined();
    });
  });

  describe('InvalidInputError', () => {
    it('should create invalid input error', () => {
      const error = new InvalidInputError('email', 'must be valid format');

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toContain('email');
      expect(error.message).toContain('must be valid format');
    });

    it('should include suggestion', () => {
      const error = new InvalidInputError('email', 'is required');

      expect(error.suggestion).toContain('email');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('concept', 'test-concept');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toContain('concept');
      expect(error.message).toContain('test-concept');
    });

    it('should include suggestion', () => {
      const error = new NotFoundError('user', 'user-123');

      expect(error.suggestion).toContain('user');
    });
  });

  describe('DatabaseConnectionError', () => {
    it('should create connection error', () => {
      const error = new DatabaseConnectionError();

      expect(error.code).toBe('DB_CONNECTION_ERROR');
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.message).toContain('connect');
    });

    it('should include original error as cause', () => {
      const cause = new Error('Connection refused');
      const error = new DatabaseConnectionError(cause);

      expect(error.cause).toBe(cause);
    });

    it('should include suggestion', () => {
      const error = new DatabaseConnectionError();

      expect(error.suggestion).toContain('permission');
    });
  });

  describe('DatabaseQueryError', () => {
    it('should create query error with operation', () => {
      const error = new DatabaseQueryError('insert');

      expect(error.code).toBe('DB_QUERY_ERROR');
      expect(error.name).toBe('DatabaseQueryError');
      expect(error.message).toContain('insert');
    });

    it('should include original error as cause', () => {
      const cause = new Error('Query failed');
      const error = new DatabaseQueryError('update', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('FileWriteError', () => {
    it('should create file write error', () => {
      const error = new FileWriteError('/path/to/file.md');

      expect(error.code).toBe('FILE_WRITE_ERROR');
      expect(error.name).toBe('FileWriteError');
      expect(error.message).toContain('/path/to/file.md');
    });

    it('should include original error as cause', () => {
      const cause = new Error('Permission denied');
      const error = new FileWriteError('/path/to/file.md', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('InternalError', () => {
    it('should create internal error', () => {
      const error = new InternalError('Unexpected failure');

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.name).toBe('InternalError');
      expect(error.message).toBe('Unexpected failure');
    });

    it('should include original error as cause', () => {
      const cause = new Error('Original error');
      const error = new InternalError('Wrapped error', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof Error', () => {
      const error = new VibeLearningError(ERROR_CODES.INTERNAL_ERROR, 'Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instanceof VibeLearningError', () => {
      const invalidInput = new InvalidInputError('field', 'reason');
      const notFound = new NotFoundError('type', 'id');
      const dbConnection = new DatabaseConnectionError();
      const dbQuery = new DatabaseQueryError('select');
      const fileWrite = new FileWriteError('/path');
      const internal = new InternalError('error');

      expect(invalidInput).toBeInstanceOf(VibeLearningError);
      expect(notFound).toBeInstanceOf(VibeLearningError);
      expect(dbConnection).toBeInstanceOf(VibeLearningError);
      expect(dbQuery).toBeInstanceOf(VibeLearningError);
      expect(fileWrite).toBeInstanceOf(VibeLearningError);
      expect(internal).toBeInstanceOf(VibeLearningError);
    });
  });
});
