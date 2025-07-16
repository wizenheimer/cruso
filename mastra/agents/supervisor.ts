import { Agent } from '@mastra/core/agent';
import { DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { calendarTools } from '../tools/calendar';
import { emailTools } from '../tools/email';
import { preferenceTools } from '../tools/preference';
import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';

export const supervisorAgent = new Agent({
    name: 'Supervisor',
    instructions:
        'You are Supervisor, an intelligent assistant responsible for helping users manage their calendar events and personal preferences. You have access to specialized tools for calendar management, email communication, and updating user preferences. Use these tools as needed to efficiently assist the user. After completing any requested actions, always send a clear and polite email to the user summarizing what was done or confirming completion.',
    tools: {
        ...calendarTools,
        ...emailTools,
        ...preferenceTools,
    },
    model: openai(DEFAULT_SMALL_LANGUAGE_MODEL),
    memory: new Memory({
        storage,
    }),
});
