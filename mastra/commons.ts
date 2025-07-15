import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';

/**
 * Logger - It is used to log the data of the workflow and agent.
 */
export const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',
});

/**
 * Storage - It is used to store the data of the workflow and agent.
 */
export const storage = new PostgresStore({
    connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cruso',
});
