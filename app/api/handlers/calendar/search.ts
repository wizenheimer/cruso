import { Context } from 'hono';
import { getUser } from './connections';
import { CalendarSearchService } from '@/services/calendar/search';

/**
 * Handle the POST request to search events in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleSearchPrimaryCalendarEvents(c: Context) {
    try {
        const user = getUser(c);
        const searchOptions = await c.req.json();

        const searchService = new CalendarSearchService(user.id);

        const result = await searchService.searchPrimaryCalendarEvents(searchOptions);

        return c.json(result);
    } catch (error) {
        console.error('Error searching primary calendar events:', error);
        return c.json({ error: 'Failed to search primary calendar events' }, 500);
    }
}

/**
 * Handle the GET request to quick search events in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleQuickSearchPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query('q');

        if (!query) {
            return c.json({ error: 'Query parameter "q" is required' }, 400);
        }

        const searchService = new CalendarSearchService(user.id);
        const events = await searchService.quickSearchPrimaryCalendar(query);

        return c.json({ events, totalResults: events.length });
    } catch (error) {
        console.error('Error quick searching primary calendar:', error);
        return c.json({ error: 'Failed to quick search primary calendar' }, 500);
    }
}

/**
 * Handle the GET request to get quick search presets
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetQuickSearchPresets(c: Context) {
    try {
        const user = getUser(c);
        const preset = c.req.query('preset');
        const params = c.req.query();

        const searchService = new CalendarSearchService(user.id);
        const presets = searchService.getQuickSearchPresets();

        // If a specific preset is requested, execute it
        if (preset && preset in presets) {
            // Handle preset-specific parameters
            let result;
            switch (preset) {
                case 'todaysMeetings':
                    result = await presets.todaysMeetings();
                    break;
                case 'upcomingWeek':
                    result = await presets.upcomingWeek();
                    break;
                case 'recurringEvents':
                    result = await presets.recurringEvents();
                    break;
                case 'recentlyCreated':
                    const days = params.days ? parseInt(params.days, 10) : 7;
                    result = await presets.recentlyCreated(days);
                    break;
                case 'withPerson':
                    const email = params.email;
                    const personDays = params.days ? parseInt(params.days, 10) : 30;
                    if (!email) {
                        return c.json(
                            { error: 'Email parameter is required for "withPerson" preset' },
                            400,
                        );
                    }
                    result = await presets.withPerson(email, personDays);
                    break;
                case 'longMeetings':
                    const minMinutes = params.minMinutes ? parseInt(params.minMinutes, 10) : 60;
                    result = await presets.longMeetings(minMinutes);
                    break;
                case 'pastMeetings':
                    const pastDays = params.days ? parseInt(params.days, 10) : 30;
                    result = await presets.pastMeetings(pastDays);
                    break;
                case 'freeTextSearch':
                    const query = params.query;
                    if (!query) {
                        return c.json(
                            { error: 'Query parameter is required for "freeTextSearch" preset' },
                            400,
                        );
                    }
                    result = await presets.freeTextSearch(query);
                    break;
                default:
                    return c.json({ error: `Unknown preset: ${preset}` }, 400);
            }

            return c.json(result);
        }

        // Return available presets if no specific preset is requested
        return c.json({
            availablePresets: Object.keys(presets),
            description: 'Use ?preset=<presetName> to execute a specific preset',
            presets: {
                todaysMeetings: 'Get all meetings scheduled for today',
                upcomingWeek: 'Get events for the next 7 days',
                recentlyCreated: 'Get events created in the last N days (default: 7)',
                withPerson: 'Get events with a specific person (requires email parameter)',
                longMeetings: 'Get meetings longer than N minutes (default: 60)',
                recurringEvents: 'Get all recurring events',
                pastMeetings: 'Get meetings from the last N days (default: 30)',
                freeTextSearch: 'Search events with free text (requires query parameter)',
            },
        });
    } catch (error) {
        console.error('Error getting quick search presets:', error);
        return c.json({ error: 'Failed to get quick search presets' }, 500);
    }
}

/**
 * Handle the POST request to search events in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleSearchCalendarEvents(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const searchOptions = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        const searchService = new CalendarSearchService(user.id);

        // For now, we'll use the primary calendar search but filter by calendar
        // In the future, this could be extended to search across multiple calendars
        const result = await searchService.searchPrimaryCalendarEvents({
            ...searchOptions,
            // Add calendar-specific filtering if needed
        });

        return c.json(result);
    } catch (error) {
        console.error('Error searching calendar events:', error);
        return c.json({ error: 'Failed to search calendar events' }, 500);
    }
}
