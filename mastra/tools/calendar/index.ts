import { availabilityTools } from './availability';
import { eventTools } from './event';
import { searchTools } from './search';

// ==================================================
// All Calendar Tools
// ==================================================
export const calendarTools = {
    ...availabilityTools, // Availability Tools
    ...eventTools, // Event Tools
    ...searchTools, // Search Tools
};
