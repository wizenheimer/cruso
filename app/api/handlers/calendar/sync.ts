import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { getUser } from './connections';

/**
 * Handle the POST request to refresh all calendars
 * @param c - The context object
 * @returns The response object
 */
export async function handleRefreshCalendars(c: Context) {
    try {
        const user = getUser(c);
        console.log('Manual refresh requested for user');

        // Use the calendar service to handle token refresh and syncing
        const calendarService = createCalendarService(user.id);

        // Use the new method to fetch all calendar lists
        const result = await calendarService.refreshCalendars();

        console.log(`Finished manual refresh. Total calendars synced: ${result.calendarsSynced}`);

        if (result.errors.length > 0) {
            console.warn('Some errors occurred during sync:', result.errors);
        }

        return c.json({
            success: true,
            accountsSynced: result.accountsSynced,
            calendarsSynced: result.calendarsSynced,
            errors: result.errors,
        });
    } catch (error) {
        console.error('Error in manual sync:', error);
        return c.json({ error: 'Failed to sync calendars' }, 500);
    }
}
