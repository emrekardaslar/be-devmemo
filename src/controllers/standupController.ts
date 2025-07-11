import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Standup } from '../entity/Standup';
import { Between, Like, ILike } from 'typeorm';

// Get the repository
const standupRepository = AppDataSource.getRepository(Standup);

// Controller methods
export const createStandup = async (req: Request, res: Response) => {
  try {
    const { date, yesterday, today, blockers, isBlockerResolved, tags, mood, productivity, isHighlight } = req.body;

    // Get user ID from the authentication middleware
    const userId = req.user?.id;

    // Ensure tags is properly formatted for PostgreSQL
    let formattedTags = [];
    if (tags) {
      // If tags is already in PostgreSQL format (e.g., {tag1,tag2}), use it directly
      // Otherwise, format it to match PostgreSQL's array literal syntax
      if (Array.isArray(tags)) {
        if (tags.length === 0) {
          formattedTags = [];
        } else {
          formattedTags = tags.map(tag => tag.toString());
        }
      } else {
        formattedTags = [];
      }
    }

    // Create new standup instance
    const standup = standupRepository.create({
      date,
      yesterday,
      today,
      blockers,
      isBlockerResolved: isBlockerResolved || false,
      tags: formattedTags,
      mood: mood || 0,
      productivity: productivity || 0,
      isHighlight: isHighlight || false,
      userId // Assign the user ID from authentication
    });

    // Save to database
    await standupRepository.save(standup);

    return res.status(201).json({
      success: true,
      data: standup,
      message: 'Standup created successfully'
    });
  } catch (error: any) {
    console.error('Error creating standup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create standup',
      error: error.message
    });
  }
};

export const getStandup = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Get user ID from the authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access standup data'
      });
    }

    const standup = await standupRepository.findOne({
      where: { date, userId }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    return res.status(200).json({
      success: true,
      data: standup
    });
  } catch (error: any) {
    console.error('Error retrieving standup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve standup',
      error: error.message
    });
  }
};

export const updateStandup = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { yesterday, today, blockers, isBlockerResolved, tags, mood, productivity, isHighlight } = req.body;

    // Get user ID from the authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to update standup data'
      });
    }

    // Check if standup exists
    const standup = await standupRepository.findOne({
      where: { date, userId }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    // Update fields
    standup.yesterday = yesterday !== undefined ? yesterday : standup.yesterday;
    standup.today = today !== undefined ? today : standup.today;
    standup.blockers = blockers !== undefined ? blockers : standup.blockers;
    standup.isBlockerResolved = isBlockerResolved !== undefined ? isBlockerResolved : standup.isBlockerResolved;
    
    // Format tags properly if they're provided
    if (tags !== undefined) {
      let formattedTags = [];
      if (Array.isArray(tags)) {
        if (tags.length === 0) {
          formattedTags = [];
        } else {
          formattedTags = tags.map(tag => tag.toString());
        }
      }
      standup.tags = formattedTags;
    }
    
    // Update mood if provided
    if (mood !== undefined) {
      standup.mood = mood;
    }
    
    // Update productivity if provided
    if (productivity !== undefined) {
      standup.productivity = productivity;
    }
    
    // Update isHighlight if provided
    if (isHighlight !== undefined) {
      standup.isHighlight = isHighlight;
    }

    // Save updates
    await standupRepository.save(standup);

    return res.status(200).json({
      success: true,
      data: standup,
      message: 'Standup updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating standup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update standup',
      error: error.message
    });
  }
};

export const deleteStandup = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Get user ID from the authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to delete standup data'
      });
    }

    const result = await standupRepository.delete({ date, userId });

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Standup deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting standup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete standup',
      error: error.message
    });
  }
};

