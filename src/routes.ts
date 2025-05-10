import express from 'express';
import * as standupController from './controllers/standupController';
import * as queryController from './controllers/queryController';
import { AppDataSource } from './data-source';

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

  // Standup routes
  app.get('/api/standups', standupController.getAllStandups);
  app.get('/api/standups/:date', standupController.getStandup);
  app.get('/api/standups/range', standupController.getStandupsByDateRange);
  app.get('/api/standups/highlights', standupController.getHighlights);
  app.post('/api/standups', standupController.createStandup);
  app.put('/api/standups/:date', standupController.updateStandup);
  app.delete('/api/standups/:date', standupController.deleteStandup);
  app.patch('/api/standups/:date/highlight', standupController.toggleHighlight);
  app.get('/api/standups/search', standupController.searchStandups);
  app.get('/api/standups/stats', standupController.getStatistics);

  // Query routes
  app.get('/api/query/week', queryController.getWeeklySummary);
  app.get('/api/query/month/:month', queryController.getMonthlySummary);
  app.get('/api/query/blockers', queryController.getBlockers);
  app.post('/api/query', queryController.processQuery);
  
  // Root API route
  app.get('/api', (req, res) => {
    res.status(200).json({ message: 'StandupSync API is running' });
  });
} 