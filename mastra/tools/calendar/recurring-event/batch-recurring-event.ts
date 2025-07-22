import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import type { CalendarEvent, RecurrenceRule } from '@/types/services';
import {
    batchRecurringEventInputSchema,
    batchRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

export const batchRecurringEventTool = createTool({
    id: 'batch-recurring-event',
    description: 'Batch create recurring events in google calendar for the current user',
    inputSchema: batchRecurringEventInputSchema,
    outputSchema: batchRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { events, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        const calendarService = new GoogleCalendarService(user.id);

        // Convert input events to CalendarEvent format with recurrence
        const calendarEvents: Array<CalendarEvent & { recurrence?: RecurrenceRule[] }> = events.map(
            (event) => ({
                summary: event.title,
                description: event.description,
                start: event.allDay ? { date: event.start } : { dateTime: event.start },
                end: event.allDay ? { date: event.end } : { dateTime: event.end },
                location: event.location,
                attendees: event.attendees?.map((email) => ({ email })),
                recurrence: event.recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                })),
                // Add conference data if requested
                ...(event.conferenceData && {
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}-${Math.random()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                }),
            }),
        );

        const results = await calendarService.batchCreateRecurringEventsInPrimaryCalendar(
            calendarEvents,
            options,
        );

        // Transform results to match output schema
        return {
            successful: results.successful.map(({ event, result }) => {
                // Type assertion for event and result
                const typedEvent = event as CalendarEvent & { recurrence?: RecurrenceRule[] };
                const typedResult = result as CalendarEvent & { calendarId?: string };

                return {
                    event: {
                        title: typedEvent.summary || '',
                        start: (typedEvent.start?.dateTime ||
                            typedEvent.start?.date ||
                            '') as string,
                        end: (typedEvent.end?.dateTime || typedEvent.end?.date || '') as string,
                        location: typedEvent.location,
                        description: typedEvent.description,
                        attendees: typedEvent.attendees?.map((a: { email: string }) => a.email),
                        recurrence: Array.isArray(typedEvent.recurrence)
                            ? typedEvent.recurrence
                                  .filter(
                                      (rule): rule is RecurrenceRule => typeof rule === 'object',
                                  )
                                  .map((rule) => ({
                                      ...rule,
                                      dtstart: rule.dtstart?.toISOString(),
                                      until: rule.until?.toISOString(),
                                  }))
                            : [],
                    },
                    result: {
                        eventId: typedResult.id || '',
                        eventTitle: typedResult.summary || '',
                        eventStart: (typedResult.start?.dateTime ||
                            typedResult.start?.date ||
                            '') as string,
                        eventEnd: (typedResult.end?.dateTime ||
                            typedResult.end?.date ||
                            '') as string,
                        eventLocation: typedResult.location,
                        eventDescription: typedResult.description,
                        eventAttendees: typedResult.attendees?.map(
                            (a: { email: string }) => a.email,
                        ),
                        eventRecurrence: Array.isArray(typedResult.recurrence)
                            ? typedResult.recurrence
                                  .filter(
                                      (rule): rule is RecurrenceRule => typeof rule === 'object',
                                  )
                                  .map((rule) => ({
                                      ...rule,
                                      dtstart: rule.dtstart?.toISOString(),
                                      until: rule.until?.toISOString(),
                                  }))
                            : [],
                        calendarId: (typedResult as any).calendarId || '',
                    },
                };
            }),
            failed: results.failed.map(({ event, error }) => {
                // Type assertion for event
                const typedEvent = event as CalendarEvent & { recurrence?: RecurrenceRule[] };

                return {
                    event: {
                        title: typedEvent.summary || '',
                        start: (typedEvent.start?.dateTime ||
                            typedEvent.start?.date ||
                            '') as string,
                        end: (typedEvent.end?.dateTime || typedEvent.end?.date || '') as string,
                        location: typedEvent.location,
                        description: typedEvent.description,
                        attendees: typedEvent.attendees?.map((a: { email: string }) => a.email),
                        recurrence: Array.isArray(typedEvent.recurrence)
                            ? typedEvent.recurrence
                                  .filter(
                                      (rule): rule is RecurrenceRule => typeof rule === 'object',
                                  )
                                  .map((rule) => ({
                                      ...rule,
                                      dtstart: rule.dtstart?.toISOString(),
                                      until: rule.until?.toISOString(),
                                  }))
                            : [],
                    },
                    error: typeof error === 'string' ? error : 'Unknown error',
                };
            }),
        };
    },
});
