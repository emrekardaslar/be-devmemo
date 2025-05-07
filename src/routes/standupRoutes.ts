import { Router } from 'express';
import {
  createStandup,
  getStandup,
  getAllStandups,
  updateStandup,
  deleteStandup,
  updateTags
} from '../controllers/standupController';

const router = Router();

// Create a new standup
router.post('/', createStandup);

// Get a specific standup by date
router.get('/:date', getStandup);

// Get all standups (with optional filtering)
router.get('/', getAllStandups);

// Update a standup
router.put('/:date', updateStandup);

// Delete a standup
router.delete('/:date', deleteStandup);

// Update tags for a standup
router.put('/:date/tags', updateTags);

export default router; 