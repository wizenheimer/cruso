// mastra/index.ts
import { Mastra } from '@mastra/core/mastra';
import { storage } from './storage';
import { firstPersonSchedulingAgent } from './agent/first-person-scheduling';
import { thirdPersonSchedulingAgent } from './agent/third-person-scheduling';
import { emailDraftingAgent } from './agent/email-drafting';
import { PinoLogger } from '@mastra/loggers';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    agents: {
        firstPersonSchedulingAgent,
        thirdPersonSchedulingAgent,
        emailDraftingAgent,
    },
    storage,
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
});
