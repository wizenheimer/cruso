import { z } from 'zod';
import { calendarSyncStatusSchema } from './shared';

// ==================================================
// Base Zod Schemas
// ==================================================

const accessRoleSchema = z.enum(['freeBusyReader', 'reader', 'writer', 'owner']);
const healthStatusSchema = z.enum(['healthy', 'warning', 'error']);

// Re-export shared schemas for convenience
export { calendarSyncStatusSchema } from './shared';

// ==================================================
// Connections Service Schemas
// ==================================================

export const syncAllCalendarsResultSchema = z.object({
    success: z.number(),
    errors: z.array(z.string()),
});

export const fetchAllCalendarListsResultSchema = z.object({
    accountsSynced: z.number(),
    calendarsSynced: z.number(),
    errors: z.array(z.string()),
});

// ==================================================
// Calendar Sync Schemas
// ==================================================

export const calendarSyncResultSchema = z.object({
    success: z.boolean(),
    calendarId: z.string(),
    error: z.string().optional(),
    lastSyncAt: z.string(),
});

export const calendarSyncOptionsSchema = z.object({
    forceSync: z.boolean().optional(),
    includeDeleted: z.boolean().optional(),
    syncToken: z.string().optional(),
});

// ==================================================
// Calendar Connection Schemas
// ==================================================

export const calendarConnectionInfoSchema = z.object({
    id: z.string(),
    calendarId: z.string(),
    calendarName: z.string(),
    accountId: z.string(),
    googleEmail: z.string().email(),
    isPrimary: z.boolean(),
    isActive: z.boolean(),
    includeInAvailability: z.boolean(),
    syncStatus: calendarSyncStatusSchema,
    lastSyncAt: z.string().optional(),
    timeZone: z.string().optional(),
});

export const calendarConnectionUpdateSchema = z.object({
    calendarName: z.string().optional(),
    isPrimary: z.boolean().optional(),
    includeInAvailability: z.boolean().optional(),
    syncStatus: calendarSyncStatusSchema.optional(),
    timeZone: z.string().optional(),
});

export const calendarConnectionCreateSchema = z.object({
    calendarId: z.string(),
    calendarName: z.string(),
    accountId: z.string(),
    googleEmail: z.string().email(),
    isPrimary: z.boolean().optional(),
    includeInAvailability: z.boolean().optional(),
    timeZone: z.string().optional(),
});

// ==================================================
// Calendar List Schemas
// ==================================================

export const calendarListEntrySchema = z.object({
    id: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    timeZone: z.string().optional(),
    primary: z.boolean().optional(),
    accessRole: accessRoleSchema.optional(),
    backgroundColor: z.string().optional(),
    foregroundColor: z.string().optional(),
    selected: z.boolean().optional(),
    deleted: z.boolean().optional(),
});

export const calendarListResultSchema = z.object({
    items: z.array(calendarListEntrySchema),
    nextPageToken: z.string().optional(),
    nextSyncToken: z.string().optional(),
});

export const calendarListOptionsSchema = z.object({
    maxResults: z.number().min(1).max(2500).optional(),
    pageToken: z.string().optional(),
    syncToken: z.string().optional(),
    showDeleted: z.boolean().optional(),
    showHidden: z.boolean().optional(),
    minAccessRole: accessRoleSchema.optional(),
});

// ==================================================
// Calendar Account Schemas
// ==================================================

export const calendarAccountSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    picture: z.string().url().optional(),
    isActive: z.boolean(),
    lastSyncAt: z.string().optional(),
});

export const calendarAccountSyncSchema = z.object({
    accountId: z.string(),
    calendars: z.array(calendarListEntrySchema),
    syncStatus: z.enum(['success', 'error', 'partial']),
    errors: z.array(z.string()),
});

// ==================================================
// Calendar Sync Response Schemas
// ==================================================

export const calendarSyncResponseSchema = z.object({
    success: z.boolean(),
    data: z
        .object({
            calendars: z.array(z.any()), // CalendarInfo type
            syncStatus: z.array(calendarSyncStatusSchema),
        })
        .optional(),
    error: z.string().optional(),
    timestamp: z.string(),
});

export const calendarSyncBatchResultSchema = z.object({
    successful: z.array(calendarSyncResultSchema),
    failed: z.array(calendarSyncResultSchema),
    totalProcessed: z.number(),
    totalSuccess: z.number(),
    totalFailed: z.number(),
});

// ==================================================
// Calendar Connection Validation Schemas
// ==================================================

export const calendarConnectionValidationSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    connection: calendarConnectionInfoSchema,
});

export const calendarConnectionValidationOptionsSchema = z.object({
    checkPermissions: z.boolean().optional(),
    validateCalendarId: z.boolean().optional(),
    checkAccountStatus: z.boolean().optional(),
});

// ==================================================
// Calendar Connection Query Schemas
// ==================================================

export const calendarConnectionQuerySchema = z.object({
    accountId: z.string().optional(),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
    includeInAvailability: z.boolean().optional(),
    syncStatus: calendarSyncStatusSchema.optional(),
    googleEmail: z.string().email().optional(),
});

export const calendarConnectionQueryResultSchema = z.object({
    connections: z.array(calendarConnectionInfoSchema),
    totalResults: z.number(),
    nextPageToken: z.string().optional(),
});

// ==================================================
// Calendar Connection Management Schemas
// ==================================================

export const calendarConnectionManagementSchema = z.object({
    addConnection: z
        .function()
        .args(calendarConnectionCreateSchema)
        .returns(z.promise(calendarConnectionInfoSchema)),
    updateConnection: z
        .function()
        .args(z.string(), calendarConnectionUpdateSchema)
        .returns(z.promise(calendarConnectionInfoSchema)),
    removeConnection: z.function().args(z.string()).returns(z.promise(z.void())),
    getConnection: z.function().args(z.string()).returns(z.promise(calendarConnectionInfoSchema)),
    listConnections: z
        .function()
        .args(calendarConnectionQuerySchema.optional())
        .returns(z.promise(calendarConnectionQueryResultSchema)),
});

// ==================================================
// Calendar Connection Health Schemas
// ==================================================

export const calendarConnectionHealthSchema = z.object({
    calendarId: z.string(),
    status: healthStatusSchema,
    lastCheck: z.string(),
    responseTime: z.number().optional(),
    errorRate: z.number().min(0).max(1).optional(),
    lastError: z.string().optional(),
    recommendations: z.array(z.string()).optional(),
});

export const calendarConnectionHealthCheckSchema = z.object({
    checkAll: z.function().returns(z.promise(z.array(calendarConnectionHealthSchema))),
    checkConnection: z
        .function()
        .args(z.string())
        .returns(z.promise(calendarConnectionHealthSchema)),
    getHealthSummary: z.function().returns(
        z.promise(
            z.object({
                total: z.number(),
                healthy: z.number(),
                warning: z.number(),
                error: z.number(),
            }),
        ),
    ),
});
