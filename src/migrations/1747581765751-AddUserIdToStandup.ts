import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserIdToStandup1747581765751 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the table exists
        const tableExists = await queryRunner.hasTable("standup");
        if (!tableExists) {
            return; // Skip if the table doesn't exist yet
        }

        // Check if the column already exists
        const hasUserIdColumn = await queryRunner.hasColumn("standup", "userid");
        
        // If column exists with lowercase name but not with camelCase, rename it
        if (hasUserIdColumn) {
            // Check if both variants exist (shouldn't happen but just in case)
            const hasCamelCaseUserIdColumn = await queryRunner.hasColumn("standup", "userId");
            if (!hasCamelCaseUserIdColumn) {
                // Rename the column from lowercase to camelCase
                await queryRunner.query(`
                    ALTER TABLE "standup" 
                    RENAME COLUMN "userid" TO "userId"
                `);
                console.log("Renamed userid column to userId");
            }
        } else {
            // Check if camelCase version exists
            const hasCamelCaseUserIdColumn = await queryRunner.hasColumn("standup", "userId");
            
            // If neither version exists, add the column
            if (!hasCamelCaseUserIdColumn) {
                await queryRunner.addColumn("standup", new TableColumn({
                    name: "userId",
                    type: "uuid",
                    isNullable: true
                }));
                console.log("Added userId column to standup table");
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to do anything here since we don't want to remove the column
        // and we don't want to revert column rename either
    }
} 