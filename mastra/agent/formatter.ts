import { Agent } from '@mastra/core/agent';
import { DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { htmlValidationTools } from '@/mastra/tools/email';
import { z } from 'zod';
import { getBasePromptForAgent } from '../commons';

/**
 * Email formatting prompt
 */
let baseEmailFormattingPrompt: string | null = null;

const defaultPrompt = `
You are an HTML email formatter. Convert unstructured text into clean HTML while preserving ALL original content exactly.

Rules:
- Use only: <p>, <br>, <strong>, <em>
- Keep formatting minimal - no colors, complex layouts, or fancy styling
- Never add, remove, or change any original content
- Maintain the original voice and tone exactly
- Use validateEmailHTMLTool to ensure valid output
- Return only the HTML content, no additional text or explanations.

Process: Convert text → Validate HTML → Return clean HTML that preserves everything.
`;

/**
 * Agent instructions
 */
const getAgentInstructions = async () => {
    if (baseEmailFormattingPrompt === null) {
        baseEmailFormattingPrompt = await getBasePromptForAgent(
            defaultPrompt,
            process.env.EMAIL_FORMATTING_AGENT_PROMPT_FILE,
            process.env.EMAIL_FORMATTING_AGENT_PROMPT_URI,
        );
    }
    return `
    ${baseEmailFormattingPrompt}
    Convert this text to clean HTML email format. Use validateEmailHTMLTool to ensure it's valid. Return only the HTML content, no additional text or explanations.
    `;
};

/**
 * Email formatting agent
 */
export const emailFormattingAgent = new Agent({
    name: 'emailFormattingAgent',
    instructions: getAgentInstructions,
    tools: htmlValidationTools,
    model: openai(DEFAULT_SMALL_LANGUAGE_MODEL),
});

/**
 * Usage:
 *
 * const result = await formatEmailText("Hey John, just wanted to follow up...");
 *
 * if (result.success) {
 *     console.log('Formatted HTML:', result.html);
 * }
 */
