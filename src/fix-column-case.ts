import { AppDataSource } from './data-source';

/**
 * This script can be run to fix column case issues in the database.
 * It specifically addresses the userId column in the standup table.
 */

const fixColumnCase = async () => {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    // Check for the existence of columns with different cases
    const queryRunner = AppDataSource.createQueryRunner();

    // First check if the standup table exists
    const standupTableExists = await queryRunner.hasTable('standup');
    if (!standupTableExists) {
      console.log('Standup table does not exist. Please run migrations first.');
      return;
    }

    // Get information about columns in the standup table
    const columnsResult = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'standup' AND table_schema = 'public'
    `);

    const columnNames = columnsResult.map(col => col.column_name);
    console.log('Columns in standup table:', columnNames);

    // Check for userId variants
    const hasUserId = columnNames.includes('userId');
    const hasUserid = columnNames.includes('userid');
    const hasUser_id = columnNames.includes('user_id');

    if (hasUserId) {
      console.log('Column "userId" exists with correct case. No action needed.');
    } else if (hasUserid) {
      console.log('Column "userid" exists with incorrect case. Renaming to "userId"');
      await queryRunner.query('ALTER TABLE "standup" RENAME COLUMN "userid" TO "userId"');
      console.log('Column renamed successfully.');
    } else if (hasUser_id) {
      console.log('Column "user_id" exists with snake case. Renaming to "userId"');
      await queryRunner.query('ALTER TABLE "standup" RENAME COLUMN "user_id" TO "userId"');
      console.log('Column renamed successfully.');
    } else {
      console.log('No userId column found. Adding column...');
      await queryRunner.query('ALTER TABLE "standup" ADD COLUMN "userId" uuid NULL');
      console.log('Column added successfully.');
    }

    // Release the query runner
    await queryRunner.release();
    
    console.log('Column case checking completed');
  } catch (error) {
    console.error('Error while fixing column case:', error);
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
};

// Run the function
fixColumnCase().catch(error => {
  console.error('Unhandled error in fixColumnCase:', error);
}); 