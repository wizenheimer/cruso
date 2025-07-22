// Export all service-related types
export * from './availability';
export * from './availability-schemas';
export * from './connections';
export * from './connections-schemas';
export * from './events';
export * from './events-schemas';
export * from './recurring-events';
export * from './recurring-events-schemas';
export * from './search';
export * from './search-schemas';

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
    EventResponse,
    EventFilters,
    EventSyncResult,
    BatchOperation,
    EventAttendee,
    EventReminder,
    GetEventsOptions,
    CreateEventOptions,
    UpdateEventOptions,
    DeleteEventOptions,
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
    eventResponseSchema,
    eventFiltersSchema,
    batchOperationSchema,
    eventAttendeeSchema,
    eventReminderSchema,
    getEventsOptionsSchema,
    createEventOptionsSchema,
    updateEventOptionsSchema,
    deleteEventOptionsSchema,
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
