// ==================================================
// Non-Recurring Event Tools
// ==================================================
import { performBatchEventTool } from './batch-event';
import { createEventTool } from './create-event';
import { deleteEventTool } from './delete-event';
import { getEventTool } from './get-event';
import { listEventsTool } from './list-event';
import { updateEventTool } from './update-event';
import { rescheduleEventTool } from './reschedule-event';

// ==================================================
// Non-Recurring Event Tools
// ==================================================
export const eventTools = {
    performBatchEventTool,
    createEventTool,
    deleteEventTool,
    getEventTool,
    listEventsTool,
    updateEventTool,
    rescheduleEventTool,
};
