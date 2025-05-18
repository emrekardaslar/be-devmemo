import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockerResolvedField1746737718652 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding it
        const columnExists = await queryRunner.hasColumn("standup", "isBlockerResolved");
        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE "standup" ADD "isBlockerResolved" boolean NOT NULL DEFAULT false`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping it
        const columnExists = await queryRunner.hasColumn("standup", "isBlockerResolved");
        if (columnExists) {
            await queryRunner.query(`ALTER TABLE "standup" DROP COLUMN "isBlockerResolved"`);
        }
    }

}
