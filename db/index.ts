import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString =
    process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/cruso';

// Create the connection
const sql = postgres(connectionString);

// Create the database instance
export const db = drizzle(sql);
