// ==================================================
// Recurring Event Tools
// ==================================================
import { batchRecurringEventTool } from './batch-recurring-event';
import { createRecurringEventTool } from './create-recurring-event';
import { deleteRecurringEventTool } from './delete-recurring-event';
import { deleteRecurringEventInstanceTool } from './delete-recurring-event-instance';
import { getRecurringEventTool } from './get-recurring-event';
import { getRecurringEventInstancesTool } from './get-recurring-event-instance';
import { rescheduleRecurringEventTool } from './reschedule-recurring-event';
import { updateRecurringEventInstanceTool } from './update-recurring-event-instance';
import { updateFutureRecurringEventsTool } from './update-recurring-event-future';
import { updateRecurringEventTool } from './update-recurring-event';

// ==================================================
// Recurring Event Tools
// ==================================================
export const recurringEventTools = {
    batchRecurringEventTool,
    createRecurringEventTool,
    deleteRecurringEventTool,
    updateRecurringEventTool,
    deleteRecurringEventInstanceTool,
    getRecurringEventTool,
    getRecurringEventInstancesTool,
    rescheduleRecurringEventTool,
    updateRecurringEventInstanceTool,
    updateFutureRecurringEventsTool,
};
