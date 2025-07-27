import {
    RequestReschedulingInPrimaryCalendarOptions,
    SchedulingInPrimaryCalendarOptions,
} from '@/types/tools/event';
import { BaseCalendarService } from './base';
import { calendar_v3 } from 'googleapis';
import { ExchangeService } from '@/services/exchange';

export class RequestSchedulingService extends BaseCalendarService {
    async requestSchedulingForEvent(options: SchedulingInPrimaryCalendarOptions): Promise<string> {
        // Get the primary calendar id
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }

        const attendeeEmails = options.attendeeEmails;
        const hostEmail = options.hostEmail;

        const recipients = [...attendeeEmails];
        if (hostEmail) {
            recipients.push(hostEmail);
        }

        const exchangeOwnerId = this.userId;

        const exchangeService = await this.getExchangeService();

        const emailSubject = `Scheduling Request: ${options.summary || 'Event'}`;

        const emailBody = this.formatScheduleEmailBody(options);

        await exchangeService.createNewExchangeOnBehalfOfUser(
            exchangeOwnerId,
            emailSubject,
            emailBody,
            recipients,
        );

        return `Scheduling request sent successfully to ${recipients.join(', ')}`;
    }

    async requestReschedulingForEvent(
        options: RequestReschedulingInPrimaryCalendarOptions,
    ): Promise<string> {
        // Get the primary calendar id
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }

        // Get the event from the event id
        const event = await this.getEvent(primaryCalendarId, options.eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const eventTitle = event.summary || 'Event';

        // Get the attendee from the event
        const attendeeEmails =
            event.attendees
                ?.map((attendee) => attendee.email)
                .filter((email): email is string => email != null) || [];

        const hostEmail = event.organizer?.email;

        const recipients = [...attendeeEmails];
        if (hostEmail) {
            recipients.push(hostEmail);
        }

        const exchangeOwnerId = this.userId;

        const exchangeService = await this.getExchangeService();

        // Format the event date/time for the email
        const eventDateTime = event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
              })
            : 'the scheduled time';

        const emailSubject = `Reschedule Request: ${eventTitle}`;
        const emailBody = this.formatRescheduleEmailBody(
            event,
            eventDateTime,
            options.slots,
            options.reason,
        );

        await exchangeService.createNewExchangeOnBehalfOfUser(
            exchangeOwnerId,
            emailSubject,
            emailBody,
            recipients,
        );

        return `Rescheduling request sent successfully to ${recipients.join(', ')}`;
    }

    private async getEvent(calendarId: string, eventId: string): Promise<calendar_v3.Schema$Event> {
        // Get the calendar connection data
        const connectionData = await this.getCalendarConnection(calendarId);
        if (!connectionData.account) {
            throw new Error('Calendar connection not found');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        const event = await calendar.events.get({
            calendarId: calendarId,
            eventId: eventId,
        });

        if (event.status !== 200 || !event.data) {
            throw new Error(`Failed to get event: ${event.status} ${event.statusText}`);
        }

        return event.data;
    }

    private async getExchangeService() {
        return ExchangeService.getInstance();
    }

    private formatRescheduleEmailBody(
        event: calendar_v3.Schema$Event,
        eventDateTime: string,
        slots: Array<{ startTime: string; endTime: string }>,
        reason: string,
    ): string {
        const eventTitle = event.summary || 'Event';
        const eventDescription = event.description || 'No description provided';
        const eventLocation = event.location || 'No location specified';

        // Get attendee names for a more personal touch
        const attendeeNames =
            event.attendees
                ?.map((attendee) => attendee.displayName || attendee.email)
                .filter(Boolean)
                .join(', ') || 'No attendees listed';

        // Format the suggested slots
        const formattedSlots = slots
            .map((slot, index) => {
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);
                const formattedStart = startDate.toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                });
                const formattedEnd = endDate.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                });
                return `${index + 1}. ${formattedStart} - ${formattedEnd}`;
            })
            .join('\n');

        return `Hi there,

A rescheduling is being requested for an upcoming meeting.

Event Details:
Title: ${eventTitle}
Date & Time: ${eventDateTime}
Location: ${eventLocation}
Attendees: ${attendeeNames}

Description: ${eventDescription}

Reason for Reschedule: ${reason}

Here are some alternative time slots that are available:

Suggested Time Slots:
${formattedSlots}

Please let us know which of these times work best for you, or suggest an alternative time that fits your schedule.`;
    }

    private formatScheduleEmailBody(options: SchedulingInPrimaryCalendarOptions): string {
        const eventTitle = options.summary || 'Event';
        const eventDescription = options.description || 'No description provided';

        // Format the suggested slots
        const formattedSlots = options.slots
            .map((slot, index) => {
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);
                const formattedStart = startDate.toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                });
                const formattedEnd = endDate.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                });
                return `${index + 1}. ${formattedStart} - ${formattedEnd}`;
            })
            .join('\n');

        // Format attendee list for a more personal touch
        const attendeeList = options.attendeeEmails.join(', ');
        const hostInfo = options.hostEmail ? `\nHost: ${options.hostEmail}` : '';

        return `Hi there,

A meeting scheduling request is being made.

Event Details:
Title: ${eventTitle}
Description: ${eventDescription}
Attendees: ${attendeeList}${hostInfo}

Here are some time slots that are available:

Suggested Time Slots:
${formattedSlots}

Please let us know which of these times work best for you, or suggest an alternative time that fits your schedule.`;
    }
}
