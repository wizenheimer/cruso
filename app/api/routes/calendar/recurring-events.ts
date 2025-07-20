import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
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
    handleUpdateRecurringEventInstance,
    handleUpdateFutureRecurringEvents,
    handleDeleteRecurringEventInstance,
    handleBatchCreateRecurringEventsInPrimaryCalendar,
    handleListRecurringEventInstances,
    handleUpdateRecurringEventInstanceInPrimaryCalendar,
    handleUpdateFutureRecurringEventsInPrimaryCalendar,
    handleDeleteRecurringEventInstanceInPrimaryCalendar,
    handleListRecurringEventInstancesInPrimaryCalendar,
} from '@/app/api/handlers/calendar';

const recurringEvents = new Hono();

/**
 * Apply auth middleware to all recurring event routes
 */
recurringEvents.use('*', requireAuth);

// ==================================================
// Batch Recurring Events Routes - Primary Calendar
// ==================================================

/**
 * POST /api/v1/calendar/recurring-events/batch
 */
recurringEvents.post('/batch', handleBatchCreateRecurringEventsInPrimaryCalendar);

// ==================================================
// Recurring Event Instance Routes - Primary Calendar
// Routes for managing specific instances of recurring events
// These must come BEFORE specific calendar routes to avoid conflicts
// ==================================================

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId/instances
 */
recurringEvents.patch('/:eventId/instances', handleUpdateRecurringEventInstanceInPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId/future
 */
recurringEvents.patch('/:eventId/future', handleUpdateFutureRecurringEventsInPrimaryCalendar);

/**
 * DELETE /api/v1/calendar/recurring-events/:eventId/instances
 */
recurringEvents.delete('/:eventId/instances', handleDeleteRecurringEventInstanceInPrimaryCalendar);

/**
 * GET /api/v1/calendar/recurring-events/:eventId/instances
 */
recurringEvents.get('/:eventId/instances', handleListRecurringEventInstancesInPrimaryCalendar);

// ==================================================
// Recurring Event Routes - Primary Calendar
// Routes for managing recurring events in the primary calendar
// ==================================================

/**
 * POST /api/v1/calendar/recurring-events
 */
recurringEvents.post('/', handleCreateRecurringEventInPrimaryCalendar);

/**
 * GET /api/v1/calendar/recurring-events/:eventId
 */
recurringEvents.get('/:eventId', handleGetRecurringEventFromPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId/reschedule
 */
recurringEvents.patch('/:eventId/reschedule', handleRescheduleRecurringEventInPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/recurring-events/:eventId
 */
recurringEvents.patch('/:eventId', handleUpdateRecurringEventInPrimaryCalendar);

/**
 * DELETE /api/v1/calendar/recurring-events/:eventId
 */
recurringEvents.delete('/:eventId', handleDeleteRecurringEventFromPrimaryCalendar);

// ==================================================
// Recurring Event Instance Routes - Specific Calendar
// Routes for managing specific instances of recurring events in specific calendars
// ==================================================

/**
 * PATCH /api/v1/calendar/recurring-events/:calendarId/:eventId/instances
 */
recurringEvents.patch('/:calendarId/:eventId/instances', handleUpdateRecurringEventInstance);

/**
 * PATCH /api/v1/calendar/recurring-events/:calendarId/:eventId/future
 */
recurringEvents.patch('/:calendarId/:eventId/future', handleUpdateFutureRecurringEvents);

/**
 * DELETE /api/v1/calendar/recurring-events/:calendarId/:eventId/instances
 */
recurringEvents.delete('/:calendarId/:eventId/instances', handleDeleteRecurringEventInstance);

/**
 * GET /api/v1/calendar/recurring-events/:calendarId/:eventId/instances
 */
recurringEvents.get('/:calendarId/:eventId/instances', handleListRecurringEventInstances);

// ==================================================
// Recurring Event Routes - Specific Calendar
// Routes for managing recurring events in a specific calendar
// ==================================================

/**
 * POST /api/v1/calendar/recurring-events/:calendarId
 */
recurringEvents.post('/:calendarId', handleCreateRecurringEvent);

/**
 * GET /api/v1/calendar/recurring-events/:calendarId/:eventId
 */
recurringEvents.get('/:calendarId/:eventId', handleGetRecurringEvent);

/**
 * PATCH /api/v1/calendar/recurring-events/:calendarId/:eventId/reschedule
 */
recurringEvents.patch('/:calendarId/:eventId/reschedule', handleRescheduleRecurringEvent);

/**
 * PATCH /api/v1/calendar/recurring-events/:calendarId/:eventId
 */
recurringEvents.patch('/:calendarId/:eventId', handleUpdateRecurringEvent);

/**
 * DELETE /api/v1/calendar/recurring-events/:calendarId/:eventId
 */
recurringEvents.delete('/:calendarId/:eventId', handleDeleteRecurringEvent);

export default recurringEvents;
