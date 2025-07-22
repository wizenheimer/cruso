import { z } from 'zod';
import { calendarEventSchema } from './base';

// ==================================================
// Base Zod Schemas
// ==================================================

export const orderBySchema = z.enum(['startTime', 'updated']);
export const sortFieldSchema = z.enum([
    'startTime',
    'endTime',
    'created',
    'updated',
    'summary',
    'duration',
]);
export const sortDirectionSchema = z.enum(['asc', 'desc']);
export const responseStatusSchema = z.enum(['needsAction', 'declined', 'tentative', 'accepted']);
export const searchFieldSchema = z.enum(['summary', 'description', 'location', 'attendees']);
export const presetCategorySchema = z.enum(['time', 'people', 'type', 'custom']);
export const suggestionTypeSchema = z.enum(['query', 'filter', 'field']);
export const groupBySchema = z.enum(['day', 'week', 'month']);

// ==================================================
// Search Service Schemas
// ==================================================

export const searchOptionsSchema = z.object({
    // Text search
    query: z.string().optional(), // Search in summary, description, location, attendees

    // Time filters
    timeMin: z.string().optional(), // RFC3339
    timeMax: z.string().optional(), // RFC3339

    // Common filters
    hasAttendees: z.boolean().optional(), // true = meetings, false = focus time
    attendeeEmail: z.string().email().optional(), // Events with specific attendee
    location: z.string().optional(), // Partial match on location
    isRecurring: z.boolean().optional(), // Filter recurring events
    isAllDay: z.boolean().optional(), // Filter all-day events

    // Advanced options
    createdAfter: z.string().optional(), // RFC3339 - for finding recently created events
    updatedAfter: z.string().optional(), // RFC3339 - for finding recently modified events
    minDuration: z.number().min(0).optional(), // Minutes
    maxDuration: z.number().min(0).optional(), // Minutes

    // Response options
    maxResults: z.number().min(1).max(1000).optional(), // Default: 50
    orderBy: orderBySchema.optional(),
    ascending: z.boolean().optional(), // Default: true
    includeDeleted: z.boolean().optional(), // Default: false
    expandRecurring: z.boolean().optional(), // Default: true (show instances)
    timezone: z.string().optional(), // Response timezone
});

export const searchResultSchema = z.object({
    events: z.array(calendarEventSchema),
    totalResults: z.number().min(0),
    executionTime: z.number().min(0), // milliseconds
    nextPageToken: z.string().optional(),
});

export const quickSearchPresetsSchema = z.object({
    todaysMeetings: z.function().args().returns(z.promise(searchResultSchema)),
    upcomingWeek: z.function().args().returns(z.promise(searchResultSchema)),
    recentlyCreated: z
        .function()
        .args(z.number().optional())
        .returns(z.promise(searchResultSchema)),
    withPerson: z
        .function()
        .args(z.string().email(), z.number().optional())
        .returns(z.promise(searchResultSchema)),
    longMeetings: z.function().args(z.number().optional()).returns(z.promise(searchResultSchema)),
    recurringEvents: z.function().args().returns(z.promise(searchResultSchema)),
    pastMeetings: z.function().args(z.number().optional()).returns(z.promise(searchResultSchema)),
    freeTextSearch: z.function().args(z.string()).returns(z.promise(searchResultSchema)),
});

// ==================================================
// Search Filter Schemas
// ==================================================

export const searchFiltersSchema = z.object({
    // Text filters
    text: z
        .object({
            query: z.string(),
            fields: z.array(searchFieldSchema),
            caseSensitive: z.boolean().optional(),
            exactMatch: z.boolean().optional(),
        })
        .optional(),

    // Time filters
    timeRange: z
        .object({
            start: z.string(),
            end: z.string(),
            includeAllDay: z.boolean().optional(),
        })
        .optional(),

    // Attendee filters
    attendees: z
        .object({
            emails: z.array(z.string().email()).optional(),
            hasAttendees: z.boolean().optional(),
            organizerOnly: z.boolean().optional(),
            responseStatus: responseStatusSchema.optional(),
        })
        .optional(),

    // Event type filters
    eventTypes: z
        .object({
            isRecurring: z.boolean().optional(),
            isAllDay: z.boolean().optional(),
            hasConference: z.boolean().optional(),
            hasLocation: z.boolean().optional(),
        })
        .optional(),

    // Duration filters
    duration: z
        .object({
            minMinutes: z.number().min(0).optional(),
            maxMinutes: z.number().min(0).optional(),
            exactMinutes: z.number().min(0).optional(),
        })
        .optional(),

    // Date filters
    dates: z
        .object({
            createdAfter: z.string().optional(),
            createdBefore: z.string().optional(),
            updatedAfter: z.string().optional(),
            updatedBefore: z.string().optional(),
        })
        .optional(),

    // Location filters
    location: z
        .object({
            query: z.string(),
            exactMatch: z.boolean().optional(),
            caseSensitive: z.boolean().optional(),
        })
        .optional(),
});

