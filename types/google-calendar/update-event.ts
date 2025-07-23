import { z } from 'zod';
import {
    UpdateEventOptionsSchema,
    UpdateEventRequestSchema,
    UpdateEventResponseSchema,
    UpdateEventSchema,
} from '@/schema/google-calendar/update-event';

export type UpdateEventOptions = z.infer<typeof UpdateEventOptionsSchema>;
export type UpdateEventRequest = z.infer<typeof UpdateEventRequestSchema>;
export type UpdateEventResponse = z.infer<typeof UpdateEventResponseSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
