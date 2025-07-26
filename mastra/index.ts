import { Mastra } from '@mastra/core/mastra';
import { storage } from './storage/pg';
import { logger } from './commons';
import { firstPartySchedulingAgent } from './agent/fpscheduling';
import { thirdPartySchedulingAgent } from './agent/tpscheduling';
import { emailFormattingAgent } from './agent/formatter';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    agents: {
        firstPartySchedulingAgent,
        thirdPartySchedulingAgent,
        emailFormattingAgent,
    },
    storage,
    logger,
});
