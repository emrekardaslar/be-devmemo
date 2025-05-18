import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateStandupTable1747581765750 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists first
        const tableExists = await queryRunner.hasTable("standup");
        if (!tableExists) {
            await queryRunner.createTable(new Table({
                name: "standup",
                columns: [
                    {
                        name: "date",
                        type: "varchar",
                        isPrimary: true
                    },
                    {
                        name: "yesterday",
                        type: "text"
                    },
                    {
                        name: "today",
                        type: "text"
                    },
                    {
                        name: "blockers",
                        type: "text"
                    },
                    {
                        name: "isBlockerResolved",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "tags",
                        type: "text",
                        isArray: true,
                        default: "{}"
                    },
                    {
                        name: "mood",
                        type: "int",
                        default: 0
                    },
                    {
                        name: "productivity",
                        type: "int",
                        default: 0
                    },
                    {
                        name: "isHighlight",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "userId",
                        type: "uuid",
                        isNullable: true
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

            // Check if user table exists before adding foreign key
            const userTableExists = await queryRunner.hasTable("user");
            if (userTableExists) {
                await queryRunner.createForeignKey("standup", new TableForeignKey({
                    columnNames: ["userId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "user",
                    onDelete: "SET NULL"
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if foreign key exists on table before dropping
        const table = await queryRunner.getTable("standup");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("standup", foreignKey);
            }
            await queryRunner.dropTable("standup");
        }
    }
} 