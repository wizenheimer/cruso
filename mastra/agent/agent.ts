import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { calendarTools, preferenceTools } from '../tools';
import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load prompt from file
const promptPath = join(process.cwd(), 'mastra', 'prompt', 'agent.txt');
const agentPrompt = readFileSync(promptPath, 'utf-8');

export const schedulingAgent = new Agent({
    name: 'schedulingAgent',
    instructions: agentPrompt,
    tools: {
        ...calendarTools,
        ...preferenceTools,
    },
    model: openai(DEFAULT_LARGE_LANGUAGE_MODEL),
    memory: new Memory({
        storage,
    }),
});
