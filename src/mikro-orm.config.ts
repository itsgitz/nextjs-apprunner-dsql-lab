import "dotenv/config";
import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { getConnectionConfig } from "./lib/aws-auth";
import { Post } from "./entities/Post";

export default defineConfig({
    entities: [Post],
    entitiesTs: ["./src/entities"],
    dbName: process.env.DSQL_DATABASE || "postgres",
    driverOptions: {
        connection: async () => {
            const config = await getConnectionConfig();
            return {
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: config.database,
                ssl: {
                    rejectUnauthorized: true,
                },
            };
        },
    },
    extensions: [Migrator],
    migrations: {
        path: "./src/migrations",
        pathTs: "./src/migrations",
        tableName: "mikro_orm_migrations",
        disableForeignKeys: false,
        transactional: false,
        allOrNothing: false,
        emit: "ts",
    },
    allowGlobalContext: true,
    debug: process.env.NODE_ENV === "development",
});
