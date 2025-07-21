import { ExchangeService } from './exchange';

// Create and export a singleton instance
export const exchangeService = ExchangeService.getInstance();

// Also export the class for cases where direct access is needed
export { ExchangeService };
