import express from 'express';
import * as standupController from './controllers/standupController';
import * as queryController from './controllers/queryController';
import { AppDataSource } from './data-source';
import { AuthController } from './controllers/AuthController';
import { authenticateJWT, optionalAuth } from './middleware/authMiddleware';

// Create instance of AuthController
const authController = new AuthController();

export function setupRoutes(app: express.Application) {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Check database connection
      const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
      
      // Try a simple query to verify deeper connection
      let dbQueryStatus = 'unknown';
      if (dbStatus === 'connected') {
        try {
          // Run a simple query 
          const result = await AppDataSource.query('SELECT 1 as connected');
          dbQueryStatus = result && result.length > 0 ? 'success' : 'failed';
        } catch (error) {
          console.error('Database query error:', error);
          dbQueryStatus = 'error';
        }
      }
      
      // Return status
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: {
          connection: dbStatus,
          query: dbQueryStatus,
          type: AppDataSource.options.type,
          host: AppDataSource.options.type === 'postgres' ? AppDataSource.options.host : 'local'
        }
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to check health',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Authentication routes
  app.post('/api/auth/register', authController.register.bind(authController));
  app.post('/api/auth/login', authController.login.bind(authController));
  app.post('/api/auth/refresh-token', authController.refreshToken.bind(authController));
  app.post('/api/auth/logout', authController.logout.bind(authController));
  app.get('/api/auth/verify-email/:token', authController.verifyEmail.bind(authController));
  app.post('/api/auth/request-password-reset', authController.requestPasswordReset.bind(authController));
  app.post('/api/auth/reset-password', authController.resetPassword.bind(authController));
  app.get('/api/auth/profile', authenticateJWT, authController.getProfile.bind(authController));

  // Standup routes - protected with authentication
  app.get('/api/standups', optionalAuth, standupController.getAllStandups);
  // Specific standup routes first - these must come before parameterized routes
  app.get('/api/standups/stats', optionalAuth, standupController.getStatistics);
  app.get('/api/standups/range', optionalAuth, standupController.getStandupsByDateRange);
  app.get('/api/standups/highlights', optionalAuth, standupController.getHighlights);
  app.get('/api/standups/search', optionalAuth, standupController.searchStandups);
  // Parameterized routes last
  app.get('/api/standups/:date', optionalAuth, standupController.getStandup);
  app.post('/api/standups', authenticateJWT, standupController.createStandup);
  app.put('/api/standups/:date', authenticateJWT, standupController.updateStandup);
  app.delete('/api/standups/:date', authenticateJWT, standupController.deleteStandup);
  app.patch('/api/standups/:date/highlight', authenticateJWT, standupController.toggleHighlight);

  // Query routes - protected with authentication 
  app.get('/api/query/week', optionalAuth, queryController.getWeeklySummary);
  app.get('/api/query/month/:month', optionalAuth, queryController.getMonthlySummary);
  app.get('/api/query/blockers', optionalAuth, queryController.getBlockers);
  app.post('/api/query', authenticateJWT, queryController.processQuery);
  
  // Root API route
  app.get('/api', (req, res) => {
    res.status(200).json({ message: 'StandupSync API is running' });
  });
} 