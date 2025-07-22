// Export all service-related types
export * from './shared';
export * from './base';
export * from './availability';
export * from './connections';
export * from './events';
export * from './recurring-events';
export * from './search';

// Re-export commonly used availability types for convenience
export type {
    AvailabilityResult,
    BlockAvailabilityResult,
    ClearAvailabilityResult,
    WorkingHours,
    SuggestedTimeSlot,
    CheckAvailabilityBlockOptions,
    CreateAvailabilityBlockOptions,
    FindBestTimeForMeetingOptions,
    MeetingSchedulingRequest,
    MeetingSchedulingResponse,
} from './availability';

// Re-export commonly used connections types for convenience
export type {
    CalendarConnectionInfo,
    CalendarListEntry,
    CalendarSyncResult,
    CalendarAccount,
    CalendarConnectionHealth,
    CalendarConnectionCreate,
    CalendarConnectionUpdate,
    CalendarConnectionQuery,
} from './connections';

// Re-export commonly used events types for convenience
export type {
    GetEventsResult,
    ListEventsFromPrimaryCalendarResult,
    EventResponse,
    EventFilters,
    EventSyncResult,
    BatchOperation,
    ListEventsOptions,
    GetEventOptions,
    CreateEventOptions,
    UpdateEventOptions,
    DeleteEventOptions,
    DeleteResponse,
} from './events';

// Re-export commonly used recurring events types for convenience
export type {
    RecurringEventInstance,
    RecurringEventPattern,
    RecurringEventException,
    RecurringEventExpansionResult,
    RecurringEventValidationResult,
    RecurringEventSyncResult,
    RecurringEventQueryResult,
    GetRecurringEventInstancesResult,
    CreateRecurringEventOptions,
    UpdateRecurringEventOptions,
    DeleteRecurringEventOptions,
} from './recurring-events';

// Re-export commonly used search types for convenience
export type {
    SearchOptions,
    SearchResult,
    SearchFilters,
    SearchSortOptions,
    SearchSortConfig,
    SearchResultItem,
    SearchFacets,
    EnhancedSearchResult,
    SearchPreset,
    SearchPerformanceMetrics,
    SearchQuery,
    SearchQueryResult,
    SearchSuggestion,
    SearchSuggestionsResult,
    SearchAnalytics,
} from './search';

// Re-export commonly used base types for convenience
export type { RecurrenceRule, CalendarEvent, CalendarInfo } from './base';

// Re-export availability schemas for runtime validation
export {
    availabilityResultSchema,
    blockAvailabilityResultSchema,
    clearAvailabilityResultSchema,
    workingHoursSchema,
    suggestedTimeSlotSchema,
    meetingSchedulingRequestSchema,
    meetingSchedulingResponseSchema,
} from './availability-schemas';

// Re-export connections schemas for runtime validation
export {
    calendarConnectionInfoSchema,
    calendarListEntrySchema,
    calendarSyncResultSchema,
    calendarAccountSchema,
    calendarConnectionHealthSchema,
    calendarConnectionCreateSchema,
    calendarConnectionUpdateSchema,
    calendarConnectionQuerySchema,
} from './connections-schemas';

// Re-export events schemas for runtime validation
export {
    getEventsResultSchema,
    listEventsFromPrimaryCalendarResultSchema,
    eventResponseSchema,
    eventFiltersSchema,
    batchOperationSchema,
    listEventsOptionsSchema,
    getEventOptionsSchema,
    createEventOptionsSchema,
    updateEventOptionsSchema,
    deleteEventOptionsSchema,
    deleteResponseSchema,
} from './events-schemas';

// Re-export recurring events schemas for runtime validation
export {
    recurringEventInstanceSchema,
    recurringEventPatternSchema,
    recurringEventExceptionSchema,
    recurringEventExpansionResultSchema,
    recurringEventValidationResultSchema,
    recurringEventSyncResultSchema,
    recurringEventQueryResultSchema,
    getRecurringEventInstancesResultSchema,
    createRecurringEventOptionsSchema,
    updateRecurringEventOptionsSchema,
    deleteRecurringEventOptionsSchema,
} from './recurring-events-schemas';

// Re-export search schemas for runtime validation
export {
    searchOptionsSchema,
    searchResultSchema,
    searchFiltersSchema,
    searchSortOptionsSchema,
    searchSortConfigSchema,
    searchResultItemSchema,
    searchFacetsSchema,
    enhancedSearchResultSchema,
    searchPresetSchema,
    searchPerformanceMetricsSchema,
    searchQuerySchema,
    searchQueryResultSchema,
    searchSuggestionSchema,
    searchSuggestionsResultSchema,
    searchAnalyticsSchema,
} from './search-schemas';

// Re-export base schemas for runtime validation
export { recurrenceRuleSchema, calendarEventSchema, calendarInfoSchema } from './base';
