import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not defined in the environment variables');
}

// Initialize the API
const genAI = new GoogleGenerativeAI(apiKey || '');

// Define available models in order of preference
const AVAILABLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.0-pro'
];

// Create a function to get a working model
const getWorkingModel = (modelName = AVAILABLE_MODELS[0]) => {
  try {
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.error(`Error initializing model ${modelName}:`, error);
    
    // Try the next model in the list
    const index = AVAILABLE_MODELS.indexOf(modelName);
    if (index < AVAILABLE_MODELS.length - 1) {
      console.log(`Trying next model: ${AVAILABLE_MODELS[index + 1]}`);
      return getWorkingModel(AVAILABLE_MODELS[index + 1]);
    }
    
    // If all models fail, return null
    console.error('All models failed to initialize');
    return null;
  }
};

// Get the model
const model = getWorkingModel();

/**
 * Enhanced Natural Language Processing for Standup Queries
 * 
 * This service uses Google's Gemini API to process natural language queries
 * about standups and provide more intelligent responses.
 */
export class GeminiService {
  
  /**
   * Process a natural language query related to standup data
   * 
   * @param query The natural language query from the user
   * @param standupData Optional data to provide context to the model
   * @returns Processed response with insights or structured data
   */
  async processQuery(query: string, standupData?: any): Promise<any> {
    try {
      // If no API key is set or model initialization failed, return an error
      if (!apiKey || !model) {
        return {
          success: false,
          message: 'Gemini API is not properly configured',
          error: !apiKey ? 'GEMINI_API_KEY environment variable is missing' : 'Failed to initialize Gemini model'
        };
      }

      // Create a prompt with context about the standups
      let prompt = `You are an AI assistant for StandupSync, a daily standup tracking application. 
      Help analyze and provide insights for the following query: "${query}"`;

      // Add context from standup data if available
      if (standupData) {
        prompt += `\n\nHere is the relevant standup data to consider:\n${JSON.stringify(standupData, null, 2)}`;
      }

      // Set up the generation config for more consistent responses
      const generationConfig = {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      // Generate content with the model
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      // Try to parse the response to structured data
      try {
        // Check if the response contains JSON
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsedData = JSON.parse(jsonMatch[1]);
          return {
            success: true,
            data: parsedData,
            rawResponse: text
          };
        }
        
        // Return the text response if no JSON found
        return {
          success: true,
          message: text,
          data: {
            insight: text
          }
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw text
        return {
          success: true,
          message: text,
          data: {
            insight: text
          }
        };
      }
    } catch (error) {
      console.error('Error processing query with Gemini API:', error);
      
      // Provide a helpful response without the AI
      return {
        success: false,
        message: 'Failed to process query with Gemini API',
        error: (error as Error).message,
        fallback: {
          insight: "I couldn't analyze your standups with AI at the moment. You can still use the standard features of StandupSync to view your standups and summaries."
        }
      };
    }
  }

  /**
   * Analyze blockers to identify patterns and suggest solutions
   * 
   * @param blockers Array of blocker descriptions
   * @returns Analysis of blockers with patterns and suggestions
   */
  async analyzeBlockers(blockers: string[]): Promise<any> {
    // Skip if no blockers
    if (!blockers || blockers.length === 0) {
      return {
        success: true,
        data: {
          patterns: [],
          suggestions: [],
          analysis: "No blockers to analyze"
        }
      };
    }

    const prompt = `You are an AI assistant for StandupSync, a daily standup tracking application.
    Analyze the following blockers from standup entries and:
    1. Identify common patterns or themes
    2. Suggest potential solutions or approaches
    3. Categorize the blockers by type (e.g., technical, process, communication)
    
    Blockers:
    ${blockers.join('\n- ')}
    
    Provide the analysis in JSON format with the following structure:
    {
      "patterns": [{"theme": "theme name", "count": number, "examples": ["example1", "example2"]}],
      "suggestions": ["suggestion1", "suggestion2"],
      "categories": [{"name": "category name", "blockers": ["blocker1", "blocker2"]}],
      "summary": "brief summary text"
    }`;

    // Default response if the API call fails
    const defaultResponse = {
      patterns: [],
      suggestions: ["Try grouping similar blockers together", "Consider discussing recurring issues in team meetings"],
      categories: [],
      summary: "Basic analysis without AI assistance."
    };

    return this.safeGeminiRequest(prompt, defaultResponse);
  }

  /**
   * Summarize standup data and extract insights
   * 
   * @param standups Array of standup data
   * @returns Summary with key insights and trends
   */
  async summarizeStandups(standups: any[]): Promise<any> {
    // Skip if no standups
    if (!standups || standups.length === 0) {
      return {
        success: true,
        data: {
          insights: [],
          trends: [],
          summary: "No standups to analyze"
        }
      };
    }

    const prompt = `You are an AI assistant for StandupSync, a daily standup tracking application.
    Analyze the following standup entries and provide insights:
    1. Identify key accomplishments
    2. Detect patterns in productivity and mood
    3. Extract the most frequent topics or areas of work
    4. Suggest areas of focus based on the data
    
    Standup Data:
    ${JSON.stringify(standups, null, 2)}
    
    Provide the analysis in JSON format with the following structure:
    {
      "insights": ["insight1", "insight2"],
      "accomplishments": ["major accomplishment1", "major accomplishment2"],
      "trends": {"mood": "trend description", "productivity": "trend description", "topics": ["topic1", "topic2"]},
      "focus_suggestions": ["suggestion1", "suggestion2"],
      "summary": "brief summary text"
    }`;

    // Default response if the API call fails
    const defaultResponse = {
      insights: [],
      accomplishments: standups.slice(0, 3).map(s => `${s.date}: ${s.yesterday || 'No data'}`),
      trends: { 
        mood: "Data available in standard reports", 
        productivity: "Data available in standard reports", 
        topics: Array.from(new Set(standups.flatMap(s => s.tags || []))) 
      },
      focus_suggestions: ["Review your recent standups for patterns"],
      summary: "Basic summary without AI assistance."
    };

    return this.safeGeminiRequest(prompt, defaultResponse);
  }

  /**
   * Handle generic Gemini API request with fallback
   * 
   * @param prompt The prompt to send to the Gemini API
   * @param defaultResponse The default response if the API call fails
   * @returns The API response or the default response if the API call fails
   */
  async safeGeminiRequest(prompt: string, defaultResponse: any): Promise<any> {
    try {
      // If no API key is set or model initialization failed, return default
      if (!apiKey || !model) {
        return {
          success: false,
          message: 'Gemini API is not properly configured',
          error: !apiKey ? 'GEMINI_API_KEY environment variable is missing' : 'Failed to initialize Gemini model',
          data: defaultResponse
        };
      }

      // Set up the generation config
      const generationConfig = {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      // Generate content with the model
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      // Try to parse the response to structured data
      try {
        // Check if the response contains JSON
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
        if (jsonMatch && jsonMatch[1]) {
          const parsedData = JSON.parse(jsonMatch[1]);
          return {
            success: true,
            data: parsedData
          };
        }
        
        // Return the text response if no JSON found
        return {
          success: true,
          message: text,
          data: {
            insight: text
          }
        };
      } catch (parseError) {
        return {
          success: true,
          message: text,
          data: {
            insight: text
          }
        };
      }
    } catch (error) {
      console.error('Error with Gemini API request:', error);
      return {
        success: false,
        message: 'Failed to process request with Gemini API',
        error: (error as Error).message,
        data: defaultResponse
      };
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService(); 