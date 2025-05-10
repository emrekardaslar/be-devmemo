import "reflect-metadata";
import { DataSource } from "typeorm";
import { Standup } from "./entity/Standup";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let dataSource: DataSource;

// Production configuration with Supabase connection string
if (isProduction && databaseUrl) {
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
  // Development configuration using SQLite
  dataSource = new DataSource({
    type: "sqlite",
    database: "standups.sqlite",
    synchronize: true,
    logging: false,
    entities: [Standup],
    migrations: [],
    subscribers: [],
  });
}

export const AppDataSource = dataSource; 