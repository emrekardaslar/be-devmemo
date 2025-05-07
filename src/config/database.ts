import { DataSource } from 'typeorm';
import { Standup } from '../entity/Standup';
import 'dotenv/config';

// Default to local development values if no environment variables are set
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'standups',
  entities: [Standup],
  synchronize: true, // For development only
  logging: false // Set to true for debugging
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection has been established successfully.');
    
    // Synchronize schema (creates tables if they don't exist)
    if (AppDataSource.isInitialized) {
      console.log('Database schema synchronized.');
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Function to add sample data for testing
export const seedDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      console.log('Database not initialized. Skipping seed.');
      return false;
    }
    
    const standupRepository = AppDataSource.getRepository(Standup);
    
    // Check if we already have data
    const count = await standupRepository.count();
    if (count > 0) {
      console.log('Database already has data. Skipping seed.');
      return true;
    }
    
    // Sample data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayFormatted = today.toISOString().split('T')[0];
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    // Create sample standups
    const standups = [
      {
        date: todayFormatted,
        yesterday: "Implemented database schema and API endpoints for the StandupSync application. Fixed several bugs in the user interface.",
        today: "Planning to connect the frontend to the backend API and implement the standup entry flow.",
        blockers: "None at the moment.",
        tags: ["backend", "api"]
      },
      {
        date: yesterdayFormatted,
        yesterday: "Set up project structure and initialized the repository. Created basic component skeletons.",
        today: "Will implement database schema and API endpoints for the StandupSync application.",
        blockers: "Need to figure out the best approach for natural language processing.",
        tags: ["setup", "planning"]
      }
    ];
    
    for (const standup of standups) {
      await standupRepository.save(standupRepository.create(standup));
    }
    
    console.log('Database seeded with sample data.');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};
