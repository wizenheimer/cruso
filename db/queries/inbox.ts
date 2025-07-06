import z from 'zod';

export const InboxFiltersSchema = z.object({
    type: z.enum(['inbound', 'outbound']).optional(),
    sender: z.string().optional(),
    recipient: z.string().email().optional(),
    subject: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(1000).default(50),
    offset: z.number().min(0).default(0),
});
