import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { HtmlValidate, ConfigData, Message } from 'html-validate';
import { logToolExecution } from './log';

/**
 * HTML validation configuration optimized for email HTML
 */
const EMAIL_HTML_CONFIG: ConfigData = {
    rules: {
        // Core structure rules
        'close-order': 'error',
        'no-missing-close': 'error',
        'void-content': 'error',

        // Email compatibility
        'no-inline-style': 'off',
        'no-unknown-elements': 'error',

        // Turn off unnecessary rules for email
        'no-trailing-whitespace': 'off',
        'prefer-native-element': 'off',
        'wcag/h30': 'off',
        'wcag/h32': 'off',
        'meta-refresh': 'off',
    },
    elements: ['html5'],
};

/**
 * Strict HTML validation configuration (removed)
 */

/**
 * HTML validation result interface
 */
interface HTMLValidationResult {
    isValid: boolean;
    validationSummary: string;
}

/**
 * Convert html-validate message to our format
 */
function convertMessage(msg: Message) {
    return {
        line: msg.line,
        message: msg.message,
    };
}

/**
 * Validate HTML using html-validate library
 */
async function validateHTMLContent(
    html: string,
    config: ConfigData,
): Promise<HTMLValidationResult> {
    const htmlvalidate = new HtmlValidate(config);
    const report = await htmlvalidate.validateString(html);

    const isValid = report.valid;
    let validationSummary = '';

    if (isValid) {
        validationSummary = 'HTML is valid and ready for email use.';
    } else {
        const errors = report.results[0]?.messages || [];
        const errorCount = errors.length;

        validationSummary = `Please provide only the HTML content without any additional text or explanations.\n\nHTML validation failed with ${errorCount} error(s):\n\n`;

        errors.forEach((error: Message, index: number) => {
            const { line, message } = convertMessage(error);
            validationSummary += `${index + 1}. Line ${line}: ${message}\n`;
        });
    }

    return {
        isValid,
        validationSummary,
    };
}

/**
 * Validate HTML tool for email content
 * Returns the original HTML string if valid, otherwise returns validation errors
 */
export const validateEmailHTMLTool = createTool({
    id: 'validate-email-html',
    description:
        'Validate HTML content for email formatting. Returns the HTML string if valid, or errors if invalid.',
    inputSchema: z.object({
        html: z.string().describe('The HTML content to validate'),
    }),
    outputSchema: z.object({
        isValid: z.boolean(),
        validationSummary: z.string(),
    }),
    execute: async ({ context }) => {
        const { html } = context;

        try {
            const result = await validateHTMLContent(html, EMAIL_HTML_CONFIG);
            logToolExecution('validate-email-html', context, result);
            return result;
        } catch (error) {
            const errorResult = {
                isValid: false,
                validationSummary: `Validation failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            logToolExecution('validate-email-html', context, errorResult);
            return errorResult;
        }
    },
});
