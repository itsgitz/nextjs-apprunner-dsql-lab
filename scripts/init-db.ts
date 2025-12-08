import { MikroORM } from "@mikro-orm/core";
import config from "../src/mikro-orm.config";

async function createMigrationTable() {
    console.log("Creating migration table with UUID primary key...");

    try {
        const orm = await MikroORM.init(config);
        const connection = orm.em.getConnection();

        // Create migration table with UUID instead of serial
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS "public"."mikro_orm_migrations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255),
        "executed_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      )
    `);

        console.log("Migration table created successfully");

        await orm.close();
        process.exit(0);
    } catch (error) {
        console.error("Failed to create migration table:", error);
        process.exit(1);
    }
}

createMigrationTable();
