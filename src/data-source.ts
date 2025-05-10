import "reflect-metadata";
import { DataSource } from "typeorm";
import { Standup } from "./entity/Standup";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let dataSource: DataSource;

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
  
  // Create production data source
  dataSource = new DataSource({
    type: "postgres",
    host: host,
    port: parseInt(port, 10),
    username: username,
    password: password,
    database: database,
    synchronize: true,
    logging: false,
    entities: [Standup],
    migrations: [],
    subscribers: [],
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });
} else {
  // Development configuration using local PostgreSQL
  console.log('Using local PostgreSQL in development');
  dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "standupsync",
    synchronize: true,
    logging: true,
    entities: [Standup],
    migrations: [],
    subscribers: []
  });
}

export const AppDataSource = dataSource; 