export const getAllStandups = async (req: Request, res: Response) => {
  try {
    // Handle query params for filtering
    const { tag, minMood, maxMood, minProductivity, maxProductivity, isHighlight, hasBlockers } = req.query;
    
    let query = standupRepository.createQueryBuilder('standup');
    
    // Filter by user ID if authenticated
    if (req.user?.id) {
      query = query.where('standup.userId = :userId', { userId: req.user.id });
    }
    
    // Filter by tag if provided
    if (tag) {
      const whereCondition = req.user?.id ? 'AND' : 'WHERE';
      query = query.andWhere(`standup.tags LIKE :tag`, { tag: `%${tag}%` });
    }
    
    // Filter by mood range if provided
    if (minMood) {
      query = query.andWhere('standup.mood >= :minMood', { minMood });
    }
    
    if (maxMood) {
      query = query.andWhere('standup.mood <= :maxMood', { maxMood });
    }
    
    // Filter by productivity range if provided
    if (minProductivity) {
      query = query.andWhere('standup.productivity >= :minProductivity', { minProductivity });
    }
    
    if (maxProductivity) {
      query = query.andWhere('standup.productivity <= :maxProductivity', { maxProductivity });
    }
    
    // Filter by highlight status if provided
    if (isHighlight !== undefined) {
      const highlightValue = isHighlight === 'true';
      query = query.andWhere('standup."isHighlight" = :isHighlight', { isHighlight: highlightValue });
    }
    
    // Filter standups with blockers if requested
    if (hasBlockers === 'true') {
      query = query.andWhere('standup.blockers IS NOT NULL AND standup.blockers != :emptyString', { emptyString: '' });
    }
    
    // Order by date descending (most recent first)
    query = query.orderBy('standup.date', 'DESC');
    
    const standups = await query.getMany();

    return res.status(200).json({
      success: true,
      count: standups.length,
      data: standups
    });
  } catch (error: any) {
    console.error('Error retrieving standups:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve standups',
      error: error.message
    });
  }
};

export const updateTags = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { tags } = req.body;

    // Get user ID from the authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to update standup tags'
      });
    }

    // Check if standup exists
    const standup = await standupRepository.findOne({
      where: { date, userId }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    // Format and update tags
    let formattedTags = [];
    if (Array.isArray(tags)) {
      if (tags.length === 0) {
        formattedTags = [];
      } else {
        formattedTags = tags.map(tag => tag.toString());
      }
    }
    standup.tags = formattedTags;

    // Save updates
    await standupRepository.save(standup);

    return res.status(200).json({
      success: true,
      data: standup,
      message: 'Tags updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update tags',
      error: error.message
    });
  }
};

// Search standups by keyword
export const searchStandups = async (req: Request, res: Response) => {
  try {
    const { keyword, startDate, endDate } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required for search'
      });
    }
    
    let query = standupRepository.createQueryBuilder('standup');
    
    // Search in yesterday, today and blockers fields
    query = query.where(
      '(standup.yesterday ILIKE :keyword OR standup.today ILIKE :keyword OR standup.blockers ILIKE :keyword)',
      { keyword: `%${keyword}%` }
    );
    
    // Apply date range filter if provided
    if (startDate && endDate) {
      query = query.andWhere('standup.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }
    
    // Order by date descending (most recent first)
    query = query.orderBy('standup.date', 'DESC');
    
    const standups = await query.getMany();
    
    return res.status(200).json({
      success: true,
      count: standups.length,
      data: standups
    });
  } catch (error) {
    console.error('Error searching standups:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search standups',
      error: (error as Error).message
    });
  }
};

