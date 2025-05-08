import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorMiddleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    
    // Mock console.error to prevent output during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('should handle errors with status code 500', () => {
    // Arrange
    const testError = new Error('Test error message');
    testError.name = 'TestError';

    // Act
    errorHandler(testError, mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Test error message',
      error: 'TestError'
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use default message when error message is empty', () => {
    // Arrange
    const testError = new Error();
    testError.message = '';
    testError.name = 'EmptyMessageError';

    // Act
    errorHandler(testError, mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
      error: 'EmptyMessageError'
    });
  });

  it('should include stack trace in console output', () => {
    // Arrange
    const testError = new Error('Test error with stack');
    testError.stack = 'Fake stack trace for testing';

    // Act
    errorHandler(testError, mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Fake stack trace for testing');
  });
}); 