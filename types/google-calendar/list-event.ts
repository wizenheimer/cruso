import { z } from 'zod';
import {
    EventsListOptionsSchema,
    EventsListResponseSchema,
} from '@/schema/google-calendar/list-event';

export type EventsListOptions = z.infer<typeof EventsListOptionsSchema>;
export type EventsListResponse = z.infer<typeof EventsListResponseSchema>;
