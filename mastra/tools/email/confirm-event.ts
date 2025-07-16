import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the confirm event tool
 */
const sendConfirmationEmailInputSchema = z.object({
    eventId: z.string().optional().describe('The id of the event created'),
    eventLink: z.string().optional().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    eventEnd: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventConferenceData: z
        .boolean()
        .optional()
        .describe('Whether to add Google Meet videoconference'),
    eventAllDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
});

/**
 * The output schema for the confirm event tool
 */
const sendConfirmationEmailOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

/**
 * Send a confirmation email to the recipient
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The state of the email sending
 */
export const confirmEventTool = createTool({
    id: 'confirm-event',
    description: 'Send a confirmation email for the event',
    inputSchema: sendConfirmationEmailInputSchema,
    outputSchema: sendConfirmationEmailOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
            eventLink,
            eventTitle,
            eventStart,
            eventEnd,
            eventLocation,
            eventDescription,
            eventAttendees,
            eventConferenceData,
            eventAllDay,
        } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        const threadId = runtimeContext.get('threadId');
        if (!threadId) {
            throw new Error('Thread ID is required');
        }
        console.log(
            'triggered send confirmation email tool',
            eventId,
            eventLink,
            eventTitle,
            eventStart,
            eventEnd,
            eventLocation,
            eventDescription,
            eventAttendees,
            eventConferenceData,
            eventAllDay,
            userId,
        );
        return {
            state: 'success' as const,
        };
    },
});
