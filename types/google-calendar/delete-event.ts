import {
    DeleteEventOptionsSchema,
    DeleteEventResponseSchema,
} from '@/schema/google-calendar/delete-event';
import { z } from 'zod';

export type DeleteEventOptions = z.infer<typeof DeleteEventOptionsSchema>;
export type DeleteEventResponse = z.infer<typeof DeleteEventResponseSchema>;
