import { availability } from '@/db/schema/availability';
import z from 'zod';

export const CreateAvailabilitySchema = z.object({
    days: z.array(z.number()).nullable().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format'),
    timezone: z.string().min(1),
});

export const AvailabilityCheckSchema = z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isInPerson: z.boolean().default(false),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;
