/**
 * @jest-environment node
 */

import { GeminiService } from './geminiService';

// Set the API key before importing the module
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock the GoogleGenerativeAI class and its methods
jest.mock('@google/generative-ai', () => {
  // Mock the text method
  const textMock = jest.fn().mockReturnValue(
    `Here's an analysis of your standups:
    
    \`\`\`json
    {
      "insights": ["You've been consistently working on frontend tasks", "Your productivity has been improving"],
      "accomplishments": ["Completed the login page", "Fixed authentication bugs"],
      "trends": {"mood": "generally positive", "productivity": "increasing", "topics": ["frontend", "auth"]},
      "focus_suggestions": ["Continue work on authentication", "Consider adding unit tests"],
      "summary": "Good progress on frontend and authentication tasks with improving productivity."
    }
    \`\`\`
    
    Let me know if you need further analysis!`
  );

  // Mock the response
  const responseMock = {
    text: textMock
  };

  // Mock the generateContent method
  const generateContentMock = jest.fn().mockResolvedValue({
    response: responseMock
  });

  // Mock the model
  const modelMock = {
    generateContent: generateContentMock
  };

  // Mock the getGenerativeModel method - updated to use gemini-1.5-flash model
  const getGenerativeModelMock = jest.fn().mockImplementation(({ model }) => {
    // Verify that the model name is correct
    expect(model).toBe('gemini-1.5-flash');
    return modelMock;
  });

  // Return the mocked constructor
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: getGenerativeModelMock
    }))
  };
});

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let originalApiKey: string | undefined;
  
  beforeEach(() => {
    // Save original value
    originalApiKey = process.env.GEMINI_API_KEY;
    // Ensure API key is set for tests that need it
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Clear all mocks
    jest.clearAllMocks();
    // Create a new instance for each test
    geminiService = new GeminiService();
  });
  
  afterEach(() => {
    // Restore original value
    process.env.GEMINI_API_KEY = originalApiKey;
  });
  
  describe('processQuery', () => {
    it('should process a query and return structured data', async () => {
      // Call the method
      const result = await geminiService.processQuery('Analyze my recent standups');
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.insights).toEqual([
        "You've been consistently working on frontend tasks", 
        "Your productivity has been improving"
      ]);
      expect(result.data.summary).toBe(
        'Good progress on frontend and authentication tasks with improving productivity.'
      );
    });
    
    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key
      delete process.env.GEMINI_API_KEY;
      
      // Need to re-create the instance to pick up the environment change
      geminiService = new GeminiService();
      
      // Call the method
      const result = await geminiService.processQuery('Analyze my recent standups');
      
      // Assertions
      expect(result.success).toBe(false);
      expect(result.message).toBe('Gemini API key is not configured');
    });
  });
  
  describe('analyzeBlockers', () => {
    it('should analyze blockers and return patterns', async () => {
      // Mock input data
      const blockers = [
        'Waiting for API access from the DevOps team',
        'Need access to the production server',
        'API rate limiting is slowing down development'
      ];
      
      // Call the method
      const result = await geminiService.analyzeBlockers(blockers);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    it('should handle empty blockers array', async () => {
      // Call the method with empty array
      const result = await geminiService.analyzeBlockers([]);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data.patterns).toEqual([]);
      expect(result.data.suggestions).toEqual([]);
      expect(result.data.analysis).toBe('No blockers to analyze');
    });
  });
  
  describe('summarizeStandups', () => {
    it('should summarize standups and provide insights', async () => {
      // Mock standup data
      const standups = [
        {
          date: '2023-04-01',
          yesterday: 'Completed login form validation',
          today: 'Working on API integration',
          blockers: 'Waiting for backend endpoint',
          mood: 4,
          productivity: 3,
          tags: ['frontend', 'auth']
        },
        {
          date: '2023-04-02',
          yesterday: 'Finished API integration',
          today: 'Testing authentication flow',
          blockers: '',
          mood: 5,
          productivity: 4,
          tags: ['frontend', 'testing']
        }
      ];
      
      // Call the method
      const result = await geminiService.summarizeStandups(standups);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.insights).toBeDefined();
    });
    
    it('should handle empty standups array', async () => {
      // Call the method with empty array
      const result = await geminiService.summarizeStandups([]);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data.insights).toEqual([]);
      expect(result.data.trends).toEqual([]);
      expect(result.data.summary).toBe('No standups to analyze');
    });
  });
}); 