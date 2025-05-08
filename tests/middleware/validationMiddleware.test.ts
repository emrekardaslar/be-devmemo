import { Request, Response, NextFunction } from 'express';
import { 
  validateStandup, 
  validateDateParam, 
  validateSearchQuery, 
  validateDateRange 
} from '../../src/middleware/validationMiddleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('validateStandup', () => {
    it('should pass validation with valid standup data', () => {
      // Arrange
      mockRequest.body = {
        date: '2023-05-01',
        yesterday: 'Worked on API endpoints',
        today: 'Writing tests',
        blockers: 'None',
        tags: ['api', 'testing'],
        mood: 4,
        productivity: 5
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject when required fields are missing', () => {
      // Arrange
      mockRequest.body = {
        // Missing date and yesterday fields
        today: 'Writing tests'
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Date is required',
            'Yesterday field is required'
          ])
        })
      );
    });

    it('should reject with invalid date format', () => {
      // Arrange
      mockRequest.body = {
        date: '05/01/2023', // Wrong format
        yesterday: 'Worked on API endpoints',
        today: 'Writing tests'
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            'Date must be in YYYY-MM-DD format'
          ])
        })
      );
    });

    it('should reject with invalid mood value', () => {
      // Arrange
      mockRequest.body = {
        date: '2023-05-01',
        yesterday: 'Worked on API endpoints',
        today: 'Writing tests',
        mood: 6 // Invalid (valid range is 1-5)
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            'Mood must be between 1 and 5'
          ])
        })
      );
    });

    it('should reject with invalid productivity value', () => {
      // Arrange
      mockRequest.body = {
        date: '2023-05-01',
        yesterday: 'Worked on API endpoints',
        today: 'Writing tests',
        productivity: 0 // Invalid (valid range is 1-5)
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            'Productivity must be between 1 and 5'
          ])
        })
      );
    });

    it('should reject when tags is not an array', () => {
      // Arrange
      mockRequest.body = {
        date: '2023-05-01',
        yesterday: 'Worked on API endpoints',
        today: 'Writing tests',
        tags: 'testing' // Not an array
      };

      // Act
      validateStandup(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            'Tags must be an array'
          ])
        })
      );
    });
  });

  describe('validateDateParam', () => {
    it('should pass validation with valid date param', () => {
      // Arrange
      mockRequest.params = {
        date: '2023-05-01'
      };

      // Act
      validateDateParam(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject with invalid date format', () => {
      // Arrange
      mockRequest.params = {
        date: '05/01/2023' // Wrong format
      };

      // Act
      validateDateParam(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        })
      );
    });

    it('should reject when date param is missing', () => {
      // Arrange
      mockRequest.params = {};

      // Act
      validateDateParam(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        })
      );
    });
  });

  describe('validateSearchQuery', () => {
    it('should pass validation with valid search query', () => {
      // Arrange
      mockRequest.query = {
        keyword: 'test'
      };

      // Act
      validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject when keyword is missing', () => {
      // Arrange
      mockRequest.query = {};

      // Act
      validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Search keyword must be at least 2 characters long'
        })
      );
    });

    it('should reject when keyword is too short', () => {
      // Arrange
      mockRequest.query = {
        keyword: 'a' // Only 1 character
      };

      // Act
      validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Search keyword must be at least 2 characters long'
        })
      );
    });
  });

  describe('validateDateRange', () => {
    it('should pass validation with valid date range', () => {
      // Arrange
      mockRequest.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      // Act
      validateDateRange(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject when start date is missing', () => {
      // Arrange
      mockRequest.query = {
        endDate: '2023-01-31'
      };

      // Act
      validateDateRange(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Both startDate and endDate are required'
        })
      );
    });

    it('should reject when end date is missing', () => {
      // Arrange
      mockRequest.query = {
        startDate: '2023-01-01'
      };

      // Act
      validateDateRange(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Both startDate and endDate are required'
        })
      );
    });

    it('should reject with invalid date format', () => {
      // Arrange
      mockRequest.query = {
        startDate: '01/01/2023', // Wrong format
        endDate: '2023-01-31'
      };

      // Act
      validateDateRange(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Dates must be in YYYY-MM-DD format'
        })
      );
    });

    it('should reject when start date is after end date', () => {
      // Arrange
      mockRequest.query = {
        startDate: '2023-02-01',
        endDate: '2023-01-31'
      };

      // Act
      validateDateRange(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'startDate cannot be after endDate'
        })
      );
    });
  });
}); 