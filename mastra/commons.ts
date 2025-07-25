import { preferenceService } from '@/services/preferences';
import { User } from '@/types/users';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { PinoLogger } from '@mastra/loggers';

/**
 * Logger - It is used to log the data of the workflow and agent.
 */
export const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',
});

export const USER_CONTEXT_KEY = 'user';
export const PREFERENCE_CONTEXT_KEY = 'preference';
export const TIMESTAMP_CONTEXT_KEY = 'timestamp';
