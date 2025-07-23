import { GoogleCalendarEventSchema } from '@/schema/google-calendar/event';
import { z } from 'zod';

export type GoogleCalendarEvent = z.infer<typeof GoogleCalendarEventSchema>;
