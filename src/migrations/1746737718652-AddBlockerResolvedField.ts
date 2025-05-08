import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockerResolvedField1746737718652 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "standup" ADD "isBlockerResolved" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "standup" DROP COLUMN "isBlockerResolved"`);
    }

}
