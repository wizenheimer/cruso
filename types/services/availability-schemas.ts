import { z } from 'zod';

// ==================================================
// Base Zod Schemas
// ==================================================

export const timeRangeSchema = z.object({
    start: z.string(), // RFC3339
    end: z.string(), // RFC3339
});

export const calendarEventDetailsSchema = z.object({
    id: z.string(),
    summary: z.string(),
    start: z.string(),
    end: z.string(),
    calendarId: z.string(),
    calendarName: z.string(),
});

export const workingHoursSchema = z.object({
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    timezone: z.string(),
});

export const suggestedTimeSlotSchema = z.object({
    start: z.string(), // RFC3339
    end: z.string(), // RFC3339
    score: z.number().min(0).max(100), // 0-100, higher is better
    reasoning: z.array(z.string()),
    conflictingAttendees: z.array(z.string()),
    availableAttendees: z.array(z.string()),
    workingHoursCompliance: z.boolean(),
});

// ==================================================
// Core Availability Schemas
// ==================================================

export const availabilityResultSchema = z.object({
    isAvailable: z.boolean(),
    timezone: z.string(),
    busySlots: z.array(
        z.object({
            start: z.string(),
            end: z.string(),
        }),
    ),
    freeSlots: z.array(
        z.object({
            start: z.string(),
            end: z.string(),
        }),
    ),
    events: z.array(calendarEventDetailsSchema),
});

export const blockAvailabilityResultSchema = z.object({
    state: z.enum(['success', 'error']),
    rescheduledEventCount: z.number().optional(),
    rescheduledEventDetails: z.array(z.any()).optional(), // CalendarEvent type
    blockEventDetails: z.any().optional(), // CalendarEvent type
    message: z.string().optional(),
});

export const clearAvailabilityResultSchema = z.object({
    state: z.enum(['success', 'error']),
    rescheduledEventCount: z.number().optional(),
    rescheduledEventDetails: z.array(z.any()).optional(), // CalendarEvent type
});

// ==================================================
// Input Option Schemas
// ==================================================

export const checkAvailabilityBlockOptionsSchema = z.object({
    includeCalendarIds: z.array(z.string()).optional(),
    excludeCalendarIds: z.array(z.string()).optional(),
    responseTimezone: z.string().optional(),
    timeDurationMinutes: z.number().optional(),
    includeEvents: z.boolean().optional(),
});

export const createAvailabilityBlockOptionsSchema = z.object({
    responseTimezone: z.string().optional(),
    timeDurationMinutes: z.number().optional(),
    eventSummary: z.string().optional(),
    eventDescription: z.string().optional(),
    eventAttendees: z.array(z.string()).optional(),
    eventLocation: z.string().optional(),
    eventConference: z.boolean().optional(),
    eventPrivate: z.boolean().optional(),
    eventColorId: z.string().optional(),
    createBlock: z.boolean().optional(),
});

export const findBestTimeForMeetingOptionsSchema = z.object({
    searchRangeStart: z.string().optional(), // Default: now
    searchRangeEnd: z.string().optional(), // Default: 2 weeks from now
    preferredTimeRanges: z.array(timeRangeSchema).optional(),
    workingHoursOnly: z.boolean().optional(),
    workingHours: z.array(workingHoursSchema).optional(), // Custom working hours
    minimumNoticeHours: z.number().optional(), // Default: 24
    maxSuggestions: z.number().optional(), // Default: 5
    timezone: z.string().optional(), // Default: UTC
    excludeWeekends: z.boolean().optional(), // Default: true
    preferMornings: z.boolean().optional(),
    preferAfternoons: z.boolean().optional(),
    bufferMinutes: z.number().optional(), // Buffer time before/after meetings
});

// ==================================================
// Internal Helper Schemas
// ==================================================

export const timeSlotSchema = z.object({
    start: z.string(),
    end: z.string(),
});

export const scoredEventSchema = z.object({
    event: z.any(), // CalendarEvent type
    score: z.number(),
    duration: z.number(),
});

export const generateTimeSlotsOptionsSchema = z.object({
    workingHoursOnly: z.boolean(),
    workingHours: z.array(workingHoursSchema),
    excludeWeekends: z.boolean(),
    bufferMinutes: z.number(),
});

export const workingHoursOptionsSchema = z.object({
    workingHoursOnly: z.boolean(),
    workingHours: z.array(workingHoursSchema),
    excludeWeekends: z.boolean(),
});

export const scoreTimeSlotOptionsSchema = z.object({
    preferredTimeRanges: z.array(timeRangeSchema).optional(),
    preferMornings: z.boolean().optional(),
    preferAfternoons: z.boolean().optional(),
});

// ==================================================
// Availability State Schemas
// ==================================================

export const availabilityStateSchema = z.enum(['available', 'busy', 'unknown']);

export const availabilitySlotSchema = z.object({
    start: z.string(),
    end: z.string(),
    state: availabilityStateSchema,
    eventId: z.string().optional(),
    eventSummary: z.string().optional(),
});

// ==================================================
// Meeting Scheduling Schemas
// ==================================================

export const meetingSchedulingRequestSchema = z.object({
    durationMinutes: z.number(),
    attendeeEmails: z.array(z.string().email()),
    options: findBestTimeForMeetingOptionsSchema.optional(),
});

export const meetingSchedulingResponseSchema = z.object({
    suggestions: z.array(suggestedTimeSlotSchema),
    totalSlotsChecked: z.number(),
    searchRange: z.object({
        start: z.string(),
        end: z.string(),
    }),
});

// ==================================================
// Working Hours Configuration Schemas
// ==================================================

export const workingHoursConfigSchema = z.object({
    timezone: z.string(),
    workingHours: z.array(workingHoursSchema),
    excludeWeekends: z.boolean(),
    bufferMinutes: z.number(),
});

export const defaultWorkingHoursSchema = z.record(z.array(workingHoursSchema)); // timezone -> working hours
