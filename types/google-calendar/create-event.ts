import {
    CreateEventOptionsSchema,
    CreateEventRequestSchema,
    CreateEventResponseSchema,
    CreateEventSchema,
} from '@/schema/google-calendar/create-event';
import { z } from 'zod';

export type CreateEventOptions = z.infer<typeof CreateEventOptionsSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>;
export type CreateEventSchema = z.infer<typeof CreateEventSchema>;
