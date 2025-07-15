/**
 * Language models
 */

/**
 * GPT-4o
 * Input $2.50 / 1M tokens
 * Cached $1.25 / 1M tokens
 * Output $10.00 / 1M tokens
 * Context Window 128,000 tokens (128k)
 * Output Window 16,384 tokens (16k)
 */
export const XLARGE_LANGUAGE_MODEL = 'gpt-4o';

/**
 * GPT-4o mini
 * Input $0.15 / 1M tokens
 * Cached $0.075 / 1M tokens
 * Output $0.60 / 1M tokens
 * Context Window 128,000 tokens (128k)
 * Output Window 16,384 tokens (16k)
 */
export const LARGE_LANGUAGE_MODEL = 'gpt-4o-mini';

/**
 * GPT-4.1 nano
 * Input $0.10 / 1M tokens
 * Cached $0.025 / 1M tokens
 * Output $0.40 / 1M tokens
 * Context Window 1,047,576 tokens (~1M)
 * Output Window 32,768 tokens (32k)
 */
export const SMALL_LANGUAGE_MODEL = 'gpt-4.1-nano';

/**
 * o3
 * Input $2.00 / 1M tokens
 * Cached $0.50 / 1M tokens
 * Output $8.00 / 1M tokens
 * Context Window 200,000 tokens (200k)
 * Output Window 100,000 tokens (100k)
 */
export const XLARGE_REASONING_MODEL = 'o3';

/**
 * o4-mini
 * Input $1.10 / 1M tokens
 * Cached $0.275 / 1M tokens
 * Output $4.40 / 1M tokens
 * Context Window 200,000 tokens (200k)
 * Output Window 100,000 tokens (100k)
 */
export const LARGE_REASONING_MODEL = 'o4-mini';

/**
 * o3-mini
 * Input $1.10 / 1M tokens
 * Cached $0.55 / 1M tokens
 * Output $4.40 / 1M tokens
 * Context Window 200,000 tokens (200k)
 * Output Window 100,000 tokens (100k)
 */
export const LARGE_REASONING_MODEL_V2 = 'o3-mini';

// ================================
// Default models
// ================================

/**
 * Default small language model
 */
export const DEFAULT_SMALL_LANGUAGE_MODEL = SMALL_LANGUAGE_MODEL;

/**
 * Default large language model
 */
export const DEFAULT_LARGE_LANGUAGE_MODEL = LARGE_LANGUAGE_MODEL;

/**
 * Default xlarge language model
 */
export const DEFAULT_XLARGE_LANGUAGE_MODEL = LARGE_REASONING_MODEL;
