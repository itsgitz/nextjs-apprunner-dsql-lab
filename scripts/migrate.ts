import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import config from "../src/mikro-orm.config";

async function runMigrations() {
    let orm: MikroORM | undefined;

    try {
        console.log("Connecting to database...");
        orm = await MikroORM.init(config);

        const migrator = orm.migrator;

        console.log("Running pending migrations...");
        const pending = await migrator.getPendingMigrations();

        if (pending.length === 0) {
            console.log("No pending migrations found.");
            return;
        }

        console.log(`Found ${pending.length} pending migration(s):`);
        pending.forEach((m) => console.log(`  - ${m.name}`));

        await migrator.up();
        console.log("Migrations completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        if (orm) {
            await orm.close(true);
        }
    }
}

runMigrations();
