import { GetEventOptionsSchema, GetEventResponseSchema } from '@/schema/google-calendar/get-event';
import { z } from 'zod';

export type GetEventOptions = z.infer<typeof GetEventOptionsSchema>;
export type GetEventResponse = z.infer<typeof GetEventResponseSchema>;