// ==================================================
// Search Sort Schemas
// ==================================================

export const searchSortOptionsSchema = z.object({
    field: sortFieldSchema,
    direction: sortDirectionSchema,
});

export const searchSortConfigSchema = z.object({
    primary: searchSortOptionsSchema,
    secondary: searchSortOptionsSchema.optional(),
    tertiary: searchSortOptionsSchema.optional(),
});

// ==================================================
// Search Result Schemas
// ==================================================

export const searchResultItemSchema = z.object({
    relevanceScore: z.number().min(0).max(1).optional(),
    matchedFields: z.array(z.string()).optional(),
    highlightSnippets: z
        .array(
            z.object({
                field: z.string(),
                snippet: z.string(),
            }),
        )
        .optional(),
    // ... other CalendarEvent properties would be here
});

export const searchFacetsSchema = z.object({
    attendees: z
        .array(
            z.object({
                email: z.string().email(),
                count: z.number().min(0),
            }),
        )
        .optional(),
    locations: z
        .array(
            z.object({
                location: z.string(),
                count: z.number().min(0),
            }),
        )
        .optional(),
    eventTypes: z
        .array(
            z.object({
                type: z.string(),
                count: z.number().min(0),
            }),
        )
        .optional(),
    timeRanges: z
        .array(
            z.object({
                range: z.string(),
                count: z.number().min(0),
            }),
        )
        .optional(),
});

export const enhancedSearchResultSchema = searchResultSchema.extend({
    items: z.array(searchResultItemSchema),
    facets: searchFacetsSchema.optional(),
    suggestions: z.array(z.string()).optional(),
    totalPages: z.number().min(0).optional(),
    currentPage: z.number().min(1).optional(),
});

// ==================================================
// Search Preset Schemas
// ==================================================

export const searchPresetSchema = z.object({
    name: z.string(),
    description: z.string(),
    options: searchOptionsSchema,
    category: presetCategorySchema,
});

export const searchPresetCategorySchema = z.object({
    name: z.string(),
    presets: z.array(searchPresetSchema),
});

// ==================================================
// Search Performance Schemas
// ==================================================

export const searchPerformanceMetricsSchema = z.object({
    queryTime: z.number().min(0), // milliseconds
    filterTime: z.number().min(0), // milliseconds
    sortTime: z.number().min(0), // milliseconds
    totalTime: z.number().min(0), // milliseconds
    resultCount: z.number().min(0),
    cacheHit: z.boolean().optional(),
});

export const searchPerformanceConfigSchema = z.object({
    enableCaching: z.boolean().optional(),
    cacheTTL: z.number().min(0).optional(), // seconds
    maxResults: z.number().min(1).max(1000).optional(),
    timeout: z.number().min(0).optional(), // milliseconds
});

// ==================================================
// Search Query Schemas
// ==================================================

export const searchQuerySchema = z.object({
    text: z.string().optional(),
    filters: searchFiltersSchema.optional(),
    sort: searchSortConfigSchema.optional(),
    pagination: z
        .object({
            page: z.number().min(1),
            pageSize: z.number().min(1).max(100),
        })
        .optional(),
    options: searchOptionsSchema.optional(),
});

export const searchQueryResultSchema = z.object({
    query: searchQuerySchema,
    result: enhancedSearchResultSchema,
    performance: searchPerformanceMetricsSchema,
});

// ==================================================
// Search Suggestion Schemas
// ==================================================

export const searchSuggestionSchema = z.object({
    text: z.string(),
    type: suggestionTypeSchema,
    relevance: z.number().min(0).max(1),
    metadata: z.record(z.any()).optional(),
});

export const searchSuggestionsResultSchema = z.object({
    suggestions: z.array(searchSuggestionSchema),
    query: z.string(),
    context: z.record(z.any()).optional(),
});

// ==================================================
// Search Analytics Schemas
// ==================================================

export const searchAnalyticsSchema = z.object({
    totalSearches: z.number().min(0),
    averageQueryTime: z.number().min(0),
    popularQueries: z.array(
        z.object({
            query: z.string(),
            count: z.number().min(0),
        }),
    ),
    searchTrends: z.array(
        z.object({
            date: z.string(),
            searches: z.number().min(0),
        }),
    ),
    filterUsage: z.record(z.number().min(0)),
});

export const searchAnalyticsOptionsSchema = z.object({
    timeRange: z
        .object({
            start: z.string(),
            end: z.string(),
        })
        .optional(),
    groupBy: groupBySchema.optional(),
    includeDetails: z.boolean().optional(),
});
