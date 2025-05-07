import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Standup } from '../entity/Standup';

// Get the repository
const standupRepository = AppDataSource.getRepository(Standup);

// Controller methods
export const createStandup = async (req: Request, res: Response) => {
  try {
    const { date, yesterday, today, blockers, tags } = req.body;

    // Create new standup instance
    const standup = standupRepository.create({
      date,
      yesterday,
      today,
      blockers,
      tags: tags || []
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

    const standup = await standupRepository.findOne({
      where: { date }
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
    const { yesterday, today, blockers, tags } = req.body;

    // Check if standup exists
    const standup = await standupRepository.findOne({
      where: { date }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    // Update fields
    standup.yesterday = yesterday || standup.yesterday;
    standup.today = today || standup.today;
    standup.blockers = blockers || standup.blockers;
    standup.tags = tags || standup.tags;

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

    const result = await standupRepository.delete({ date });

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
    const { tag } = req.query;
    
    let query = standupRepository.createQueryBuilder('standup');
    
    // Filter by tag if provided
    if (tag) {
      query = query.where('standup.tags LIKE :tag', { tag: `%${tag}%` });
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

    // Check if standup exists
    const standup = await standupRepository.findOne({
      where: { date }
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        message: `No standup found for date: ${date}`
      });
    }

    // Update tags
    standup.tags = tags;

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