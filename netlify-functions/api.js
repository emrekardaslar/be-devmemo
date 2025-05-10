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