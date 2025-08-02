import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';
import { openai } from '@ai-sdk/openai';
import { DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';

/**
 * Memory for the agent
 */
export const agentMemory = new Memory({
    storage,
    options: {
        threads: {
            generateTitle: {
                model: openai(DEFAULT_SMALL_LANGUAGE_MODEL),
                instructions:
                    'Generate a concise title for the email exchange. The title should be a single sentence that captures the essence of the conversation.',
            },
        },
        lastMessages: 10,
    },
});
