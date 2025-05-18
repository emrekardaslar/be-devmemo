import "reflect-metadata";
import { DataSource, DefaultNamingStrategy } from "typeorm";
import dotenv from 'dotenv';
import { join } from 'path';
import { User } from "./entity/User";
import { Standup } from "./entity/Standup";

// Load environment variables
dotenv.config();

// Custom naming strategy for lowercase table names
class LowercaseNamingStrategy extends DefaultNamingStrategy {
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName.toLowerCase() : targetName.toLowerCase();
  }
}

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
    synchronize: false,
    logging: false,
    entities: [User, Standup], // Direct entity references
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: "migrations_history",
    namingStrategy: new LowercaseNamingStrategy(),
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
    database: "standups",
    synchronize: true,
    logging: true,
    entities: [User, Standup], // Direct entity references
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: "migrations_history",
    namingStrategy: new LowercaseNamingStrategy(),
    subscribers: []
  });
}

export const AppDataSource = dataSource; 