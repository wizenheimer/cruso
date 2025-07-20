import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handlePerformBatchOperationsOnPrimaryCalendar,
    handleCreateEventInPrimaryCalendar,
    handleUpdateEventInPrimaryCalendar,
    handleDeleteEventFromPrimaryCalendar,
    handleGetEventsFromPrimaryCalendar,
    handleGetEventFromPrimaryCalendar,
    handleRescheduleEventInPrimaryCalendar,
    handleGetEvents,
    handleGetEvent,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleFindEventsByICalUID,
} from '@/app/api/handlers/calendar';

const events = new Hono();

/**
 * Apply auth middleware to all event routes
 */
events.use('*', requireAuth);

// ==================================================
// Batch Operations Routes - Primary Calendar
// ==================================================

/**
 * POST /api/v1/calendar/events/batch
 */
events.post('/batch', handlePerformBatchOperationsOnPrimaryCalendar);

// ==================================================
// Event Routes - Primary Calendar
// Collective routes for managing events in the primary calendar
// ==================================================

/**
 * POST /api/v1/calendar/events
 */
events.post('/', handleCreateEventInPrimaryCalendar);

/**
 * GET /api/v1/calendar/events
 */
events.get('/', handleGetEventsFromPrimaryCalendar);

/**
 * GET /api/v1/calendar/events/:eventId
 */
events.get('/:eventId', handleGetEventFromPrimaryCalendar);

/**
 * GET /api/v1/calendar/events/search/icaluid
 */
events.get('/search/icaluid', handleFindEventsByICalUID);

// ==================================================
// Event Routes - Primary Calendar
// Individual routes for managing events in the primary calendar
// ==================================================

/**
 * PUT /api/v1/calendar/events/:id
 */
events.put('/:eventId', handleUpdateEventInPrimaryCalendar);

/**
 * PATCH /api/v1/calendar/events/:id
 */
events.patch('/:eventId', handleRescheduleEventInPrimaryCalendar);

/**
 * DELETE /api/v1/calendar/events/:id
 */
events.delete('/:eventId', handleDeleteEventFromPrimaryCalendar);

// ==================================================
// Event Routes - Specific Calendar
// Routes for managing events in a specific calendar using /calendar/:calendarId
// ==================================================

/**
 * GET /api/v1/calendar/:calendarId/events
 */
events.get('/:calendarId', handleGetEvents);

/**
 * GET /api/v1/calendar/:calendarId/events/:eventId
 */
events.get('/:calendarId/:eventId', handleGetEvent);

/**
 * POST /api/v1/calendar/:calendarId/events
 */
events.post('/:calendarId', handleCreateEvent);

/**
 * PATCH /api/v1/calendar/:calendarId/events/:eventId
 */
events.patch('/:calendarId/:eventId', handleUpdateEvent);

/**
 * DELETE /api/v1/calendar/:calendarId/events/:eventId
 */
events.delete('/:calendarId/:eventId', handleDeleteEvent);

export default events;
