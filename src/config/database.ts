import { DataSource } from 'typeorm';
import { join } from 'path';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let dataSourceConfig;

if (isProduction && databaseUrl) {
  // Production configuration with Supabase connection string
  console.log('Using Supabase PostgreSQL in production');
  
  // Parse the connection string to extract components
  const connectionRegex = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = databaseUrl.match(connectionRegex);
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  const [, username, password, host, port, database] = match;
  
  // Create production data source configuration
  dataSourceConfig = {
    type: 'postgres',
    host: host,
    port: parseInt(port, 10),
    username: username,
    password: password,
    database: database,
    synchronize: false, // Disable auto-synchronization in production
    logging: false,
    entities: [join(__dirname, '../entity/*.{js,ts}')], // Use glob pattern for entity loading
    migrations: [],
    subscribers: [],
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  };
} else {
  // Development configuration using local PostgreSQL
  console.log('Using local PostgreSQL in development');
  dataSourceConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'standups',
    entities: [join(__dirname, '../entity/*.{js,ts}')], // Use glob pattern for entity loading
    synchronize: true, // For development only
    logging: true // Set to true for debugging
  };
}

// Create the AppDataSource instance
export const AppDataSource = new DataSource(dataSourceConfig as any);

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection has been established successfully.');
    
    // Only synchronize schema in development
    if (AppDataSource.isInitialized && !isProduction) {
      console.log('Database schema synchronized in development mode.');
    }
    
    // For production, manually ensure the table structure is correct
    if (AppDataSource.isInitialized && isProduction) {
      try {
        // Check if our table exists
        const tableExists = await AppDataSource.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'standup'
          );
        `);
        
        if (tableExists[0].exists) {
          console.log('Standup table exists in production.');
          
          // Check for null date values and fix them if needed
          const nullDateCheck = await AppDataSource.query(`
            SELECT COUNT(*) FROM standup WHERE date IS NULL;
          `);
          
          if (parseInt(nullDateCheck[0].count) > 0) {
            console.log(`Found ${nullDateCheck[0].count} rows with NULL date values. Fixing...`);
            
            // Update null dates with a placeholder value
            await AppDataSource.query(`
              UPDATE standup 
              SET date = 'imported-' || now()::text 
              WHERE date IS NULL;
            `);
            
            console.log('Fixed null date values.');
          }
        } else {
          console.log('Standup table does not exist. Creating it manually...');
          
          // Create the table manually with the correct structure
          await AppDataSource.query(`
            CREATE TABLE IF NOT EXISTS standup (
              date VARCHAR(255) PRIMARY KEY,
              yesterday TEXT,
              today TEXT,
              blockers TEXT,
              "isBlockerResolved" BOOLEAN DEFAULT FALSE,
              tags TEXT[],
              mood INTEGER DEFAULT 0,
              productivity INTEGER DEFAULT 0,
              "isHighlight" BOOLEAN DEFAULT FALSE,
              "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          console.log('Standup table created manually.');
        }
      } catch (error) {
        console.error('Error checking or fixing database schema:', error);
      }
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
    
    const standupRepository = AppDataSource.getRepository('Standup');
    
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
