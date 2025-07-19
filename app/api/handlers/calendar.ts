import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { updatePrimaryAccount } from '@/db/queries/preferences';

/**
 * Extract the authenticated user from the request context
 * @param requestContext - The Hono context object containing request data
 * @returns The authenticated user object
 * @throws Error if user is not found in context
 */
export const getUser = (requestContext: Context) => {
    const authenticatedUser = requestContext.get('user');
    if (!authenticatedUser) {
        throw new Error('User not found in context');
    }
    return authenticatedUser;
};
/**
 * Handle the GET request to fetch calendar connections
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with calendar connections or error message
 */
export async function handleGetCalendarConnections(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const userCalendarConnections = await db
            .select({
                id: calendarConnections.id,
                accountId: calendarConnections.accountId,
                googleAccountId: calendarConnections.googleAccountId,
                googleEmail: calendarConnections.googleEmail,
                calendarName: calendarConnections.calendarName,
                calendarId: calendarConnections.calendarId,
                isPrimary: calendarConnections.isPrimary,
                includeInAvailability: calendarConnections.includeInAvailability,
                isActive: calendarConnections.isActive,
                lastSyncAt: calendarConnections.lastSyncAt,
                syncStatus: calendarConnections.syncStatus,
                errorMessage: calendarConnections.errorMessage,
                createdAt: calendarConnections.createdAt,
            })
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, authenticatedUser.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .orderBy(calendarConnections.isPrimary, calendarConnections.createdAt);

        return requestContext.json(userCalendarConnections);
    } catch (fetchCalendarConnectionsError) {
        console.error('Error fetching calendar connections:', fetchCalendarConnectionsError);
        return requestContext.json({ error: 'Failed to fetch calendar connections' }, 500);
    }
}

/**
 * Handle the GET request to fetch calendar accounts
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with calendar accounts and their calendars or error message
 */
export async function handleGetCalendarAccounts(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        // Get all Google accounts for the user with their calendars
        const userGoogleAccounts = await db
            .select({
                accountId: account.id,
                googleAccountId: account.accountId,
                scope: account.scope,
                createdAt: account.createdAt,
            })
            .from(account)
            .where(and(eq(account.userId, authenticatedUser.id), eq(account.providerId, 'google')));

        // Get calendar counts for each account
        const googleAccountsWithCalendars = await Promise.all(
            userGoogleAccounts.map(async (googleAccountData) => {
                const accountCalendars = await db
                    .select()
                    .from(calendarConnections)
                    .where(
                        and(
                            eq(calendarConnections.accountId, googleAccountData.accountId),
                            eq(calendarConnections.isActive, true),
                        ),
                    );

                // Get email from first calendar connection if available
                const accountEmail =
                    accountCalendars.length > 0
                        ? accountCalendars[0].googleEmail
                        : googleAccountData.googleAccountId;

                return {
                    accountId: googleAccountData.accountId,
                    googleAccountId: googleAccountData.googleAccountId,
                    email: accountEmail,
                    calendarCount: accountCalendars.length,
                    calendars: accountCalendars.map((calendarConnection) => ({
                        id: calendarConnection.id,
                        calendarId: calendarConnection.calendarId,
                        name: calendarConnection.calendarName,
                        isPrimary: calendarConnection.isPrimary,
                        includeInAvailability: calendarConnection.includeInAvailability,
                        syncStatus: calendarConnection.syncStatus,
                    })),
                };
            }),
        );

        return requestContext.json(googleAccountsWithCalendars);
    } catch (fetchCalendarAccountsError) {
        console.error('Error fetching Google accounts:', fetchCalendarAccountsError);
        return requestContext.json({ error: 'Failed to fetch Google accounts' }, 500);
    }
}

