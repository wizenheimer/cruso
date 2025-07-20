import { calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { eq, and } from 'drizzle-orm';
import { preferenceService } from '../preferences';
import { BaseCalendarService, CalendarEvent, TimeRange } from './base';
import { addMinutes, differenceInMinutes, startOfDay, endOfDay, isWeekend } from 'date-fns';

// ==================================================
// Availability Interfaces
// ==================================================

export interface AvailabilityResult {
    isAvailable: boolean;
    timezone: string;
    busySlots: Array<{ start: string; end: string }>;
    freeSlots: Array<{ start: string; end: string }>;
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
}

export interface BlockAvailabilityResult {
    state: 'success' | 'error';
    rescheduledEventCount?: number;
    rescheduledEventDetails?: CalendarEvent[];
    blockEventDetails?: CalendarEvent;
    message?: string;
}

export interface ClearAvailabilityResult {
    state: 'success' | 'error';
    rescheduledEventCount?: number;
    rescheduledEventDetails?: CalendarEvent[];
}

export interface WorkingHours {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
}

export interface SuggestedTimeSlot {
    start: string; // RFC3339
    end: string; // RFC3339
    score: number; // 0-100, higher is better
    reasoning: string[];
    conflictingAttendees: string[];
    availableAttendees: string[];
    workingHoursCompliance: boolean;
}

// ==================================================
// Availability Service Class
// ==================================================

export class CalendarAvailabilityService extends BaseCalendarService {
    /**
     * Check availability for a time block
     */
    async checkAvailabilityBlock(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        options: {
            includeCalendarIds?: string[];
            excludeCalendarIds?: string[];
            responseTimezone?: string;
            timeDurationMinutes?: number;
            includeEvents?: boolean;
        } = {},
    ): Promise<AvailabilityResult> {
        console.log('┌─ [CALENDAR_AVAILABILITY] Checking availability block...', {
            timeMin: timeMinRFC3339,
            timeMax: timeMaxRFC3339,
            options,
        });

        try {
            const connections = await this.getActiveConnections();
            const busySlots: Array<{ start: string; end: string }> = [];
            const events: Array<{
                id: string;
                summary: string;
                start: string;
                end: string;
                calendarId: string;
                calendarName: string;
            }> = [];

            // Filter connections based on options
            const filteredConnections = connections.filter(({ connection }) => {
                if (
                    options.includeCalendarIds &&
                    !options.includeCalendarIds.includes(connection.calendarId)
                ) {
                    return false;
                }
                if (
                    options.excludeCalendarIds &&
                    options.excludeCalendarIds.includes(connection.calendarId)
                ) {
                    return false;
                }
                return connection.includeInAvailability;
            });

            console.log(
                '├─ [CALENDAR_AVAILABILITY] Checking calendars:',
                filteredConnections.length,
            );

            for (const { connection, account } of filteredConnections) {
                if (!account) continue;

                try {
                    const calendar = await this.getCalendarApi(account.id);

                    const response = await calendar.freebusy.query({
                        requestBody: {
                            timeMin: timeMinRFC3339,
                            timeMax: timeMaxRFC3339,
                            items: [{ id: connection.calendarId }],
                        },
                    });

                    const calendarBusy =
                        response.data.calendars?.[connection.calendarId]?.busy || [];

                    for (const busy of calendarBusy) {
                        if (busy.start && busy.end) {
                            busySlots.push({
                                start: busy.start,
                                end: busy.end,
                            });

                            if (options.includeEvents) {
                                // Get event details for this busy slot
                                try {
                                    const eventsResponse = await calendar.events.list({
                                        calendarId: connection.calendarId,
                                        timeMin: busy.start,
                                        timeMax: busy.end,
                                        maxResults: 10,
                                    });

                                    for (const event of eventsResponse.data.items || []) {
                                        if (
                                            event.id &&
                                            event.start?.dateTime &&
                                            event.end?.dateTime
                                        ) {
                                            events.push({
                                                id: event.id,
                                                summary: event.summary || 'Unknown Event',
                                                start: event.start.dateTime,
                                                end: event.end.dateTime,
                                                calendarId: connection.calendarId,
                                                calendarName:
                                                    connection.calendarName || 'Unknown Calendar',
                                            });
                                        }
                                    }
                                } catch (eventError) {
                                    console.warn(
                                        'Failed to get event details for busy slot:',
                                        eventError,
                                    );
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error checking availability for calendar:',
                        connection.calendarId,
                        error,
                    );
                }
            }

            // Merge overlapping busy slots
            const mergedBusySlots = this.mergeBusySlots(busySlots);

            // Calculate free slots
            const durationMinutes = options.timeDurationMinutes || 60;
            const freeSlots = this.calculateFreeSlots(
                timeMinRFC3339,
                timeMaxRFC3339,
                mergedBusySlots,
                durationMinutes,
                options.responseTimezone || 'UTC',
            );

            const isAvailable = freeSlots.length > 0;

            console.log('└─ [CALENDAR_AVAILABILITY] Availability check completed:', {
                isAvailable,
                busySlotsCount: mergedBusySlots.length,
                freeSlotsCount: freeSlots.length,
            });

            return {
                isAvailable,
                timezone: options.responseTimezone || 'UTC',
                busySlots: mergedBusySlots,
                freeSlots,
                events,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_AVAILABILITY] Error checking availability:', error);
            throw new Error(
                `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Create an availability block by rescheduling conflicting events
     */
    async createAvailabilityBlock(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        options: {
            responseTimezone?: string;
            timeDurationMinutes?: number;
            eventSummary?: string;
            eventDescription?: string;
            eventAttendees?: string[];
            eventLocation?: string;
            eventConference?: boolean;
            eventPrivate?: boolean;
            eventColorId?: string;
            createBlock?: boolean;
        } = {},
    ): Promise<BlockAvailabilityResult> {
        const duration = options.timeDurationMinutes || 60;
        const responseTimezone = options.responseTimezone || 'UTC';
        const shouldCreateBlock = options.createBlock !== false;

        console.log('┌─ [CALENDAR_AVAILABILITY] Creating availability block...', {
            timeMin: timeMinRFC3339,
            timeMax: timeMaxRFC3339,
            duration,
            responseTimezone,
            shouldCreateBlock,
        });

        const rescheduledEventDetails: CalendarEvent[] = [];
        let blockEventDetails: CalendarEvent | null = null;

        try {
            // Get user preferences to find primary account
            const userPreferences = await preferenceService.getPreferences(this.userId);
            const primaryAccountId = userPreferences.data?.preferences.primaryAccountId;

            if (!primaryAccountId) {
                throw new Error('Primary account not found');
            }

            console.log('├─ [CALENDAR_AVAILABILITY] Primary account ID:', primaryAccountId);

            // Get primary calendar connections
            const primaryCalendarConnections = await db
                .select()
                .from(calendarConnections)
                .where(
                    and(
                        eq(calendarConnections.accountId, primaryAccountId),
                        eq(calendarConnections.isActive, true),
                        eq(calendarConnections.includeInAvailability, true),
                        eq(calendarConnections.isPrimary, true),
                    ),
                );

            if (primaryCalendarConnections.length === 0) {
                throw new Error('No primary calendar found');
            }

            console.log(
                '├─ [CALENDAR_AVAILABILITY] Primary calendar:',
                primaryCalendarConnections[0].calendarId,
            );

            const calendar = await this.getCalendarApi(primaryAccountId);
            const primaryCalendarId = primaryCalendarConnections[0].calendarId;

            // Check for conflicting events
            const availability = await this.checkAvailabilityBlock(timeMinRFC3339, timeMaxRFC3339, {
                includeCalendarIds: [primaryCalendarId],
                includeEvents: true,
            });

            if (availability.busySlots.length === 0) {
                console.log(
                    '├─ [CALENDAR_AVAILABILITY] No conflicts found, creating block directly',
                );
            } else {
                console.log('├─ [CALENDAR_AVAILABILITY] Found conflicts, rescheduling events...');

                // Get all events in the time range
                const eventsResponse = await calendar.events.list({
                    calendarId: primaryCalendarId,
                    timeMin: timeMinRFC3339,
                    timeMax: timeMaxRFC3339,
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                const conflictingEvents = eventsResponse.data.items || [];

                // Find optimal events to reschedule
                const eventsToReschedule = this.findOptimalEventsToReschedule(
                    conflictingEvents.map((event) => this.transformGoogleEvent(event)),
                    duration,
                    timeMinRFC3339,
                    timeMaxRFC3339,
                );

                console.log(
                    '├─ [CALENDAR_AVAILABILITY] Events to reschedule:',
                    eventsToReschedule.length,
                );

                // Reschedule events
                for (const event of eventsToReschedule) {
                    try {
                        // Find a new time slot
                        const newStartTime = new Date(event.start.dateTime!);
                        newStartTime.setHours(newStartTime.getHours() + 2); // Move 2 hours later

                        const newEndTime = new Date(event.end.dateTime!);
                        newEndTime.setHours(newEndTime.getHours() + 2);

                        const updatedEvent = await calendar.events.patch({
                            calendarId: primaryCalendarId,
                            eventId: event.id!,
                            requestBody: {
                                start: {
                                    dateTime: newStartTime.toISOString(),
                                    timeZone: event.start.timeZone || 'UTC',
                                },
                                end: {
                                    dateTime: newEndTime.toISOString(),
                                    timeZone: event.end.timeZone || 'UTC',
                                },
                            },
                            sendUpdates: 'all',
                        });

                        rescheduledEventDetails.push(this.transformGoogleEvent(updatedEvent.data));
                        console.log('├─ [CALENDAR_AVAILABILITY] Rescheduled event:', event.id);
                    } catch (rescheduleError) {
                        console.error(
                            '├─ [CALENDAR_AVAILABILITY] Failed to reschedule event:',
                            event.id,
                            rescheduleError,
                        );
                    }
                }
            }

            // Create the availability block event
            if (shouldCreateBlock) {
                const blockEvent: CalendarEvent = {
                    summary: options.eventSummary || 'Availability Block',
                    description: options.eventDescription || 'Protected time for focused work',
                    start: {
                        dateTime: timeMinRFC3339,
                        timeZone: responseTimezone,
                    },
                    end: {
                        dateTime: timeMaxRFC3339,
                        timeZone: responseTimezone,
                    },
                    location: options.eventLocation,
                    attendees: options.eventAttendees?.map((email) => ({ email })),
                    transparency: options.eventPrivate ? 'opaque' : 'transparent',
                    colorId: options.eventColorId,
                };

                if (options.eventConference) {
                    blockEvent.conferenceData = {
                        createRequest: {
                            requestId: crypto.randomUUID(),
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    };
                }

                const response = await calendar.events.insert({
                    calendarId: primaryCalendarId,
                    requestBody: blockEvent as calendar_v3.Schema$Event,
                    sendUpdates: 'none',
                    conferenceDataVersion: options.eventConference ? 1 : undefined,
                });

                blockEventDetails = this.transformGoogleEvent(response.data);
                console.log(
                    '├─ [CALENDAR_AVAILABILITY] Created block event:',
                    blockEventDetails.id,
                );
            }

            console.log('└─ [CALENDAR_AVAILABILITY] Availability block created successfully');

            return {
                state: 'success',
                rescheduledEventCount: rescheduledEventDetails.length,
                rescheduledEventDetails,
                blockEventDetails: blockEventDetails || undefined,
                message: `Successfully created availability block. ${rescheduledEventDetails.length} events rescheduled.`,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_AVAILABILITY] Error creating availability block:', error);
            return {
                state: 'error',
                message: `Failed to create availability block: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Find the best time for a meeting with multiple attendees
     */
    async findBestTimeForMeeting(
        durationMinutes: number,
        attendeeEmails: string[],
        options?: {
            searchRangeStart?: string; // Default: now
            searchRangeEnd?: string; // Default: 2 weeks from now
            preferredTimeRanges?: TimeRange[];
            workingHoursOnly?: boolean;
            workingHours?: WorkingHours[]; // Custom working hours
            minimumNoticeHours?: number; // Default: 24
            maxSuggestions?: number; // Default: 5
            timezone?: string; // Default: UTC
            excludeWeekends?: boolean; // Default: true
            preferMornings?: boolean;
            preferAfternoons?: boolean;
            bufferMinutes?: number; // Buffer time before/after meetings
        },
    ): Promise<SuggestedTimeSlot[]> {
        console.log('┌─ [CALENDAR_AVAILABILITY] Finding best meeting time...', {
            durationMinutes,
            attendeeCount: attendeeEmails.length,
            options,
        });

        try {
            const searchStart = options?.searchRangeStart
                ? new Date(options.searchRangeStart)
                : new Date(Date.now() + (options?.minimumNoticeHours || 24) * 60 * 60 * 1000);
            const searchEnd = options?.searchRangeEnd
                ? new Date(options.searchRangeEnd)
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
            const timezone = options?.timezone || 'UTC';
            const maxSuggestions = options?.maxSuggestions || 5;
            const workingHoursOnly = options?.workingHoursOnly ?? true;
            const excludeWeekends = options?.excludeWeekends ?? true;
            const workingHours = options?.workingHours || this.getDefaultWorkingHours(timezone);

            // Generate potential time slots
            const potentialSlots = this.generatePotentialTimeSlots(
                searchStart,
                searchEnd,
                durationMinutes,
                {
                    workingHoursOnly,
                    workingHours,
                    excludeWeekends,
                    bufferMinutes: options?.bufferMinutes || 0,
                },
            );

            console.log(
                '├─ [CALENDAR_AVAILABILITY] Generated potential slots:',
                potentialSlots.length,
            );

            // Check availability for each attendee
            const attendeeAvailability = new Map<string, AvailabilityResult>();

            for (const email of attendeeEmails) {
                try {
                    // For now, we'll check the current user's availability
                    // In a real implementation, you'd check each attendee's availability
                    const availability = await this.checkAvailabilityBlock(
                        searchStart.toISOString(),
                        searchEnd.toISOString(),
                        { timeDurationMinutes: durationMinutes },
                    );
                    attendeeAvailability.set(email, availability);
                } catch (error) {
                    console.warn('Failed to check availability for attendee:', email, error);
                }
            }

            // Score and rank time slots
            const scoredSlots: SuggestedTimeSlot[] = [];

            for (const slot of potentialSlots) {
                const score = this.scoreTimeSlot(slot, attendeeAvailability, attendeeEmails, {
                    preferredTimeRanges: options?.preferredTimeRanges,
                    preferMornings: options?.preferMornings,
                    preferAfternoons: options?.preferAfternoons,
                });

                if (score.score > 0) {
                    scoredSlots.push(score);
                }
            }

            // Sort by score and return top suggestions
            const suggestions = scoredSlots
                .sort((a, b) => b.score - a.score)
                .slice(0, maxSuggestions);

            console.log('└─ [CALENDAR_AVAILABILITY] Found suggestions:', suggestions.length);

            return suggestions;
        } catch (error) {
            console.error('└─ [CALENDAR_AVAILABILITY] Error finding meeting time:', error);
            throw new Error(
                `Failed to find meeting time: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // ==================================================
    // Private Helper Methods
    // ==================================================

    private findOptimalEventsToReschedule(
        events: CalendarEvent[],
        requiredDurationMinutes: number,
        timeMin: string,
        timeMax: string,
    ): CalendarEvent[] {
        const timeMinDate = new Date(timeMin);
        const timeMaxDate = new Date(timeMax);
        const requiredDurationMs = requiredDurationMinutes * 60 * 1000;

        // Score events based on various factors
        const scoredEvents = events.map((event) => {
            let score = 0;
            const eventStart = new Date(event.start.dateTime!);
            const eventEnd = new Date(event.end.dateTime!);
            const eventDuration = eventEnd.getTime() - eventStart.getTime();

            // Prefer shorter events
            score += ((60 * 60 * 1000 - eventDuration) / (60 * 60 * 1000)) * 50;

            // Prefer events with fewer attendees (personal events)
            if (event.attendees) {
                score += (10 - event.attendees.length) * 5;
            } else {
                score += 50; // No attendees = high score
            }

            // Prefer events that are not all-day
            if (!event.start.date) {
                score += 20;
            }

            // Prefer events that are not recurring
            if (!event.recurringEventId) {
                score += 30;
            }

            return { event, score, duration: eventDuration };
        });

        // Sort by score (higher is better)
        scoredEvents.sort((a, b) => b.score - a.score);

        // Find minimal set of events to reschedule
        return this.findMinimalContiguousEvents(scoredEvents, requiredDurationMs);
    }

    private findMinimalContiguousEvents(
        scoredEvents: Array<{ event: CalendarEvent; score: number; duration: number }>,
        requiredDurationMs: number,
    ): CalendarEvent[] {
        const eventsToReschedule: CalendarEvent[] = [];
        let totalDuration = 0;

        for (const { event } of scoredEvents) {
            if (totalDuration >= requiredDurationMs) {
                break;
            }

            eventsToReschedule.push(event);
            const eventDuration =
                new Date(event.end.dateTime!).getTime() - new Date(event.start.dateTime!).getTime();
            totalDuration += eventDuration;
        }

        return eventsToReschedule;
    }

    private mergeBusySlots(
        busySlots: Array<{ start: string; end: string }>,
    ): Array<{ start: string; end: string }> {
        if (busySlots.length === 0) return [];

        // Sort by start time
        const sorted = [...busySlots].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        );

        const merged: Array<{ start: string; end: string }> = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];

            if (new Date(current.start).getTime() <= new Date(last.end).getTime()) {
                // Overlapping or adjacent slots, merge them
                last.end = new Date(
                    Math.max(new Date(last.end).getTime(), new Date(current.end).getTime()),
                ).toISOString();
            } else {
                // Non-overlapping, add as new slot
                merged.push(current);
            }
        }

        return merged;
    }

    private calculateFreeSlots(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        busySlots: Array<{ start: string; end: string }>,
        durationMinutes: number,
        timezone: string,
    ): Array<{ start: string; end: string }> {
        const freeSlots: Array<{ start: string; end: string }> = [];
        const timeMin = new Date(timeMinRFC3339);
        const timeMax = new Date(timeMaxRFC3339);
        const durationMs = durationMinutes * 60 * 1000;

        let currentTime = timeMin;

        for (const busySlot of busySlots) {
            const busyStart = new Date(busySlot.start);
            const busyEnd = new Date(busySlot.end);

            // Check if there's enough time before this busy slot
            if (busyStart.getTime() - currentTime.getTime() >= durationMs) {
                freeSlots.push({
                    start: this.convertToTimezone(currentTime.toISOString(), timezone),
                    end: this.convertToTimezone(busyStart.toISOString(), timezone),
                });
            }

            currentTime = busyEnd;
        }

        // Check if there's enough time after the last busy slot
        if (timeMax.getTime() - currentTime.getTime() >= durationMs) {
            freeSlots.push({
                start: this.convertToTimezone(currentTime.toISOString(), timezone),
                end: this.convertToTimezone(timeMax.toISOString(), timezone),
            });
        }

        return freeSlots;
    }

    private generatePotentialTimeSlots(
        searchStart: Date,
        searchEnd: Date,
        durationMinutes: number,
        options: {
            workingHoursOnly: boolean;
            workingHours: WorkingHours[];
            excludeWeekends: boolean;
            bufferMinutes: number;
        },
    ): TimeRange[] {
        const slots: TimeRange[] = [];
        const durationMs = durationMinutes * 60 * 1000;
        const bufferMs = options.bufferMinutes * 60 * 1000;
        const totalDurationMs = durationMs + bufferMs * 2; // Buffer before and after

        let currentTime = new Date(searchStart);

        while (currentTime.getTime() + totalDurationMs <= searchEnd.getTime()) {
            const slotStart = new Date(currentTime.getTime() + bufferMs);
            const slotEnd = new Date(slotStart.getTime() + durationMs);

            if (this.isWithinWorkingHours(slotStart, slotEnd, options)) {
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                });
            }

            // Move to next potential slot (30-minute increments)
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        return slots;
    }

    private isWithinWorkingHours(
        start: Date,
        end: Date,
        options: {
            workingHoursOnly: boolean;
            workingHours: WorkingHours[];
            excludeWeekends: boolean;
        },
    ): boolean {
        if (!options.workingHoursOnly) {
            return true;
        }

        const dayOfWeek = start.getDay();
        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const endHour = end.getHours();
        const endMinute = end.getMinutes();

        // Check if it's a weekend
        if (options.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
            return false;
        }

        // Find working hours for this day
        const dayWorkingHours = options.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
        if (!dayWorkingHours) {
            return false;
        }

        // Parse working hours
        const [whStartHour, whStartMinute] = dayWorkingHours.startTime.split(':').map(Number);
        const [whEndHour, whEndMinute] = dayWorkingHours.endTime.split(':').map(Number);

        const whStartMinutes = whStartHour * 60 + whStartMinute;
        const whEndMinutes = whEndHour * 60 + whEndMinute;
        const slotStartMinutes = startHour * 60 + startMinute;
        const slotEndMinutes = endHour * 60 + endMinute;

        return slotStartMinutes >= whStartMinutes && slotEndMinutes <= whEndMinutes;
    }

    private scoreTimeSlot(
        slot: TimeRange,
        attendeeAvailability: Map<string, AvailabilityResult>,
        allAttendees: string[],
        options?: {
            preferredTimeRanges?: TimeRange[];
            preferMornings?: boolean;
            preferAfternoons?: boolean;
        },
    ): SuggestedTimeSlot {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const hour = slotStart.getHours();

        let score = 50; // Base score
        const reasoning: string[] = [];
        const conflictingAttendees: string[] = [];
        const availableAttendees: string[] = [];

        // Check attendee availability
        for (const [email, availability] of attendeeAvailability) {
            const isAvailable = this.isSlotAvailableForAttendee(slot, availability);
            if (isAvailable) {
                availableAttendees.push(email);
                score += 10;
            } else {
                conflictingAttendees.push(email);
                score -= 20;
            }
        }

        // Time preference scoring
        if (options?.preferMornings && hour < 12) {
            score += 15;
            reasoning.push('Morning preference');
        } else if (options?.preferAfternoons && hour >= 12 && hour < 17) {
            score += 15;
            reasoning.push('Afternoon preference');
        }

        // Preferred time ranges
        if (options?.preferredTimeRanges) {
            for (const range of options.preferredTimeRanges) {
                if (this.isSlotWithinRange(slot, range)) {
                    score += 25;
                    reasoning.push('Within preferred time range');
                    break;
                }
            }
        }

        // Working hours compliance
        const workingHoursCompliance = hour >= 9 && hour < 17;
        if (workingHoursCompliance) {
            score += 10;
            reasoning.push('Within standard working hours');
        }

        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));

        return {
            start: slot.start,
            end: slot.end,
            score,
            reasoning,
            conflictingAttendees,
            availableAttendees,
            workingHoursCompliance,
        };
    }

    private isSlotAvailableForAttendee(slot: TimeRange, availability: AvailabilityResult): boolean {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        for (const busySlot of availability.busySlots) {
            const busyStart = new Date(busySlot.start);
            const busyEnd = new Date(busySlot.end);

            // Check for overlap
            if (slotStart < busyEnd && slotEnd > busyStart) {
                return false;
            }
        }

        return true;
    }

    private isSlotWithinRange(slot: TimeRange, range: TimeRange): boolean {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const rangeStart = new Date(range.start);
        const rangeEnd = new Date(range.end);

        return slotStart >= rangeStart && slotEnd <= rangeEnd;
    }

    private getDefaultWorkingHours(timezone: string): WorkingHours[] {
        return [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', timezone }, // Monday
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', timezone }, // Tuesday
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', timezone }, // Wednesday
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', timezone }, // Thursday
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', timezone }, // Friday
        ];
    }
}