// Get statistics about standups
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Filter by user if authenticated
    const userId = req.user?.id;
    let whereCondition = {};
    
    if (userId) {
      whereCondition = { userId };
      console.log(`Filtering statistics for user ID: ${userId}`);
    } else {
      console.log('No user ID found, returning all statistics');
    }
    
    // Get total count for this user
    const totalCount = await standupRepository.count({ where: whereCondition });
    
    // Get unique tags for this user
    const standups = await standupRepository.find({ where: whereCondition });
    
    if (standups.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStandups: 0,
          dateRange: {
            firstDate: null,
            lastDate: null,
            totalDays: 0
          },
          tagsStats: {
            uniqueTagsCount: 0,
            topTags: []
          },
          blockersStats: {
            total: 0,
            percentage: 0
          },
          moodStats: {
            average: 0,
            entriesWithMood: 0
          },
          productivityStats: {
            average: 0,
            entriesWithProductivity: 0
          },
          highlights: {
            count: 0,
            dates: []
          }
        }
      });
    }
    
    const allTags = standups.flatMap(s => s.tags);
    const uniqueTags = [...new Set(allTags)];
    
    // Count by tag
    const tagCounts: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    // Sort tags by frequency
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    // Get date range
    const dates = standups.map(s => s.date).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    // Get standups with blockers
    const blockersCount = standups.filter(s => 
      s.blockers && s.blockers.trim() !== ''
    ).length;
    
    // Calculate mood and productivity stats
    const moodValues = standups.filter(s => s.mood > 0).map(s => s.mood);
    const productivityValues = standups.filter(s => s.productivity > 0).map(s => s.productivity);
    
    const calculateAverage = (values: number[]) => {
      if (values.length === 0) return 0;
      return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10;
    };
    
    const moodAverage = calculateAverage(moodValues);
    const productivityAverage = calculateAverage(productivityValues);
    
    // Get highlight days
    const highlightDays = standups.filter(s => s.isHighlight).map(s => s.date);
    
    return res.status(200).json({
      success: true,
      data: {
        totalStandups: totalCount,
        dateRange: {
          firstDate,
          lastDate,
          totalDays: dates.length
        },
        tagsStats: {
          uniqueTagsCount: uniqueTags.length,
          topTags
        },
        blockersStats: {
          total: blockersCount,
          percentage: Math.round((blockersCount / totalCount) * 100)
        },
        moodStats: {
          average: moodAverage,
          entriesWithMood: moodValues.length
        },
        productivityStats: {
          average: productivityAverage,
          entriesWithProductivity: productivityValues.length
        },
        highlights: {
          count: highlightDays.length,
          dates: highlightDays
        }
      }
    });
  } catch (error) {
    console.error('Error generating statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate statistics',
      error: (error as Error).message
    });
  }
};

// Get standups by date range
export const getStandupsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required'
      });
    }
    
    // Build where condition
    let whereCondition: any = {
      date: Between(startDate as string, endDate as string)
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
    
    return res.status(200).json({
      success: true,
      count: standups.length,
      data: standups
    });
  } catch (error) {
    console.error('Error retrieving standups by date range:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve standups by date range',
      error: (error as Error).message
    });
  }
};

// Get highlight standups
export const getHighlights = async (req: Request, res: Response) => {
  try {
    // Get all standups marked as highlights using raw query
    let highlightsQuery = standupRepository
      .createQueryBuilder('standup')
      .where('standup."isHighlight" = :highlight', { highlight: true });
    
    // Filter by user if authenticated
    if (req.user?.id) {
      highlightsQuery = highlightsQuery.andWhere('standup.userId = :userId', { userId: req.user.id });
    }
    
    // Order by date
    highlightsQuery = highlightsQuery.orderBy('standup.date', 'DESC');
    
    const highlights = await highlightsQuery.getMany();
    
    if (highlights.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No highlight standups found'
      });
    }
    
    return res.status(200).json({
      success: true,
      count: highlights.length,
      data: highlights
    });
  } catch (error) {
    console.error('Error retrieving highlights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve highlight standups',
      error: (error as Error).message
    });
  }
};

// Toggle highlight status
export const toggleHighlight = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Get user ID from the authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to toggle highlight status'
      });
    }

    // Find the standup using composite primary key
    const standup = await standupRepository.findOne({
      where: { date, userId }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    // Toggle isHighlight value
    standup.isHighlight = !standup.isHighlight;

    // Save updates
    await standupRepository.save(standup);

    return res.status(200).json({
      success: true,
      data: standup,
      message: `Highlight status ${standup.isHighlight ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling highlight status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle highlight status',
      error: (error as Error).message
    });
  }
}; 