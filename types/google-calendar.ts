import {
    GoogleCalendarListEntrySchema,
    GoogleCalendarListOptionsSchema,
    GoogleCalendarListResponseSchema,
} from '@/schema/google-calendar';
import { z } from 'zod';

export type GoogleCalendarListEntry = z.infer<typeof GoogleCalendarListEntrySchema>;
export type GoogleCalendarListOptions = z.infer<typeof GoogleCalendarListOptionsSchema>;
export type GoogleCalendarListResponse = z.infer<typeof GoogleCalendarListResponseSchema>;
