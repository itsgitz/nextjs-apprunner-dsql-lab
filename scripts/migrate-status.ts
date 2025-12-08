import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';

async function migrationStatus() {
  let orm: MikroORM | undefined;

  try {
    console.log('Connecting to database...');
    orm = await MikroORM.init(config);

    const migrator = orm.getMigrator();

    const executed = await migrator.getExecutedMigrations();
    const pending = await migrator.getPendingMigrations();

    console.log('\n=== Migration Status ===\n');

    console.log(`Executed migrations (${executed.length}):`);
    if (executed.length === 0) {
      console.log('  (none)');
    } else {
      executed.forEach(m => console.log(`  ✓ ${m.name}`));
    }

    console.log(`\nPending migrations (${pending.length}):`);
    if (pending.length === 0) {
      console.log('  (none)');
    } else {
      pending.forEach(m => console.log(`  ⧖ ${m.name}`));
    }

    console.log('');

  } catch (error) {
    console.error('Failed to get migration status:', error);
    process.exit(1);
  } finally {
    if (orm) {
      await orm.close(true);
    }
  }
}

migrationStatus();
