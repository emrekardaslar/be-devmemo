import { DataSource } from 'typeorm';
import { Standup } from '../../src/entity/Standup';

// Create test data source with in-memory SQLite for testing
export const getTestDataSource = async () => {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    dropSchema: true,
    entities: [Standup],
    synchronize: true,
    logging: false
  });

  await dataSource.initialize();
  return dataSource;
};

// Generate sample standup data for testing
export const getTestStandupData = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayFormatted = today.toISOString().split('T')[0];
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
  return [
    {
      date: todayFormatted,
      yesterday: "Implemented unit tests",
      today: "Working on API integration",
      blockers: "None",
      tags: ["testing", "api"],
      mood: 4,
      productivity: 5,
      isHighlight: true
    },
    {
      date: yesterdayFormatted,
      yesterday: "Set up project structure",
      today: "Implementing unit tests",
      blockers: "Environment setup issues",
      tags: ["setup", "testing"],
      mood: 3,
      productivity: 4,
      isHighlight: false
    }
  ];
}; 