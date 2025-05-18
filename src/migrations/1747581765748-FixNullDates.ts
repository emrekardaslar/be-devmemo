import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNullDates1747581765748 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check if there are null dates
        const nullDates = await queryRunner.query(
            `SELECT * FROM "standup" WHERE "date" IS NULL`
        );

        // If null dates exist, provide them with a default value
        if (nullDates.length > 0) {
            await queryRunner.query(
                `UPDATE "standup" SET "date" = CONCAT('unknown-', id) WHERE "date" IS NULL`
            );
        }

        // After filling null values, add NOT NULL constraint
        await queryRunner.query(
            `ALTER TABLE "standup" ALTER COLUMN "date" SET NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert NOT NULL constraint
        await queryRunner.query(
            `ALTER TABLE "standup" ALTER COLUMN "date" DROP NOT NULL`
        );
    }
} 