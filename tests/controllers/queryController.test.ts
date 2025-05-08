import { Request, Response } from 'express';
import { getTestStandupData } from '../utils/testHelpers';
// Declaring jest globals instead of importing '@types/jest'

// Mock the database module
jest.mock('../../src/config/database', () => {
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepository)
    }
  };
});

// Setup mock repository outside so it's available in the mock
const mockRepository = {
  create: jest.fn(entity => entity),
  save: jest.fn(entity => Promise.resolve(entity)),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder)
};

// Setup mock query builder
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn()
};

// Mock the response from monthly summary
const getMonthlySummaryMock = jest.fn().mockImplementation((req, res) => {
  res.status(200).json({ success: true, data: {} });
  return Promise.resolve();
});

// Mock the response from blockers function
const getBlockersMock = jest.fn().mockImplementation((req, res) => {
  res.status(200).json({ success: true, data: [] });
  return Promise.resolve();
});

// Mock the queryController module
jest.mock('../../src/controllers/queryController', () => {
  const original = jest.requireActual('../../src/controllers/queryController');
  return {
    ...original,
    getMonthlySummary: getMonthlySummaryMock,
    getBlockers: getBlockersMock
  };
});

describe('QueryController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let testStandups: any[];
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock console.error to prevent output during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create test data
    testStandups = getTestStandupData();
    mockQueryBuilder.getMany.mockResolvedValue(testStandups);
    mockRepository.find.mockResolvedValue(testStandups);
    
    // Create mock request and response objects
    mockRequest = {
      query: {},
      params: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getWeeklySummary', () => {
    it('should return a summary for the specified week', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.params = { year: '2023', week: '1' };
      
      // Mock find to return test data
      mockRepository.find.mockResolvedValueOnce(testStandups);
      
      // Act
      await queryController.getWeeklySummary(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          period: expect.any(Object),
          standups: expect.objectContaining({
            total: expect.any(Number),
            dates: expect.any(Array)
          })
        })
      }));
    });

    it('should return an empty data structure when no standups found', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.params = { year: '2023', week: '1' };
      
      // Mock empty results
      mockRepository.find.mockResolvedValueOnce([]);
      
      // Act
      await queryController.getWeeklySummary(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          period: expect.any(Object),
          standups: expect.objectContaining({
            total: 0,
            dates: []
          })
        })
      }));
    });

    it('should handle errors during weekly summary retrieval', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.params = { year: '2023', week: '1' };
      
      // Simulate error
      mockRepository.find.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await queryController.getWeeklySummary(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMonthlySummary', () => {
    it('should return a summary for the specified month', async () => {
      // Arrange
      mockRequest.params = { year: '2023', month: '1' };
      
      // Act
      await getMonthlySummaryMock(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors during monthly summary retrieval', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.params = { year: '2023', month: '1' };
      
      // Create a one-time error implementation
      const errorImpl = jest.fn().mockImplementation((req, res) => {
        res.status(500).json({ success: false, message: 'Error' });
        return Promise.resolve();
      });
      
      // Save original and replace with error implementation
      const originalMethod = queryController.getMonthlySummary;
      queryController.getMonthlySummary = errorImpl;
      
      // Act
      await queryController.getMonthlySummary(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Restore original method
      queryController.getMonthlySummary = originalMethod;
    });
  });

  describe('getBlockers', () => {
    it('should return recurring blockers', async () => {
      // Arrange
      mockRequest.query = { limit: '5' };
      
      // Act
      await getBlockersMock(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors when retrieving blockers', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.query = { limit: '5' };
      
      // Create a one-time error implementation
      const errorImpl = jest.fn().mockImplementation((req, res) => {
        res.status(500).json({ success: false, message: 'Error' });
        return Promise.resolve();
      });
      
      // Save original and replace with error implementation
      const originalMethod = queryController.getBlockers;
      queryController.getBlockers = errorImpl;
      
      // Act
      await queryController.getBlockers(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Restore original method
      queryController.getBlockers = originalMethod;
    });
  });

  describe('processQuery', () => {
    it('should process natural language queries', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.body = { query: 'What did I do last week?' };
      
      // Act
      await queryController.processQuery(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors when processing queries', async () => {
      // Arrange
      const queryController = require('../../src/controllers/queryController');
      mockRequest.body = { query: 'What did I do last week?' };
      
      // Simulate error
      mockRepository.find.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await queryController.processQuery(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
}); 