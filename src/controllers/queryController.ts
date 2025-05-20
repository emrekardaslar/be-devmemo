import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Standup } from '../entity/Standup';
import { Between, Like } from 'typeorm';
import { geminiService } from '../services/geminiService';

// Get the repository
const standupRepository = AppDataSource.getRepository(Standup);

// Helper function to get date range for the current week
const getCurrentWeekDateRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0]
  };
};

// Helper function to get date range for a specific month
const getMonthDateRange = (month: string) => {
  // month format should be YYYY-MM
  const [year, monthNumber] = month.split('-');
  
  const startDate = new Date(parseInt(year), parseInt(monthNumber) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthNumber), 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Get weekly summary
export const getWeeklySummary = async (req: Request, res: Response) => {
  try {
    let { startDate, endDate } = req.query as { startDate?: string, endDate?: string };
    
    // If no dates provided, use current week
    if (!startDate || !endDate) {
      const weekRange = getCurrentWeekDateRange();
      startDate = weekRange.startDate;
      endDate = weekRange.endDate;
    }
    
    // Build where condition
    let whereCondition: any = {
      date: Between(startDate, endDate)
    };
    
    // Filter by user if authenticated
    if (req.user?.id) {
      whereCondition.userId = req.user.id;
      console.log(`Filtering weekly summary for user ID: ${req.user.id}`);
    }
    
    const standups = await standupRepository.find({
      where: whereCondition,
      order: {
        date: 'ASC'
      }
    });
    
    if (standups.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          period: {
            startDate,
            endDate
          },
          standups: {
            total: 0,
            dates: []
          },
          achievements: [],
          plans: [],
          blockers: [],
          mood: {
            average: 0,
            data: []
          },
          productivity: {
            average: 0,
            data: []
          },
          tags: [],
          highlights: []
        }
      });
    }
    
    // Process the standups to generate a summary
    const summary = {
      period: {
        startDate,
        endDate
      },
      standups: {
        total: standups.length,
        dates: standups.map(s => s.date)
      },
      achievements: standups.flatMap(s => s.yesterday ? s.yesterday.split('\n').filter(a => a.trim() !== '') : []),
      plans: standups.flatMap(s => s.today ? s.today.split('\n').filter(p => p.trim() !== '') : []),
      blockers: standups.filter(s => s.blockers && s.blockers.trim() !== '')
        .map(s => s.blockers),
      mood: {
        average: calculateAverage(standups.map(s => s.mood)),
        data: standups.map(s => s.mood)
      },
      productivity: {
        average: calculateAverage(standups.map(s => s.productivity)),
        data: standups.map(s => s.productivity)
      },
      tags: Array.from(new Set(standups.flatMap(s => s.tags || [])))
        .map(tag => ({
          tag,
          count: standups.filter(s => s.tags && s.tags.includes(tag)).length
        })),
      highlights: standups.filter(s => s.isHighlight).map(s => `${s.date}: ${s.today}`)
    };
    
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate weekly summary',
      error: (error as Error).message
    });
  }
};

