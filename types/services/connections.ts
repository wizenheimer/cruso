import { z } from 'zod';
import type { CalendarInfo } from './base';
import type { CalendarSyncStatus } from './shared';
import * as schemas from './connections-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Connections Service Types
export type SyncAllCalendarsResult = z.infer<typeof schemas.syncAllCalendarsResultSchema>;
export type FetchAllCalendarListsResult = z.infer<typeof schemas.fetchAllCalendarListsResultSchema>;

// Calendar Sync Types
export type CalendarSyncResult = z.infer<typeof schemas.calendarSyncResultSchema>;
export type CalendarSyncOptions = z.infer<typeof schemas.calendarSyncOptionsSchema>;

// Calendar Connection Types
export type CalendarConnectionInfo = z.infer<typeof schemas.calendarConnectionInfoSchema>;
export type CalendarConnectionUpdate = z.infer<typeof schemas.calendarConnectionUpdateSchema>;
export type CalendarConnectionCreate = z.infer<typeof schemas.calendarConnectionCreateSchema>;

// Calendar List Types
export type CalendarListEntry = z.infer<typeof schemas.calendarListEntrySchema>;
export type CalendarListResult = z.infer<typeof schemas.calendarListResultSchema>;
export type CalendarListOptions = z.infer<typeof schemas.calendarListOptionsSchema>;

// Calendar Account Types
export type CalendarAccount = z.infer<typeof schemas.calendarAccountSchema>;
export type CalendarAccountSync = z.infer<typeof schemas.calendarAccountSyncSchema>;

// Calendar Sync Response Types
export type CalendarSyncResponse = z.infer<typeof schemas.calendarSyncResponseSchema>;
export type CalendarSyncBatchResult = z.infer<typeof schemas.calendarSyncBatchResultSchema>;

// Calendar Connection Validation Types
export type CalendarConnectionValidation = z.infer<
    typeof schemas.calendarConnectionValidationSchema
>;
export type CalendarConnectionValidationOptions = z.infer<
    typeof schemas.calendarConnectionValidationOptionsSchema
>;

// Calendar Connection Query Types
export type CalendarConnectionQuery = z.infer<typeof schemas.calendarConnectionQuerySchema>;
export type CalendarConnectionQueryResult = z.infer<
    typeof schemas.calendarConnectionQueryResultSchema
>;

// Calendar Connection Management Types
export type CalendarConnectionManagement = z.infer<
    typeof schemas.calendarConnectionManagementSchema
>;

// Calendar Connection Health Types
export type CalendarConnectionHealth = z.infer<typeof schemas.calendarConnectionHealthSchema>;
export type CalendarConnectionHealthCheck = z.infer<
    typeof schemas.calendarConnectionHealthCheckSchema
>;

// Re-export shared types for convenience
export type { CalendarSyncStatus } from './shared';

// Schemas are re-exported from the index file
