import { z } from 'zod';
import type { CalendarEvent, TimeRange } from './base';
import * as schemas from './availability-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Core Availability Types
export type AvailabilityResult = z.infer<typeof schemas.availabilityResultSchema>;
export type BlockAvailabilityResult = z.infer<typeof schemas.blockAvailabilityResultSchema>;
export type ClearAvailabilityResult = z.infer<typeof schemas.clearAvailabilityResultSchema>;
export type WorkingHours = z.infer<typeof schemas.workingHoursSchema>;
export type SuggestedTimeSlot = z.infer<typeof schemas.suggestedTimeSlotSchema>;

// Input Types for Service Methods
export type CheckAvailabilityBlockOptions = z.infer<
    typeof schemas.checkAvailabilityBlockOptionsSchema
>;
export type CreateAvailabilityBlockOptions = z.infer<
    typeof schemas.createAvailabilityBlockOptionsSchema
>;
export type FindBestTimeForMeetingOptions = z.infer<
    typeof schemas.findBestTimeForMeetingOptionsSchema
>;

// Internal Helper Types
export type TimeSlot = z.infer<typeof schemas.timeSlotSchema>;
export type ScoredEvent = z.infer<typeof schemas.scoredEventSchema>;
export type GenerateTimeSlotsOptions = z.infer<typeof schemas.generateTimeSlotsOptionsSchema>;
export type WorkingHoursOptions = z.infer<typeof schemas.workingHoursOptionsSchema>;
export type ScoreTimeSlotOptions = z.infer<typeof schemas.scoreTimeSlotOptionsSchema>;

// Event Types
export type CalendarEventDetails = z.infer<typeof schemas.calendarEventDetailsSchema>;

// Availability State Types
export type AvailabilityState = z.infer<typeof schemas.availabilityStateSchema>;
export type AvailabilitySlot = z.infer<typeof schemas.availabilitySlotSchema>;

// Meeting Scheduling Types
export type MeetingSchedulingRequest = z.infer<typeof schemas.meetingSchedulingRequestSchema>;
export type MeetingSchedulingResponse = z.infer<typeof schemas.meetingSchedulingResponseSchema>;

// Working Hours Configuration
export type WorkingHoursConfig = z.infer<typeof schemas.workingHoursConfigSchema>;
export type DefaultWorkingHours = z.infer<typeof schemas.defaultWorkingHoursSchema>;

// Schemas are re-exported from the index file
