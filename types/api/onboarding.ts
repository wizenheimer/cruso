import { CreateAvailabilitySchema } from './availability';
import { z } from 'zod';

export const OnboardingSchema = z.object({
    // Step 1: Personal Info (from preferences)
    displayName: z.string().min(1, 'Display name is required'),
    nickname: z.string().optional(),
    timezone: z.string().min(1, 'Timezone is required'),

    // Step 2: Basic Preferences
    defaultMeetingDurationMinutes: z.number().min(5).max(480).default(30),
    minNoticeMinutes: z.number().min(5).max(1440).default(120),
    maxDaysAhead: z.number().min(1).max(365).default(60),
    bufferBeforeMinutes: z.number().min(0).max(60).default(0),
    bufferAfterMinutes: z.number().min(0).max(60).default(0),
    inPersonBufferBeforeMinutes: z.number().min(0).max(120).default(15),
    inPersonBufferAfterMinutes: z.number().min(0).max(120).default(15),

    // Step 3: Advanced Preferences (optional)
    backToBackLimitMinutes: z.number().min(0).max(480).optional(),
    backToBackBufferMinutes: z.number().min(0).max(60).optional(),
    clusterMeetings: z.boolean().default(false),
    meetingNamingConvention: z.string().optional(),
    refinement: z.string().optional(),

    // Step 4: Availability blocks (using base availability schema)
    availability: z
        .array(
            CreateAvailabilitySchema.omit({
                timezone: true, // Will be inherited from user timezone
            }),
        )
        .min(1, 'At least one availability block is required'),
});
