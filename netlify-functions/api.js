const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import your actual app or routes
// For TypeScript projects, this requires the app to be built first
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint for database connectivity
app.get('/.netlify/functions/api/db-health', async (req, res) => {
  try {
    let dataSource;
    try {
      // Try to load the data source from the compiled code
      const { AppDataSource } = require('../dist/data-source');
      dataSource = AppDataSource;
    } catch (error) {
      console.error('Error loading data source:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Could not load database connection',
        timestamp: new Date().toISOString()
      });
    }

    // Check if database is initialized
    const isConnected = dataSource.isInitialized;
    
    // Try a simple query if connected
    let queryResult = 'not attempted';
    if (isConnected) {
      try {
        const result = await dataSource.query('SELECT 1 as connected');
        queryResult = result && result.length > 0 ? 'success' : 'failed';
      } catch (dbError) {
        console.error('Database query error:', dbError);
        queryResult = 'error: ' + (dbError.message || 'unknown error');
      }
    }
    
    // Return database status
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connection: isConnected ? 'connected' : 'disconnected',
        query: queryResult,
        type: dataSource.options.type,
        host: dataSource.options.type === 'postgres' ? dataSource.options.host : 'local'
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Use the routes from your backend
// For TypeScript projects, you would import from '../dist'
try {
  // Try to load the compiled JS version first
  const { setupRoutes } = require('../dist/routes');
  setupRoutes(app);
} catch (error) {
  console.error('Error loading compiled routes:', error);
  try {
    // Fallback to direct TypeScript source if needed
    const { setupRoutes } = require('../src/routes');
    setupRoutes(app);
  } catch (e) {
    console.error('Failed to load routes:', e);
    app.get('*', (req, res) => {
      res.status(500).json({ error: 'Server configuration error' });
    });
  }
}

// Health check endpoint
app.get('/.netlify/functions/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle root path
app.get('/.netlify/functions/api', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// Export the serverless function
module.exports.handler = serverless(app); 