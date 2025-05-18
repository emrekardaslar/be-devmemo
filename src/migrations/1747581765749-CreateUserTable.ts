import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1747581765749 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("user");
        if (!tableExists) {
            await queryRunner.createTable(new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isUnique: true
                    },
                    {
                        name: "firstName",
                        type: "varchar"
                    },
                    {
                        name: "lastName",
                        type: "varchar"
                    },
                    {
                        name: "passwordHash",
                        type: "varchar"
                    },
                    {
                        name: "passwordResetToken",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "passwordResetExpires",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "isVerified",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "verificationToken",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "refreshToken",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "roles",
                        type: "varchar",
                        default: "'user'"
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }), true);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("user");
        if (tableExists) {
            await queryRunner.dropTable("user");
        }
    }
} 