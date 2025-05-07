import { Router } from 'express';
import {
  getWeeklySummary,
  getMonthlySummary,
  getBlockers,
  processQuery
} from '../controllers/queryController';

const router = Router();

// Get weekly summary
router.get('/week', getWeeklySummary);

// Get monthly summary
router.get('/month/:month', getMonthlySummary);

// Get recurring blockers
router.get('/blockers', getBlockers);

// Process natural language query
router.post('/', processQuery);

export default router; 