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

export const getUserFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    const user: User = runtimeContext.get('user');
    if (!user) {
        throw new Error('User is required');
    }
    return user;
};
