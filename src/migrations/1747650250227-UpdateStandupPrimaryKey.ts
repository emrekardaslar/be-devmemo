import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 as uuidv4 } from 'uuid';

export class UpdateStandupPrimaryKey1747650250227 implements MigrationInterface {
    name = 'UpdateStandupPrimaryKey1747650250227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check if there are any standups with NULL userId
        const result = await queryRunner.query(`SELECT COUNT(*) FROM "standup" WHERE "userId" IS NULL`);
        const nullCount = parseInt(result[0].count);
        
        if (nullCount > 0) {
            // Create a system user for existing standups with NULL userId if it doesn't exist
            const systemUserExists = await queryRunner.query(`SELECT COUNT(*) FROM "user" WHERE email = 'system@standupsync.com'`);
            let systemUserId;
            
            if (parseInt(systemUserExists[0].count) === 0) {
                systemUserId = uuidv4();
                await queryRunner.query(`
                    INSERT INTO "user" (id, email, "firstName", "lastName", "passwordHash", "isVerified", roles)
                    VALUES ('${systemUserId}', 'system@standupsync.com', 'System', 'User', 'notapassword', true, 'admin')
                `);
            } else {
                const systemUser = await queryRunner.query(`SELECT id FROM "user" WHERE email = 'system@standupsync.com'`);
                systemUserId = systemUser[0].id;
            }
            
            // Update NULL userIds to the system user
            await queryRunner.query(`UPDATE "standup" SET "userId" = '${systemUserId}' WHERE "userId" IS NULL`);
        }
        
        // Check if the primary key constraint exists before trying to drop it
        const tableConstraints = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'standup' 
            AND constraint_type = 'PRIMARY KEY'
        `);
        
        // If a primary key constraint exists, drop it
        if (tableConstraints.length > 0) {
            const pkConstraintName = tableConstraints[0].constraint_name;
            await queryRunner.query(`ALTER TABLE "standup" DROP CONSTRAINT "${pkConstraintName}"`);
        }
        
        // Set userId to NOT NULL
        await queryRunner.query(`ALTER TABLE "standup" ALTER COLUMN "userId" SET NOT NULL`);
        
        // Add the new composite primary key
        await queryRunner.query(`ALTER TABLE "standup" ADD CONSTRAINT "PK_8194f8ca3746ce8714691bcc085" PRIMARY KEY ("date", "userId")`);
        
        // Update the foreign key if it exists
        const fkConstraints = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'standup' 
            AND constraint_type = 'FOREIGN KEY' 
            AND constraint_name LIKE '%userId%'
        `);
        
        if (fkConstraints.length > 0) {
            const fkConstraintName = fkConstraints[0].constraint_name;
            await queryRunner.query(`ALTER TABLE "standup" DROP CONSTRAINT "${fkConstraintName}"`);
        }
        
        // Add the foreign key constraint
        await queryRunner.query(`ALTER TABLE "standup" ADD CONSTRAINT "FK_a262c6ac94210fe1262a4bb13de" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint if it exists
        const fkConstraints = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'standup' 
            AND constraint_type = 'FOREIGN KEY' 
            AND constraint_name LIKE '%userId%'
        `);
        
        if (fkConstraints.length > 0) {
            const fkConstraintName = fkConstraints[0].constraint_name;
            await queryRunner.query(`ALTER TABLE "standup" DROP CONSTRAINT "${fkConstraintName}"`);
        }
        
        // Re-add the foreign key constraint
        await queryRunner.query(`ALTER TABLE "standup" ADD CONSTRAINT "FK_a262c6ac94210fe1262a4bb13de" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Drop the composite primary key if it exists
        const pkConstraints = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'standup' 
            AND constraint_type = 'PRIMARY KEY'
        `);
        
        if (pkConstraints.length > 0) {
            const pkConstraintName = pkConstraints[0].constraint_name;
            await queryRunner.query(`ALTER TABLE "standup" DROP CONSTRAINT "${pkConstraintName}"`);
        }
        
        // Allow userId to be NULL again
        await queryRunner.query(`ALTER TABLE "standup" ALTER COLUMN "userId" DROP NOT NULL`);
        
        // Add back the original primary key on date
        await queryRunner.query(`ALTER TABLE "standup" ADD CONSTRAINT "PK_9b2f59152b8373df13747300e67" PRIMARY KEY ("date")`);
    }
}
