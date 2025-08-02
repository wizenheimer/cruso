// mastra/storage/index.ts
import { PostgresStore } from '@mastra/pg';

// Use global to cache storage instance across hot reloads
declare global {
    var __mastraStorage: PostgresStore | undefined;
}

/**
 * Storage - It is used to store the data of the workflow and agent.
 */
export const storage =
    globalThis.__mastraStorage ??
    new PostgresStore({
        connectionString:
            process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cruso',
        schemaName: 'mastra',
    });

if (process.env.NODE_ENV !== 'production') {
    globalThis.__mastraStorage = storage;
}
