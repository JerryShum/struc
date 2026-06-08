import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('⏳ Running database migrations...');
  const migrationsFolder = path.resolve(__dirname, '../../drizzle');
  try {
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run standalone if this file is run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('migrate.ts') || 
  process.argv[1].endsWith('migrate.js')
);

if (isDirectRun) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
