import { PinoLogger } from '@mastra/loggers';
import { createAgentConfig } from './flag';
import { getAgentInstructions } from './instructions';
import { getAllowedTools } from './tools';
import { getInferenceConfig } from './model';
import {
    getUserFromRuntimeContext,
    getUserPreferenceFromRuntimeContext,
    getTimestampFromRuntimeContext,
    getAttendeesFromRuntimeContext,
    getHostFromRuntimeContext,
    getTimezoneFromRuntimeContext,
} from './runtime';

/**
 * Logger - It is used to log the data of the workflow and agent.
 */
export const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',
});

export {
    // Flag
    createAgentConfig,
    getAgentInstructions,
    getAllowedTools,
    getInferenceConfig,
    // Runtime
    getUserFromRuntimeContext,
    getUserPreferenceFromRuntimeContext,
    getTimestampFromRuntimeContext,
    getAttendeesFromRuntimeContext,
    getHostFromRuntimeContext,
    getTimezoneFromRuntimeContext,
};
