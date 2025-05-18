import { Request, Response } from 'express';
import { getTestStandupData } from '../utils/testHelpers';

// Mock the data-source module
jest.mock('../../src/data-source', () => {
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

describe('StandupController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let testStandups: any[];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create test data
    testStandups = getTestStandupData();
    mockQueryBuilder.getMany.mockResolvedValue(testStandups);
    
    // Create mock request and response objects
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createStandup', () => {
    it('should create a valid standup entry', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      const newStandup = testStandups[0];
      mockRequest.body = newStandup;
      
      // Act
      await standupController.createStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors when creating standup', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.body = testStandups[0];
      
      // Simulate error
      mockRepository.save.mockRejectedValueOnce(new Error('Database error'));
      
      // Spy on console.error to prevent output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      await standupController.createStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Restore console
      consoleSpy.mockRestore();
    });
  });

  describe('getStandup', () => {
    it('should return a standup by date', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.params = { date: '2023-05-01' };
      mockRepository.findOne.mockResolvedValueOnce(testStandups[0]);
      
      // Act
      await standupController.getStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if standup not found', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.params = { date: '2023-01-01' };
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Act
      await standupController.getStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteStandup', () => {
    it('should delete a standup', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.params = { date: '2023-01-01' };
      mockRepository.delete.mockResolvedValueOnce({ affected: 1 });
      
      // Act
      await standupController.deleteStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({ date: '2023-01-01' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if standup to delete not found', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.params = { date: '2023-01-01' };
      mockRepository.delete.mockResolvedValueOnce({ affected: 0 });
      
      // Act
      await standupController.deleteStandup(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllStandups', () => {
    it('should return list of standups', async () => {
      // Arrange
      const standupController = require('../../src/controllers/standupController');
      mockRequest.query = {};
      
      // Act
      await standupController.getAllStandups(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
}); 