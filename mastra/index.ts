import { Mastra } from '@mastra/core/mastra';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { storage, logger } from './commons';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    workflows: { weatherWorkflow },
    agents: { weatherAgent },
    storage,
    logger,
});
