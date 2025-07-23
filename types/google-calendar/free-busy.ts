import { z } from 'zod';
import {
    FreeBusyQueryRequestSchema,
    FreeBusyQueryResponseSchema,
} from '@/schema/google-calendar/free-busy';

export type FreeBusyQueryRequest = z.infer<typeof FreeBusyQueryRequestSchema>;
export type FreeBusyQueryResponse = z.infer<typeof FreeBusyQueryResponseSchema>;
