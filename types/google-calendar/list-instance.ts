import { z } from 'zod';
import {
    GetEventInstancesOptionsSchema,
    GetEventInstancesResponseSchema,
} from '@/schema/google-calendar/list-instance';
// Type inference for get event instances schemas
export type GetEventInstancesOptions = z.infer<typeof GetEventInstancesOptionsSchema>;
export type GetEventInstancesResponse = z.infer<typeof GetEventInstancesResponseSchema>;