/**
 * Handle the POST request to sync a calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleSyncCalendar(c: Context) {
    try {
        const connectionId = c.req.param('id');
        const user = getUser(c);

        // Get the connection with its account
        const connectionData = await db
            .select({
                connection: calendarConnections,
                accountData: account,
            })
            .from(calendarConnections)
            .leftJoin(account, eq(calendarConnections.accountId, account.id))
            .where(
                and(
                    eq(calendarConnections.id, connectionId),
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (connectionData.length === 0) {
            return c.json({ error: 'Connection not found' }, 404);
        }

        const { accountData } = connectionData[0];

        if (!accountData) {
            return c.json({ error: 'Account not found' }, 404);
        }

        try {
            // Use the calendar service to handle token refresh and syncing
            const calendarService = createCalendarService(user.id);

            // Sync all calendars using the service (which handles individual calendar updates)
            const result = await calendarService.syncAllCalendars();

            // Check if the specific calendar was synced successfully
            const syncedCalendar = result.success > 0;

            if (syncedCalendar) {
                return c.json({ success: true, syncedCalendars: result.success });
            } else {
                return c.json(
                    {
                        error: 'Failed to sync calendar',
                        details: result.errors,
                    },
                    500,
                );
            }
        } catch (syncError) {
            // Update error status
            await db
                .update(calendarConnections)
                .set({
                    syncStatus: 'error',
                    errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error',
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(calendarConnections.id, connectionId),
                        eq(calendarConnections.isActive, true),
                    ),
                );

            return c.json({ error: 'Failed to sync calendar' }, 500);
        }
    } catch (error) {
        console.error('Error syncing calendar:', error);
        return c.json({ error: 'Failed to sync calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update a calendar connection
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response confirming update or error message
 */
