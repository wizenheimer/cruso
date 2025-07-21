import { availabilityTools } from './availability';
import { nonRecurringEventTools } from './non-recurring-event';
import { recurringEventTools } from './recurring-event';
import { searchTools } from './search';

// ==================================================
// All Calendar Tools
// ==================================================
export const calendarTools = {
    ...availabilityTools, // Availability Tools
    ...nonRecurringEventTools, // Non-Recurring Event Tools
    ...recurringEventTools, // Recurring Event Tools
    ...searchTools, // Search Tools
};
