import { z } from 'zod';
import { CalendarEvent } from '@/services/calendar/base';
import { RecurrenceRule } from '@/lib/recurrence';
import * as schemas from './recurring-events-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Recurring Events Service Types
export type GetRecurringEventInstancesOptions = z.infer<
    typeof schemas.getRecurringEventInstancesOptionsSchema
>;
export type GetRecurringEventInstancesResult = z.infer<
    typeof schemas.getRecurringEventInstancesResultSchema
>;
export type GetRecurringEventInstancesInPrimaryCalendarResult = z.infer<
    typeof schemas.getRecurringEventInstancesInPrimaryCalendarResultSchema
>;
export type CreateRecurringEventOptions = z.infer<typeof schemas.createRecurringEventOptionsSchema>;
export type CreateRecurringEventInPrimaryCalendarResult = z.infer<
    typeof schemas.createRecurringEventInPrimaryCalendarResultSchema
>;
export type RecurringEvent = z.infer<typeof schemas.recurringEventSchema>;
export type UpdateRecurringEventOptions = z.infer<typeof schemas.updateRecurringEventOptionsSchema>;
export type UpdateRecurringEventInPrimaryCalendarResult = z.infer<
    typeof schemas.updateRecurringEventInPrimaryCalendarResultSchema
>;
export type UpdateRecurringEventData = z.infer<typeof schemas.updateRecurringEventDataSchema>;
export type UpdateFutureRecurringEventsOptions = z.infer<
    typeof schemas.updateFutureRecurringEventsOptionsSchema
>;
export type UpdateFutureRecurringEventsData = z.infer<
    typeof schemas.updateFutureRecurringEventsDataSchema
>;
export type UpdateFutureRecurringEventsInPrimaryCalendarResult = z.infer<
    typeof schemas.updateFutureRecurringEventsInPrimaryCalendarResultSchema
>;
export type GetRecurringEventOptions = z.infer<typeof schemas.getRecurringEventOptionsSchema>;
export type GetRecurringEventFromPrimaryCalendarResult = z.infer<
    typeof schemas.getRecurringEventFromPrimaryCalendarResultSchema
>;
export type RescheduleRecurringEventOptions = z.infer<
    typeof schemas.rescheduleRecurringEventOptionsSchema
>;
export type RescheduleRecurringEventInPrimaryCalendarResult = z.infer<
    typeof schemas.rescheduleRecurringEventInPrimaryCalendarResultSchema
>;
export type UpdateRecurringEventInstanceOptions = z.infer<
    typeof schemas.updateRecurringEventInstanceOptionsSchema
>;
export type UpdateRecurringEventInstanceInPrimaryCalendarResult = z.infer<
    typeof schemas.updateRecurringEventInstanceInPrimaryCalendarResultSchema
>;
export type DeleteRecurringEventOptions = z.infer<typeof schemas.deleteRecurringEventOptionsSchema>;
export type DeleteRecurringEventFromPrimaryCalendarResult = z.infer<
    typeof schemas.deleteRecurringEventFromPrimaryCalendarResultSchema
>;
export type DeleteRecurringEventInstanceOptions = z.infer<
    typeof schemas.deleteRecurringEventInstanceOptionsSchema
>;
export type DeleteRecurringEventInstanceInPrimaryCalendarResult = z.infer<
    typeof schemas.deleteRecurringEventInstanceInPrimaryCalendarResultSchema
>;
export type BatchCreateRecurringEventsOptions = z.infer<
    typeof schemas.batchCreateRecurringEventsOptionsSchema
>;
export type BatchCreateRecurringEventsResult = z.infer<
    typeof schemas.batchCreateRecurringEventsResultSchema
>;

// Recurring Event Instance Types
export type RecurringEventInstance = z.infer<typeof schemas.recurringEventInstanceSchema>;
export type RecurringEventInstanceUpdate = z.infer<
    typeof schemas.recurringEventInstanceUpdateSchema
>;

// Recurring Event Pattern Types
export type RecurringEventPattern = z.infer<typeof schemas.recurringEventPatternSchema>;

// Recurring Event Exception Types
export type RecurringEventException = z.infer<typeof schemas.recurringEventExceptionSchema>;

// Recurring Event Expansion Types
export type RecurringEventExpansionOptions = z.infer<
    typeof schemas.recurringEventExpansionOptionsSchema
>;
export type RecurringEventExpansionResult = z.infer<
    typeof schemas.recurringEventExpansionResultSchema
>;

// Recurring Event Validation Types
export type RecurringEventValidationResult = z.infer<
    typeof schemas.recurringEventValidationResultSchema
>;
export type RecurringEventValidationOptions = z.infer<
    typeof schemas.recurringEventValidationOptionsSchema
>;

// Recurring Event Sync Types
export type RecurringEventSyncOptions = z.infer<typeof schemas.recurringEventSyncOptionsSchema>;
export type RecurringEventSyncResult = z.infer<typeof schemas.recurringEventSyncResultSchema>;

// Recurring Event Query Types
export type RecurringEventQuery = z.infer<typeof schemas.recurringEventQuerySchema>;
export type RecurringEventQueryResult = z.infer<typeof schemas.recurringEventQueryResultSchema>;

// Re-export schemas for runtime validation
export { schemas };
