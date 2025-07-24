import {
    GoogleCalendarEventSchema,
    GoogleCalendarEventAttendeeSchema,
    GoogleCalendarEventReminderSchema,
} from '@/schema/google/event';
import { z } from 'zod';

export type GoogleCalendarEvent = z.infer<typeof GoogleCalendarEventSchema>;
export type GoogleCalendarEventReminder = z.infer<typeof GoogleCalendarEventReminderSchema>;
export type GoogleCalendarEventAttendee = z.infer<typeof GoogleCalendarEventAttendeeSchema>;
