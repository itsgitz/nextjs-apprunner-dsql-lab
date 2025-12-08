import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';

async function rollbackMigration() {
  let orm: MikroORM | undefined;

  try {
    console.log('Connecting to database...');
    orm = await MikroORM.init(config);

    const migrator = orm.getMigrator();

    console.log('Rolling back last migration...');
    const executed = await migrator.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('No executed migrations to rollback.');
      return;
    }

    await migrator.down();
    console.log('Rollback completed successfully!');

  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    if (orm) {
      await orm.close(true);
    }
  }
}

rollbackMigration();
