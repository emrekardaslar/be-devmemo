import { Router } from 'express';
import {
  createStandup,
  getStandup,
  getAllStandups,
  updateStandup,
  deleteStandup,
  updateTags,
  searchStandups,
  getStatistics,
  getStandupsByDateRange,
  getHighlights,
  toggleHighlight
} from '../controllers/standupController';
import { 
  validateStandup, 
  validateDateParam, 
  validateSearchQuery,
  validateDateRange
} from '../middleware/validationMiddleware';

const router = Router();

// Create a new standup
router.post('/', validateStandup, createStandup);

// Get all standups (with optional filtering)
router.get('/', getAllStandups);

// Search standups by keyword
router.get('/search', validateSearchQuery, searchStandups);

// Get statistics about standups
router.get('/stats', getStatistics);

// Get standups by date range
router.get('/range', validateDateRange, getStandupsByDateRange);

// Get highlight standups
router.get('/highlights', getHighlights);

// Get a specific standup by date
router.get('/:date', validateDateParam, getStandup);

// Update a standup
router.put('/:date', validateDateParam, validateStandup, updateStandup);

// Delete a standup
router.delete('/:date', validateDateParam, deleteStandup);

// Update tags for a standup
router.put('/:date/tags', validateDateParam, updateTags);

// Toggle highlight status
router.patch('/:date/highlight', validateDateParam, toggleHighlight);

export default router; 