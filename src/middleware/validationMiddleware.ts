import { Request, Response, NextFunction } from 'express';

// Validate standup creation/update
export const validateStandup = (req: Request, res: Response, next: NextFunction) => {
  const { date, yesterday, today } = req.body;
  const errors = [];

  // Check required fields
  if (!date) {
    errors.push('Date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }

  if (!yesterday) {
    errors.push('Yesterday field is required');
  }

  if (!today) {
    errors.push('Today field is required');
  }

  // Check optional fields
  if (req.body.mood !== undefined && (req.body.mood < 1 || req.body.mood > 5)) {
    errors.push('Mood must be between 1 and 5');
  }

  if (req.body.productivity !== undefined && (req.body.productivity < 1 || req.body.productivity > 5)) {
    errors.push('Productivity must be between 1 and 5');
  }

  if (req.body.tags && !Array.isArray(req.body.tags)) {
    errors.push('Tags must be an array');
  }

  // If validation errors exist, return error response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // If validation passes, proceed to the controller
  next();
};

// Validate date parameter
export const validateDateParam = (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  next();
};

// Validate search query
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search keyword must be at least 2 characters long'
    });
  }

  next();
};

// Validate date range
export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Both startDate and endDate are required'
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate as string) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
    return res.status(400).json({
      success: false,
      message: 'Dates must be in YYYY-MM-DD format'
    });
  }

  if ((startDate as string) > (endDate as string)) {
    return res.status(400).json({
      success: false,
      message: 'startDate cannot be after endDate'
    });
  }

  next();
}; 