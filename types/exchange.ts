import { z } from 'zod';
import { exchangeData } from '@/db/schema/exchange';
import {
    CreateExchangeDataSchema,
    UpdateExchangeDataSchema,
    ExchangeFiltersSchema,
    RawEmailDataSchema,
    EmailDataSchema,
    PartialRawEmailDataSchema,
    PartialEmailDataSchema,
    PartialExchangeDataSchema,
    ServiceResultSchema,
    GetExchangeDataResultSchema,
    CreateExchangeDataResultSchema,
    UpdateExchangeDataResultSchema,
    DeleteExchangeDataResultSchema,
} from '@/schema/exchange';

// Types - inferred from the DB schema

/**
 * Exchange data record as stored in the database.
 * Contains email exchange information including sender, recipient, subject, and content.
 * Used for reading exchange data from the database.
 * @see db/schema/exchange.ts - Source schema definition
 * @see db/queries/exchange.ts - Used in exchange queries
 */
export type ExchangeData = typeof exchangeData.$inferSelect;

/**
 * Exchange data for inserting new records into the database.
 * Contains required fields for creating new exchange records.
 * Used when storing new email exchanges in the database.
 * @see db/schema/exchange.ts - Source schema definition
 * @see db/queries/exchange.ts - Used in createExchangeData query
 */
export type InsertExchangeData = typeof exchangeData.$inferInsert;

/**
 * Input data for creating new exchange records.
 * Contains validated exchange data for API operations.
 * Used as request body when creating exchanges via API.
 * @see schema/exchange.ts - CreateExchangeDataSchema definition
 * @see api/routes/exchange/index.ts - Used in POST exchange endpoint validation
 */
export type CreateExchangeData = z.infer<typeof CreateExchangeDataSchema>;

/**
 * Input data for updating existing exchange records.
 * Contains validated exchange data for update operations.
 * Used as request body when updating exchanges via API.
 * @see schema/exchange.ts - UpdateExchangeDataSchema definition
 * @see api/routes/exchange/index.ts - Used in PATCH exchange endpoint validation
 */
export type UpdateExchangeData = z.infer<typeof UpdateExchangeDataSchema>;

/**
 * Filters for querying exchange data.
 * Contains search and filter parameters for exchange data retrieval.
 * Used for filtering and searching exchange records.
 * @see schema/exchange.ts - ExchangeFiltersSchema definition
 * @see api/routes/exchange/index.ts - Used in GET exchange endpoint query parameters
 */
export type ExchangeFilters = z.infer<typeof ExchangeFiltersSchema>;

// Email Data Types - inferred from Zod schemas (single source of truth)

/**
 * Raw email data as received from email providers.
 * Contains unprocessed email information including headers and metadata.
 * Used for initial email data processing and parsing.
 * @see schema/exchange.ts - RawEmailDataSchema definition
 * @see services/exchange/parsing/index.ts - Used in email parsing services
 */
export type RawEmailData = z.infer<typeof RawEmailDataSchema>;

/**
 * Processed email data after parsing and validation.
 * Contains cleaned and structured email information.
 * Used for storing and displaying email content.
 * @see schema/exchange.ts - EmailDataSchema definition
 * @see services/exchange/processing.ts - Used in email processing
 * @see components/dashboard/InboxSection.tsx - Used in UI components
 */
export type EmailData = z.infer<typeof EmailDataSchema>;

/**
 * Partial raw email data for incremental updates.
 * Contains optional fields for updating raw email information.
 * Used when updating email data incrementally.
 * @see schema/exchange.ts - PartialRawEmailDataSchema definition
 * @see services/exchange/parsing/index.ts - Used in partial email updates
 */
export type PartialRawEmailData = z.infer<typeof PartialRawEmailDataSchema>;

/**
 * Partial email data for incremental updates.
 * Contains optional fields for updating processed email information.
 * Used when updating email data incrementally.
 * @see schema/exchange.ts - PartialEmailDataSchema definition
 * @see services/exchange/processing.ts - Used in partial email updates
 */
export type PartialEmailData = z.infer<typeof PartialEmailDataSchema>;

/**
 * Partial exchange data for incremental updates.
 * Contains optional fields for updating exchange records.
 * Used when updating exchange data incrementally.
 * @see schema/exchange.ts - PartialExchangeDataSchema definition
 * @see services/exchange/index.ts - Used in partial exchange updates
 */
export type PartialExchangeData = z.infer<typeof PartialExchangeDataSchema>;

// Service Result Types - inferred from Zod schemas

/**
 * Generic service result wrapper for API responses.
 * Provides consistent error handling and success/failure status.
 * Used across all exchange service operations for standardized responses.
 * @see schema/exchange.ts - ServiceResultSchema definition
 * @see services/exchange/index.ts - Used in exchange service responses
 */
export type ServiceResult<T> = z.infer<ReturnType<typeof ServiceResultSchema<z.ZodType<T>>>>;

/**
 * Result of exchange data retrieval operation.
 * Contains exchange data or error information.
 * Used when fetching exchange records from the API.
 * @see schema/exchange.ts - GetExchangeDataResultSchema definition
 * @see api/routes/exchange/index.ts - Used in GET exchange endpoint
 */
export type GetExchangeDataResult = z.infer<typeof GetExchangeDataResultSchema>;

/**
 * Result of creating exchange data operation.
 * Contains the created exchange data or error information.
 * Used when creating new exchange records via API.
 * @see schema/exchange.ts - CreateExchangeDataResultSchema definition
 * @see api/routes/exchange/index.ts - Used in POST exchange endpoint
 */
export type CreateExchangeDataResult = z.infer<typeof CreateExchangeDataResultSchema>;

/**
 * Result of updating exchange data operation.
 * Contains the updated exchange data or error information.
 * Used when modifying exchange records via API.
 * @see schema/exchange.ts - UpdateExchangeDataResultSchema definition
 * @see api/routes/exchange/index.ts - Used in PATCH exchange endpoint
 */
export type UpdateExchangeDataResult = z.infer<typeof UpdateExchangeDataResultSchema>;

/**
 * Result of deleting exchange data operation.
 * Contains success confirmation or error information.
 * Used when removing exchange records via API.
 * @see schema/exchange.ts - DeleteExchangeDataResultSchema definition
 * @see api/routes/exchange/index.ts - Used in DELETE exchange endpoint
 */
export type DeleteExchangeDataResult = z.infer<typeof DeleteExchangeDataResultSchema>;
