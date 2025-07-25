import { Mastra } from '@mastra/core/mastra';
import { storage } from './storage/pg';
import { logger } from './commons';
import { schedulingAgent } from './agent/scheduling';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    agents: {
        schedulingAgent,
    },
    storage,
    logger,
});