// Helper function to calculate average, safely handling non-numeric values
const calculateAverage = (numbers: number[]): number => {
  if (!numbers || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length;
};

// Get monthly summary
export const getMonthlySummary = async (req: Request, res: Response) => {
  try {
    const { month } = req.params;
    
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Use YYYY-MM'
      });
    }
    
    const { startDate, endDate } = getMonthDateRange(month);
    
    // Build where condition
    let whereCondition: any = {
      date: Between(startDate, endDate)
    };
    
    // Filter by user if authenticated
    if (req.user?.id) {
      whereCondition.userId = req.user.id;
      console.log(`Filtering monthly summary for user ID: ${req.user.id}`);
    }
    
    const standups = await standupRepository.find({
      where: whereCondition,
      order: {
        date: 'ASC'
      }
    });
    
    if (standups.length === 0) {
      // Return 200 status with empty data instead of 404 error
      return res.status(200).json({
        success: true,
        data: {
          month,
          totalEntries: 0,
          weeklySummaries: [],
          topTags: []
        }
      });
    }
    
    // Process the standups to generate a monthly summary
    // Group by week
    const weeks: Record<string, any[]> = {};
    standups.forEach(standup => {
      const date = new Date(standup.date);
      const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
      const weekKey = `Week ${weekNumber}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(standup);
    });
    
    // Generate summary for each week
    const weekSummaries = Object.entries(weeks).map(([week, weekStandups]) => {
      return {
        week,
        accomplishments: weekStandups.map(s => ({ date: s.date, done: s.yesterday })),
        tags: Array.from(new Set(weekStandups.flatMap(s => s.tags)))
      };
    });
    
    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    standups.forEach(standup => {
      standup.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const summary = {
      month,
      totalEntries: standups.length,
      weeklySummaries: weekSummaries,
      topTags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }))
    };
    
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate monthly summary',
      error: (error as Error).message
    });
  }
};

// Get recurring blockers
export const getBlockers = async (req: Request, res: Response) => {
  try {
    // Build where condition for non-empty blockers
    let whereCondition: any = {
      blockers: Like('%_%') // Matches any non-empty string
    };
    
    // Filter by user if authenticated
    if (req.user?.id) {
      whereCondition.userId = req.user.id;
      console.log(`Filtering blockers for user ID: ${req.user.id}`);
    }
    
    // Get all standups with non-empty blockers
    const standups = await standupRepository.find({
      where: whereCondition,
      order: {
        date: 'DESC'
      }
    });
    
    if (standups.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Simple analysis: group by similar blockers
    const blockerGroups: Record<string, any[]> = {};
    
    standups.forEach(standup => {
      // Basic normalization: lowercase and trim
      const normalizedBlocker = standup.blockers.toLowerCase().trim();
      
      // Very basic grouping logic - could be improved with NLP
      let matched = false;
      for (const key of Object.keys(blockerGroups)) {
        // If the blocker is similar to an existing key (contains similar words)
        if (
          key.includes(normalizedBlocker) || 
          normalizedBlocker.includes(key) ||
          normalizedBlocker.split(' ').some(word => key.includes(word) && word.length > 3)
        ) {
          blockerGroups[key].push({
            date: standup.date,
            blocker: standup.blockers
          });
          matched = true;
          break;
        }
      }
      
      // If no match found, create a new group
      if (!matched) {
        blockerGroups[normalizedBlocker] = [{
          date: standup.date,
          blocker: standup.blockers
        }];
      }
    });
    
    // Convert to array and sort by frequency
    const blockers = Object.entries(blockerGroups)
      .map(([key, occurrences]) => ({
        blocker: key,
        occurrences: occurrences.length,
        dates: occurrences.map(o => o.date)
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
    
    return res.status(200).json({
      success: true,
      data: blockers
    });
  } catch (error) {
    console.error('Error analyzing blockers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze blockers',
      error: (error as Error).message
    });
  }
};

// Process natural language query
export const processQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query is required and must be a string'
      });
    }
    
    // Normalize query for processing
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for advanced analysis requests
    if (
      normalizedQuery.includes('analyze') || 
      normalizedQuery.includes('insights') ||
      normalizedQuery.includes('summarize') ||
      normalizedQuery.includes('trends') ||
      normalizedQuery.includes('patterns')
    ) {
      // Get appropriate data based on query content
      let data;
      
      // For blocker analysis
      if (normalizedQuery.includes('blocker')) {
        const blockers = await getBlockerData();
        // Use Gemini service for enhanced analysis
        const analysis = await geminiService.analyzeBlockers(blockers);
        return res.status(200).json(analysis);
      }
      
      // For standup summary/analysis
      if (
        normalizedQuery.includes('standup') || 
        normalizedQuery.includes('summary') ||
        normalizedQuery.includes('progress')
      ) {
        // Get recent standups (last 2 weeks)
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        // Build where condition
        let whereCondition: any = {
          date: Between(twoWeeksAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0])
        };
        
        // Filter by user if authenticated
        if (req.user?.id) {
          whereCondition.userId = req.user.id;
        }
        
        const standups = await standupRepository.find({
          where: whereCondition,
          order: { date: 'DESC' }
        });
        
        // Use Gemini service for enhanced summary
        const analysis = await geminiService.summarizeStandups(standups);
        return res.status(200).json(analysis);
      }
      
      // For general analysis, use the full NLP processing
      // Use Gemini service for general query processing
      const analysis = await geminiService.processQuery(query);
      return res.status(200).json(analysis);
    }
    
    // Handle different query types
    
    // Weekly queries
    if (
      normalizedQuery.includes('this week') || 
      normalizedQuery.includes('did this week') ||
      normalizedQuery.includes('week') && normalizedQuery.includes('do')
    ) {
      // Reuse weekly summary logic
      req.query = {}; // Use default week range
      return getWeeklySummary(req, res);
    }
    
    // Monthly queries
    if (
      normalizedQuery.includes('this month') || 
      normalizedQuery.match(/in (january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
      normalizedQuery.match(/what.+in (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)
    ) {
      let month;
      
      // Check for specific month mentions
      const monthMatch = normalizedQuery.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      
      if (monthMatch) {
        // Map abbreviated month names to full names
        const monthMap: Record<string, number> = {
          'jan': 0, 'january': 0,
          'feb': 1, 'february': 1,
          'mar': 2, 'march': 2,
          'apr': 3, 'april': 3,
          'may': 4,
          'jun': 5, 'june': 5,
          'jul': 6, 'july': 6,
          'aug': 7, 'august': 7,
          'sep': 8, 'september': 8,
          'oct': 9, 'october': 9,
          'nov': 10, 'november': 10,
          'dec': 11, 'december': 11
        };
        
        const currentYear = new Date().getFullYear();
        const monthNumber = monthMap[monthMatch[0].toLowerCase()];
        month = `${currentYear}-${(monthNumber + 1).toString().padStart(2, '0')}`;
      } else {
        // Use current month
        const now = new Date();
        month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      // Mock the request params
      req.params = { month };
      return getMonthlySummary(req, res);
    }
    
    // Blocker queries
    if (
      normalizedQuery.includes('blocker') || 
      normalizedQuery.includes('blockers') ||
      normalizedQuery.includes('blocking') ||
      normalizedQuery.includes('blocked') ||
      normalizedQuery.includes('stuck')
    ) {
      return getBlockers(req, res);
    }
    
    // Tag-based queries
    const tagMatch = normalizedQuery.match(/#[a-z0-9_]+/g);
    if (tagMatch) {
      // Mock the query params for standup controller
      req.query = { tag: tagMatch[0].substring(1) }; // Remove the # symbol
      
      // Import getAllStandups dynamically to avoid circular dependencies
      const { getAllStandups } = require('./standupController');
      return getAllStandups(req, res);
    }
    
    // For any unmatched query, use Gemini for natural language understanding
    // But first get some recent data for context
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Build where condition
    let whereCondition: any = {
      date: Between(twoWeeksAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0])
    };
    
    // Filter by user if authenticated
    if (req.user?.id) {
      whereCondition.userId = req.user.id;
    }
    
    const recentStandups = await standupRepository.find({
      where: whereCondition,
      order: { date: 'DESC' },
      take: 5 // Limit to 5 most recent standups for context
    });
    
    // Process the query with Gemini
    const geminiResponse = await geminiService.processQuery(query, recentStandups);
    
    // If successful, return the Gemini response
    if (geminiResponse.success) {
      return res.status(200).json(geminiResponse);
    }
    
    // If Gemini fails or is not configured, fall back to the default response
    return res.status(200).json({
      success: true,
      message: 'I can help you with the following queries:',
      examples: [
        'What did I do this week?',
        'What was my focus in April?',
        'Any recurring blockers?',
        'Show me entries tagged with #frontend',
        'Analyze my recent standups',
        'Identify patterns in my blockers',
        'Summarize my progress this month'
      ]
    });
    
  } catch (error) {
    console.error('Error processing query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: (error as Error).message
    });
  }
};

// Helper function to retrieve blocker data for analysis
async function getBlockerData(): Promise<string[]> {
  // Build where condition for non-empty blockers
  let whereCondition: any = {
    blockers: Like('%_%') // Matches any non-empty string
  };
  
  // Get all standups with non-empty blockers
  const standups = await standupRepository.find({
    where: whereCondition,
    order: {
      date: 'DESC'
    }
  });
  
  return standups.map(s => s.blockers);
}

// Add a new endpoint for advanced analysis
export const analyzeStandups = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query as { 
      startDate?: string, 
      endDate?: string,
      type?: string 
    };
    
    // Default to last 30 days if no date range provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    let defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const queryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const queryEndDate = endDate || defaultEndDate;
    
    // Build where condition
    let whereCondition: any = {
      date: Between(queryStartDate, queryEndDate)
    };
    
    // Filter by user if authenticated
    if (req.user?.id) {
      whereCondition.userId = req.user.id;
    }
    
    const standups = await standupRepository.find({
      where: whereCondition,
      order: {
        date: 'ASC'
      }
    });
    
    if (standups.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No standups found in the specified date range',
        data: {
          insights: [],
          trends: {},
          summary: "No data available for analysis"
        }
      });
    }
    
    // Determine analysis type
    if (type === 'blockers') {
      const blockers = standups
        .filter(s => s.blockers && s.blockers.trim() !== '')
        .map(s => s.blockers);
      
      if (blockers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No blockers found in the specified date range',
          data: {
            patterns: [],
            suggestions: [],
            summary: "No blockers to analyze"
          }
        });
      }
      
      const analysis = await geminiService.analyzeBlockers(blockers);
      return res.status(200).json(analysis);
    } else {
      // Default to general standup analysis
      const analysis = await geminiService.summarizeStandups(standups);
      return res.status(200).json(analysis);
    }
    
  } catch (error) {
    console.error('Error analyzing standups:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze standups',
      error: (error as Error).message
    });
  }
}; 