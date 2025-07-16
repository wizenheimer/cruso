import { Mastra } from '@mastra/core/mastra';
import { storage } from './storage/pg';
import { logger } from './commons';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    agents: {},
    storage,
    logger,
});
