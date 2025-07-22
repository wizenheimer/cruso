import { z } from 'zod';
import { CalendarEvent } from '@/services/calendar/base';
import * as schemas from './search-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Search Service Types
export type SearchOptions = z.infer<typeof schemas.searchOptionsSchema>;
export type SearchResult = z.infer<typeof schemas.searchResultSchema>;
export type QuickSearchPresets = z.infer<typeof schemas.quickSearchPresetsSchema>;

// Search Filter Types
export type SearchFilters = z.infer<typeof schemas.searchFiltersSchema>;

// Search Sort Types
export type SearchSortOptions = z.infer<typeof schemas.searchSortOptionsSchema>;
export type SearchSortConfig = z.infer<typeof schemas.searchSortConfigSchema>;

// Search Result Types
export type SearchResultItem = z.infer<typeof schemas.searchResultItemSchema>;
export type SearchFacets = z.infer<typeof schemas.searchFacetsSchema>;
export type EnhancedSearchResult = z.infer<typeof schemas.enhancedSearchResultSchema>;

// Search Preset Types
export type SearchPreset = z.infer<typeof schemas.searchPresetSchema>;
export type SearchPresetCategory = z.infer<typeof schemas.searchPresetCategorySchema>;

// Search Performance Types
export type SearchPerformanceMetrics = z.infer<typeof schemas.searchPerformanceMetricsSchema>;
export type SearchPerformanceConfig = z.infer<typeof schemas.searchPerformanceConfigSchema>;

// Search Query Types
export type SearchQuery = z.infer<typeof schemas.searchQuerySchema>;
export type SearchQueryResult = z.infer<typeof schemas.searchQueryResultSchema>;

// Search Suggestion Types
export type SearchSuggestion = z.infer<typeof schemas.searchSuggestionSchema>;
export type SearchSuggestionsResult = z.infer<typeof schemas.searchSuggestionsResultSchema>;

// Search Analytics Types
export type SearchAnalytics = z.infer<typeof schemas.searchAnalyticsSchema>;
export type SearchAnalyticsOptions = z.infer<typeof schemas.searchAnalyticsOptionsSchema>;

// Schemas are re-exported from the index file
