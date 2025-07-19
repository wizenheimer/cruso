import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCalendarConnections,
    handleGetCalendarAccounts,
    handleSyncCalendar,
    handleUpdateCalendarConnection,
    handleDeleteCalendarAccount,
    handleCheckAvailability,
    handleSyncAllCalendars,
    handleBlockAvailability,
    handlePerformBatchOperationsOnPrimaryCalendar,
    handleCreateEventInPrimaryCalendar,
    handleUpdateEventInPrimaryCalendar,
    handleDeleteEventFromPrimaryCalendar,
    handleGetEventsFromPrimaryCalendar,
    handleGetEvents,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleRescheduleEventInPrimaryCalendar,
    handleCreateRecurringEventInPrimaryCalendar,
    handleCreateRecurringEvent,
    handleUpdateRecurringEventInPrimaryCalendar,
    handleUpdateRecurringEvent,
    handleDeleteRecurringEventFromPrimaryCalendar,
    handleDeleteRecurringEvent,
    handleGetRecurringEventFromPrimaryCalendar,
    handleGetRecurringEvent,
    handleRescheduleRecurringEventInPrimaryCalendar,
    handleRescheduleRecurringEvent,
} from '@/app/api/handlers/calendar';

const calendar = new Hono();

/**
 * Apply auth middleware to all calendar routes
 */
calendar.use('*', requireAuth);

/**
 * GET /api/v1/calendar - Fetch user's calendar connections
 */
calendar.get('/', handleGetCalendarConnections);

/**
 * GET /api/v1/calendar/accounts
 */
calendar.get('/accounts', handleGetCalendarAccounts);

// ==================================================
// Availability Routes - Check and Block Availability
// ==================================================

/**
 * POST /api/v1/calendar/availability
 */
calendar.post('/availability', handleCheckAvailability);

/**
 * PATCH /api/v1/calendar/availability
 */
calendar.patch('/availability', handleBlockAvailability);

// ==================================================
// Batch Operations Routes - Primary Calendar
// ==================================================

/**
 * POST /api/v1/calendar/events/batch
 */
calendar.post('/events/batch', handlePerformBatchOperationsOnPrimaryCalendar);

// ==================================================
// Event Routes - Primary Calendar
// Collective routes for managing events in the primary calendar
// ==================================================

/**
 * POST /api/v1/calendar/events
 */
calendar.post('/events', handleCreateEventInPrimaryCalendar);

/**
 * GET /api/v1/calendar/events
 */
calendar.get('/events', handleGetEventsFromPrimaryCalendar);

// ==================================================
// Event Routes - Primary Calendar
// Individual routes for managing events in the primary calendar
// ==================================================

/**
 * PUT /api/v1/calendar/events/:id
 */
calendar.put('/events/:eventId', handleUpdateEventInPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/events/:id
 */
calendar.patch('/events/:eventId', handleRescheduleEventInPrimaryCalendar);

/**
 * DELETE /api/v1/calendar/events/:id
 */
calendar.delete('/events/:eventId', handleDeleteEventFromPrimaryCalendar);

// ==================================================
// Event Routes - Specific Calendar
// Routes for managing events in a specific calendar using /calendar/:calendarId
// ==================================================

/**
 * GET /api/v1/calendar/:calendarId/events
 */
calendar.get('/:calendarId/events', handleGetEvents);

/**
 * POST /api/v1/calendar/:calendarId/events
 */
calendar.post('/:calendarId/events', handleCreateEvent);

/**
 * PATCH /api/v1/calendar/:calendarId/events/:eventId
 */
calendar.patch('/:calendarId/events/:eventId', handleUpdateEvent);

/**
 * DELETE /api/v1/calendar/:calendarId/events/:eventId
 */
calendar.delete('/:calendarId/events/:eventId', handleDeleteEvent);

// ==================================================
// Recurring Event Routes - Primary Calendar
// Routes for managing recurring events in the primary calendar
// ==================================================

/**
 * POST /api/v1/calendar/recurring-events
 */
calendar.post('/recurring-events', handleCreateRecurringEventInPrimaryCalendar);

/**
 * GET /api/v1/calendar/recurring-events/:eventId
 */
calendar.get('/recurring-events/:eventId', handleGetRecurringEventFromPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId/reschedule
 */
calendar.patch(
    '/recurring-events/:eventId/reschedule',
    handleRescheduleRecurringEventInPrimaryCalendar,
);

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId
 */
calendar.patch('/recurring-events/:eventId', handleUpdateRecurringEventInPrimaryCalendar);

/**
 * DELETE /api/v1/calendar/recurring-events/:eventId
 */
calendar.delete('/recurring-events/:eventId', handleDeleteRecurringEventFromPrimaryCalendar);

// ==================================================
// Recurring Event Routes - Specific Calendar
// Routes for managing recurring events in a specific calendar
// ==================================================

/**
 * POST /api/v1/calendar/:calendarId/recurring-events
 */
calendar.post('/:calendarId/recurring-events', handleCreateRecurringEvent);

/**
 * GET /api/v1/calendar/:calendarId/recurring-events/:eventId
 */
calendar.get('/:calendarId/recurring-events/:eventId', handleGetRecurringEvent);

/**
 * PATCH /api/v1/calendar/:calendarId/recurring-events/:eventId/reschedule
 */
calendar.patch('/:calendarId/recurring-events/:eventId/reschedule', handleRescheduleRecurringEvent);

/**
 * PATCH /api/v1/calendar/:calendarId/recurring-events/:eventId
 */
calendar.patch('/:calendarId/recurring-events/:eventId', handleUpdateRecurringEvent);

/**
 * DELETE /api/v1/calendar/:calendarId/recurring-events/:eventId
 */
calendar.delete('/:calendarId/recurring-events/:eventId', handleDeleteRecurringEvent);

// ==================================================

/**
 * POST /api/v1/calendar/sync-all
 */
calendar.post('/sync-all', handleSyncAllCalendars);

/**
 * POST /api/v1/calendar/:id/sync
 */
calendar.post('/:id/sync', handleSyncCalendar);

/**
 * PATCH /api/v1/calendar/:id
 */
calendar.patch('/:id', handleUpdateCalendarConnection);

/**
 * DELETE /api/v1/calendar
 */
calendar.delete('/', handleDeleteCalendarAccount);

export default calendar;
