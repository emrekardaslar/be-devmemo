import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase, seedDatabase, AppDataSource } from './config/database';
import standupRoutes from './routes/standupRoutes';
import queryRoutes from './routes/queryRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import dotenv from 'dotenv';
import { Standup } from './entity/Standup';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/standups', standupRoutes);
app.use('/api/query', queryRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to StandupSync API' });
});

// Error handling middleware
app.use(errorHandler);

// Function to run migrations manually
const runMigrations = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      console.log('Database not initialized. Skipping migrations.');
      return false;
    }
    
    console.log('Checking if isBlockerResolved column exists...');
    
    // Run a query to check if the column exists
    const tableInfo = await AppDataSource.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'standup' AND column_name = 'isBlockerResolved'`
    );
    
    if (tableInfo.length === 0) {
      console.log('Adding isBlockerResolved column to standup table');
      
      // Add the column if it doesn't exist
      await AppDataSource.query(
        `ALTER TABLE "standup" ADD COLUMN "isBlockerResolved" boolean NOT NULL DEFAULT false`
      );
      
      console.log('Migration completed successfully');
    } else {
      console.log('Column isBlockerResolved already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
};

// Start the application
const startApp = async () => {
  try {
    // Initialize database connection
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting application.');
      process.exit(1);
    }
    
    // Run migrations
    await runMigrations();
    
    // Seed the database with sample data (if empty)
    await seedDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`StandupSync API server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
};

// Start the application
startApp();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, but log the error
}); 