export async function handleUpdateCalendarConnection(requestContext: Context) {
    try {
        const targetConnectionId = requestContext.req.param('id');
        const authenticatedUser = getUser(requestContext);
        const connectionUpdatePayload = await requestContext.req.json();

        // Validate that the connection belongs to the user
        const existingConnection = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.id, targetConnectionId),
                    eq(calendarConnections.userId, authenticatedUser.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (existingConnection.length === 0) {
            return requestContext.json({ error: 'Connection not found' }, 404);
        }

        // If setting as primary, unset other primary calendars first
        if (connectionUpdatePayload.isPrimary === true) {
            await db
                .update(calendarConnections)
                .set({ isPrimary: false, updatedAt: new Date() })
                .where(
                    and(
                        eq(calendarConnections.userId, authenticatedUser.id),
                        eq(calendarConnections.isActive, true),
                    ),
                );
        }

        // Update the connection
        await db
            .update(calendarConnections)
            .set({
                ...connectionUpdatePayload,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(calendarConnections.id, targetConnectionId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        // If setting as primary, update preferences to reference this account
        if (connectionUpdatePayload.isPrimary === true) {
            try {
                const updatedCalendarConnection = await db
                    .select({ accountId: calendarConnections.accountId })
                    .from(calendarConnections)
                    .where(eq(calendarConnections.id, targetConnectionId))
                    .limit(1);

                if (updatedCalendarConnection.length > 0) {
                    await updatePrimaryAccount(
                        authenticatedUser.id,
                        updatedCalendarConnection[0].accountId,
                    );
                }
            } catch (updatePrimaryAccountError) {
                console.error(
                    'Error updating preferences primary account:',
                    updatePrimaryAccountError,
                );
                // Don't fail the request if preferences update fails
            }
        }

        return requestContext.json({ success: true });
    } catch (updateCalendarConnectionError) {
        console.error('Error updating calendar connection:', updateCalendarConnectionError);
        return requestContext.json({ error: 'Failed to update calendar connection' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a calendar account and all its connections
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response confirming deletion or error message
 */
export async function handleDeleteCalendarAccount(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const deleteAccountPayload = await requestContext.req.json();
        const { accountId: targetAccountId } = deleteAccountPayload;

        if (!targetAccountId) {
            return requestContext.json({ error: 'accountId is required' }, 400);
        }

        // Validate that the account belongs to the user
        const targetAccountData = await db
            .select()
            .from(account)
            .where(and(eq(account.id, targetAccountId), eq(account.userId, authenticatedUser.id)))
            .limit(1);

        if (targetAccountData.length === 0) {
            return requestContext.json({ error: 'Account not found' }, 404);
        }

        // Check if this is the only account - prevent deletion if so
        const userGoogleAccountsCount = await db
            .select()
            .from(account)
            .where(and(eq(account.userId, authenticatedUser.id), eq(account.providerId, 'google')));

        if (userGoogleAccountsCount.length === 1) {
            return requestContext.json(
                {
                    error: 'Cannot delete the only calendar account. You must have at least one calendar account connected.',
                },
                400,
            );
        }

        // Soft delete all calendar connections for this account
        await db
            .update(calendarConnections)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(calendarConnections.accountId, targetAccountId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        // Delete the account
        await db.delete(account).where(eq(account.id, targetAccountId));

        return requestContext.json({ success: true });
    } catch (deleteCalendarAccountError) {
        console.error('Error deleting calendar account:', deleteCalendarAccountError);
        return requestContext.json({ error: 'Failed to delete calendar account' }, 500);
    }
}

/**
 * Handle the GET request to check availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleCheckAvailability(c: Context) {
    try {
        const user = getUser(c);
        const { startTime, endTime, timeDurationMinutes, responseTimezone } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const availabilityResult = await calendarService.checkAvailabilityBlock(
            startTime,
            endTime,
            {
                timeDurationMinutes: timeDurationMinutes,
                responseTimezone: responseTimezone,
            },
        );

        const allEvents = availabilityResult.events;

        // Sort events by start time
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Get the actual number of calendars checked
        const activeConnections = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.includeInAvailability, true),
                    eq(calendarConnections.isActive, true),
                ),
            );

        return c.json({
            availabilityResult: availabilityResult,
            calendarsChecked: activeConnections.length,
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        return c.json({ error: 'Failed to check availability' }, 500);
    }
}

/**
 * Handle the POST request to block availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleBlockAvailability(c: Context) {
    try {
        const user = getUser(c);
        const {
            startTime,
            endTime,
            timeDurationMinutes,
            eventSummary,
            eventDescription,
            eventAttendees,
            eventLocation,
            eventConference,
            eventPrivate,
        } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const createAvailabilityBlockResult = await calendarService.createAvailabilityBlock(
            startTime,
            endTime,
            {
                timeDurationMinutes: timeDurationMinutes,
                eventSummary: eventSummary,
                eventDescription: eventDescription,
                eventAttendees: eventAttendees,
                eventLocation: eventLocation,
                eventConference: eventConference,
                eventPrivate: eventPrivate,
            },
        );

        console.log('Availability blocked successfully', createAvailabilityBlockResult);

        return c.json({
            createAvailabilityBlockResult: createAvailabilityBlockResult,
        });
    } catch (error) {
        console.error('Error blocking availability:', error);
        return c.json({ error: 'Failed to block availability' }, 500);
    }
}

/**
 * Handle the POST request to sync all calendars
 * @param c - The context object
 * @returns The response object
 */
export async function handleSyncAllCalendars(c: Context) {
    try {
        const user = getUser(c);
        console.log('Manual sync requested for user:', user.id);

        // Use the calendar service to handle token refresh and syncing
        const calendarService = createCalendarService(user.id);

        // Use the new method to fetch all calendar lists
        const result = await calendarService.fetchAllCalendarLists();

        console.log(`Finished manual sync. Total calendars synced: ${result.calendarsSynced}`);

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

/**
 * Handle the GET request to fetch events from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetEventsFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const { timeMin, timeMax, maxResults, pageToken, q, showDeleted, singleEvents, orderBy } =
            query;

        if (!timeMin || !timeMax) {
            return c.json({ error: 'timeMin and timeMax are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getEventsFromPrimaryCalendar(timeMin, timeMax, {
            maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
            pageToken,
            q,
            showDeleted: showDeleted ? showDeleted === 'true' : undefined,
            singleEvents: singleEvents ? singleEvents === 'true' : undefined,
            orderBy: orderBy as 'startTime' | 'updated' | undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting events from primary calendar:', error);
        return c.json({ error: 'Failed to get events from primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to create an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { event, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!event || !event.summary || !event.start || !event.end) {
            return c.json({ error: 'Event with summary, start, and end is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createEventInPrimaryCalendar(event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating event in primary calendar:', error);
        return c.json({ error: 'Failed to create event in primary calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { event, sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!event) {
            return c.json({ error: 'Event data is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateEventInPrimaryCalendar(eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating event in primary calendar:', error);
        return c.json({ error: 'Failed to update event in primary calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete an event from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteEventFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.deleteEventFromPrimaryCalendar(eventId, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error deleting event from primary calendar:', error);
        return c.json({ error: 'Failed to delete event from primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to quick create an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleQuickCreateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const {
            summary,
            startDateTime,
            endDateTime,
            description,
            location,
            attendees,
            sendUpdates,
            conferenceDataVersion,
            createConference,
            colorId,
            reminders,
        } = await c.req.json();

        if (!summary || !startDateTime || !endDateTime) {
            return c.json({ error: 'summary, startDateTime, and endDateTime are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.quickCreateEventInPrimaryCalendar(
            summary,
            startDateTime,
            endDateTime,
            {
                description,
                location,
                attendees,
                sendUpdates,
                conferenceDataVersion,
                createConference,
                colorId,
                reminders,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error quick creating event in primary calendar:', error);
        return c.json({ error: 'Failed to quick create event in primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to perform batch operations on primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handlePerformBatchOperationsOnPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { operations, sendUpdates } = await c.req.json();

        if (!operations || !Array.isArray(operations) || operations.length === 0) {
            return c.json({ error: 'operations array is required and must not be empty' }, 400);
        }

        // Validate operations structure
        for (const operation of operations) {
            if (!operation.type || !['create', 'update', 'delete'].includes(operation.type)) {
                return c.json(
                    { error: 'Each operation must have a valid type (create, update, delete)' },
                    400,
                );
            }

            if (operation.type === 'create' && !operation.event) {
                return c.json({ error: 'Create operations require event data' }, 400);
            }

            if (operation.type === 'update' && (!operation.eventId || !operation.event)) {
                return c.json({ error: 'Update operations require eventId and event data' }, 400);
            }

            if (operation.type === 'delete' && !operation.eventId) {
                return c.json({ error: 'Delete operations require eventId' }, 400);
            }
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.performBatchOperationsOnPrimaryCalendar(operations, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error performing batch operations on primary calendar:', error);
        return c.json({ error: 'Failed to perform batch operations on primary calendar' }, 500);
    }
}

/**
 * Handle the GET request to fetch events from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetEvents(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const timeMin = c.req.query('timeMin');
        const timeMax = c.req.query('timeMax');
        const maxResults = c.req.query('maxResults');
        const pageToken = c.req.query('pageToken');
        const q = c.req.query('q');
        const showDeleted = c.req.query('showDeleted');
        const singleEvents = c.req.query('singleEvents');
        const orderBy = c.req.query('orderBy');

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!timeMin || !timeMax) {
            return c.json({ error: 'timeMin and timeMax are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getEvents(calendarId, timeMin, timeMax, {
            maxResults: maxResults ? parseInt(maxResults) : undefined,
            pageToken: pageToken || undefined,
            q: q || undefined,
            showDeleted: showDeleted ? showDeleted === 'true' : undefined,
            singleEvents: singleEvents ? singleEvents === 'true' : undefined,
            orderBy: orderBy as 'startTime' | 'updated' | undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting events from calendar:', error);
        return c.json({ error: 'Failed to get events from calendar' }, 500);
    }
}

/**
 * Handle the POST request to create an event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const { event, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!event || !event.summary || !event.start || !event.end) {
            return c.json({ error: 'Event with summary, start, and end is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createEvent(calendarId, event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating event in calendar:', error);
        return c.json({ error: 'Failed to create event in calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update an event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { event, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!event) {
            return c.json({ error: 'Event data is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateEvent(calendarId, eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating event in calendar:', error);
        return c.json({ error: 'Failed to update event in calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete an event from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        await calendarService.deleteEvent(calendarId, eventId, {
            sendUpdates,
        });

        return c.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event from calendar:', error);
        return c.json({ error: 'Failed to delete event from calendar' }, 500);
    }
}
