import { Agent } from '@mastra/core/agent';
import { DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { htmlValidationTools } from '@/mastra/tools/email';
import { z } from 'zod';

/**
 * Email formatting prompt
 */
const EMAIL_FORMATTING_PROMPT = `You are an HTML email formatter. Convert unstructured text into clean HTML while preserving ALL original content exactly.

## Core Responsibilities:
1. Convert unstructured text into clean HTML email format
2. Preserve ALL original content - do not add, remove, or modify any information
3. Maintain the original author's voice, tone, and writing style exactly
4. Create professional but simple HTML formatting suitable for email clients
5. Validate HTML output using the available validation tools

## Formatting Guidelines:
- Use simple, clean HTML tags: <p>, <br>, <strong>, <em>, <ul>, <li>
- Apply basic styling for readability (proper spacing, line height)
- Keep styling minimal and professional - no fancy colors or complex layouts
- Ensure proper paragraph breaks and text flow
- Make it feel like well-formatted plain text in HTML form
- Optimize for email client compatibility

## Critical Rules:
- NEVER add new information, suggestions, or content
- NEVER remove, summarize, or skip any details from the original
- NEVER change the author's word choices, phrasing, or tone
- NEVER make assumptions or fill in gaps
- ALWAYS preserve the original message structure and flow
- ALWAYS validate your HTML output using the validation tools

## Process:
1. Analyze the input text to understand structure and content
2. Convert to clean HTML while preserving all information
3. Use the validateEmailHTMLTool to ensure HTML is valid
4. If validation fails, fix errors and re-validate
5. Return the validated HTML that maintains the original voice and content

Remember: Your job is formatting only - be a transparent formatter that enhances readability without altering content. You can only output the HTML content, no additional text or explanations.`;

/**
 * Agent instructions
 */
const getInstructions = () => {
    return `
    ${EMAIL_FORMATTING_PROMPT}
    Convert this text to clean HTML email format. Use validateEmailHTMLTool to ensure it's valid.
    Return only the HTML content, no additional text or explanations.
    `;
};

/**
 * Email formatting agent
 */
export const emailFormattingAgent = new Agent({
    name: 'emailFormattingAgent',
    instructions: getInstructions,
    tools: htmlValidationTools,
    model: openai(DEFAULT_SMALL_LANGUAGE_MODEL),
});

/**
 * Format email text
 */
export async function formatEmailText(originalText: string): Promise<{
    success: boolean;
    content: string;
}> {
    try {
        const result = await emailFormattingAgent.generate(originalText, {
            output: z.object({
                htmlContent: z
                    .string()
                    .describe(
                        'Formatted and validated HTML email, without any additional text or explanations',
                    ),
                isValid: z.boolean().describe('Whether the HTML was formatted and validated'),
            }),
        });

        return {
            success: true,
            content:
                result.object.isValid && result.object.htmlContent
                    ? result.object.htmlContent
                    : originalText,
        };
    } catch (error) {
        return {
            success: false,
            content: originalText,
        };
    }
}

/**
 * Batch format multiple emails
 */
export async function formatMultipleEmails(emails: Array<{ text: string; id?: string }>): Promise<
    Array<{
        id?: string;
        success: boolean;
        html?: string;
        error?: string;
    }>
> {
    const results = [];

    for (const email of emails) {
        const result = await formatEmailText(email.text);
        results.push({
            id: email.id,
            ...result,
        });
    }

    return results;
}

/**
 * Usage:
 *
 * const result = await formatEmailText("Hey John, just wanted to follow up...");
 *
 * if (result.success) {
 *     console.log('Formatted HTML:', result.html);
 * }
 */
