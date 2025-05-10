const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.error('Please set the DATABASE_URL environment variable with your Supabase connection string');
  process.exit(1);
}

// Create a new PostgreSQL client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function setupDatabase() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    
    console.log('Connection successful!');
    
    // Run a simple query
    console.log('Running test query...');
    const result = await client.query('SELECT NOW() as current_time');
    
    console.log('Query result:', result.rows[0]);
    
    // Create the standup table if it doesn't exist
    console.log('Creating/checking standup table...');
    await client.query(`
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
      )
    `);
    
    console.log('Standup table created/verified');
    
    // Check if sample data exists
    const dataCheck = await client.query('SELECT COUNT(*) FROM standup');
    
    // Insert sample data if none exists
    if (parseInt(dataCheck.rows[0].count) === 0) {
      console.log('Inserting sample data...');
      await client.query(`
        INSERT INTO standup (date, yesterday, today, blockers, "isBlockerResolved", tags, mood, productivity, "isHighlight")
        VALUES 
          ('2023-08-15', 'Set up Supabase database', 'Create API endpoints', 'Connection issues', true, ARRAY['database', 'setup'], 4, 3, true),
          ('2023-08-14', 'Project planning', 'Database schema design', 'None', false, ARRAY['planning'], 5, 4, false)
      `);
      console.log('Sample data inserted');
    } else {
      console.log(`Database already contains ${dataCheck.rows[0].count} records`);
    }
    
    // Check the data
    console.log('Querying all standups...');
    const standups = await client.query('SELECT * FROM standup');
    
    console.log('All standups:', standups.rows);
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Connection closed');
  }
}

// Run the function
setupDatabase(); 