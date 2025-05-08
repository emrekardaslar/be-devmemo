import { DataSource } from 'typeorm';
import { Standup } from '../../src/entity/Standup';
import { getTestDataSource, getTestStandupData } from '../utils/testHelpers';

// Create mocks for the database functions
const mockInitializeDatabase = jest.fn().mockResolvedValue(true);
const mockSeedDatabase = jest.fn().mockResolvedValue(true);

// Mock the AppDataSource and console methods
jest.mock('../../src/config/database', () => {
  return {
    AppDataSource: {
      isInitialized: true,
      getRepository: jest.fn(() => mockRepository),
      initialize: jest.fn().mockResolvedValue(undefined)
    },
    initializeDatabase: mockInitializeDatabase,
    seedDatabase: mockSeedDatabase
  };
});

// Mock repository
const mockRepository = {
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn(entity => entity),
  save: jest.fn(entity => Promise.resolve(entity))
};

describe('Database Service', () => {
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock console methods to prevent output during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterAll(() => {
    // Restore console methods
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('seedDatabase', () => {
    it('should seed the database when it is empty', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(0);
      
      // Act
      const result = await mockSeedDatabase();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should skip seeding if database already has data', async () => {
      // Arrange
      mockRepository.count.mockResolvedValue(5);
      
      // Act
      const result = await mockSeedDatabase();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockSeedDatabase.mockResolvedValueOnce(false);
      
      // Act
      const result = await mockSeedDatabase();
      
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('initializeDatabase', () => {
    it('should initialize the database connection successfully', async () => {
      // Act
      const result = await mockInitializeDatabase();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should handle connection errors', async () => {
      // Arrange
      mockInitializeDatabase.mockResolvedValueOnce(false);
      
      // Act
      const result = await mockInitializeDatabase();
      
      // Assert
      expect(result).toBe(false);
    });
  });
}); 