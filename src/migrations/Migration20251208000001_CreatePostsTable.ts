import { Migration } from "@mikro-orm/migrations";

export class Migration20251208000001_CreatePostsTable extends Migration {
    async up(): Promise<void> {
        this.addSql(`
      CREATE TABLE post (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100),
        published BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

        this.addSql(`
      CREATE INDEX ASYNC post_published_idx ON post (published)
    `);

        this.addSql(`
      CREATE INDEX ASYNC post_created_at_idx ON post (created_at)
    `);
    }

    async down(): Promise<void> {
        this.addSql("DROP TABLE IF EXISTS post CASCADE");
    }
}
