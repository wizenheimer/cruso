import {
    RequestReschedulingInPrimaryCalendarOptions,
    SchedulingInPrimaryCalendarOptions,
} from '@/types/tools/event';
import { User } from '@/types/users';
import { BaseCalendarService } from '../calendar/base';
import { calendar_v3 } from 'googleapis';
import { DateTime } from 'luxon';
import { ExchangeDataService } from '../exchange/data';
import { EmailService } from '../email';
import { getUserById } from '@/db/queries/users';

export class SchedulingInitiatorService extends BaseCalendarService {
    private exchangeDataService: ExchangeDataService;
    private emailService: EmailService;

    /**
     * Constructor
     * @param userId - The user id
     */
    constructor(userId: string) {
        super(userId);
        this.exchangeDataService = ExchangeDataService.getInstance();
        this.emailService = EmailService.getInstance();
    }

    /**
     * Request scheduling for an event
     * @param options - The options for the scheduling request
     * @returns A string indicating the success of the scheduling request
     */
    async emailSchedulingRequest(options: SchedulingInPrimaryCalendarOptions): Promise<string> {
        try {
            // Get the user by id
            const user = await this.getValidatedUser();

            // Get the attendee emails and host email
            const attendeeEmails = options.attendeeEmails;
            const hostEmail = options.hostEmail;

            // Create the recipients array
            let recipients = [...attendeeEmails];
            if (hostEmail) {
                recipients.push(hostEmail);
            }

            // Process recipients (add user email, filter, dedupe)
            const finalRecipients = this.processRecipients(recipients, user, false);

            // Now we can create the email subject
            const emailSubject = `Scheduling Request: ${options.summary || 'Event'}`;

            // Log the recipients
            console.log('Creating scheduling email with timezone:', {
                timeZone: options.timeZone,
                slots: options.slots,
            });

            // Format the email body
            const emailBody = this.formatScheduleEmailBody(options);

            // Format the email body with the signature
            const formattedEmailBody = await this.formatEmailBodyWithSignature(emailBody);

            // Send and save the email
            await this.sendAndSaveEmail(
                finalRecipients,
                user.email,
                emailSubject,
                formattedEmailBody,
            );

            return `Scheduling request sent successfully to ${finalRecipients.join(', ')}`;
        } catch (error) {
            console.error('Error sending scheduling request:', error);
            return `Error sending scheduling request`;
        }
    }

    /**
     * Email a rescheduling request
     * @param options - The options for the rescheduling request
     * @returns A string indicating the success of the rescheduling request
     */
    async emailReschedulingRequest(
        options: RequestReschedulingInPrimaryCalendarOptions,
    ): Promise<string> {
        try {
            // Get the primary calendar id
            const primaryCalendarId = await this.getValidatedPrimaryCalendar();

            // Get the user by id
            const user = await this.getValidatedUser();

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

            let recipients = [...attendeeEmails];
            if (hostEmail) {
                recipients.push(hostEmail);
            }

            // Process recipients (exclude user email, filter, dedupe)
            const finalRecipients = this.processRecipients(recipients, user, true);

            // Format the event date/time using Luxon for proper timezone handling
            const eventDateTime = this.formatEventDateTime(event, options.timeZone);

            console.log('Creating rescheduling email with timezone:', {
                timeZone: options.timeZone,
                eventDateTime: eventDateTime,
                slots: options.slots,
            });

            const emailSubject = `Reschedule Request: ${eventTitle}`;
            const emailBody = this.formatRescheduleEmailBody(
                event,
                eventDateTime,
                options.slots,
                options.reason,
                options.timeZone,
            );

            // Format the email body with the signature
            const formattedEmailBody = await this.formatEmailBodyWithSignature(emailBody);

            // Send and save the email
            await this.sendAndSaveEmail(
                finalRecipients,
                user.email,
                emailSubject,
                formattedEmailBody,
            );

            return `Rescheduling request sent successfully to ${finalRecipients.join(', ')}`;
        } catch (error) {
            console.error('Error sending rescheduling request:', error);
            return `Error sending rescheduling request`;
        }
    }

    /**
     * Get and validate the primary calendar ID
     */
    private async getValidatedPrimaryCalendar(): Promise<string> {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }
        return primaryCalendarId;
    }

    /**
     * Get and validate the user by ID
     */
    private async getValidatedUser(): Promise<User> {
        const user = await getUserById(this.userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    /**
     * Process recipients: filter, deduplicate, and optionally exclude user email
     * @param recipients - Array of recipient emails
     * @param user - The validated user object
     * @param excludeUserEmail - Whether to exclude the user's email from recipients
     */
    private processRecipients(
        recipients: string[],
        user: User,
        excludeUserEmail: boolean = false,
    ): string[] {
        let processedRecipients = [...recipients];

        // Add user email to recipients if not excluding it
        if (!excludeUserEmail) {
            processedRecipients.push(user.email);
        }

        // Remove any @crusolabs.com emails from the recipients
        processedRecipients = processedRecipients.filter(
            (recipient) => !recipient.includes('@crusolabs.com'),
        );

        // Remove user email from recipients if excluding it
        if (excludeUserEmail) {
            processedRecipients = processedRecipients.filter(
                (recipient) => recipient !== user.email,
            );
        }

        // Filter out any duplicate emails
        processedRecipients = [...new Set(processedRecipients)];

        return processedRecipients;
    }

    /**
     * Format email body with user signature
     * @param emailBody - The email body content
     */
    private async formatEmailBodyWithSignature(emailBody: string): Promise<string> {
        const signature = await this.exchangeDataService.getSignatureForExchangeOwner(this.userId);
        return `${emailBody}\n\n${signature}`;
    }

    /**
     * Send email and save it to the exchange data service
     * @param recipients - Array of recipient emails
     * @param userEmail - User's email for CC
     * @param subject - Email subject
     * @param body - Email body (already formatted with signature)
     */
    private async sendAndSaveEmail(
        recipients: string[],
        userEmail: string,
        subject: string,
        body: string,
    ): Promise<void> {
        // Send the email
        const sentEmail = await this.emailService.sendEmail({
            recipients,
            cc: [userEmail],
            subject,
            body,
            newThread: true, // Force new thread
        });

        // Save the email
        await this.exchangeDataService.saveEmail(sentEmail, this.userId);
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

    /**
     * Format event datetime using Luxon for proper timezone handling
     */
    private formatEventDateTime(event: calendar_v3.Schema$Event, timeZone?: string): string {
        try {
            if (!event.start?.dateTime) {
                return 'the scheduled time';
            }

            const eventStart = DateTime.fromISO(event.start.dateTime);
            if (!eventStart.isValid) {
                console.error('Invalid event start time:', event.start.dateTime);
                return event.start.dateTime;
            }

            // Use provided timezone or the event's timezone
            const targetTimezone = timeZone || event.start.timeZone || 'UTC';
            const eventInTimezone = eventStart.setZone(targetTimezone);

            if (!eventInTimezone.isValid) {
                console.error('Invalid timezone conversion:', { timeZone: targetTimezone });
                return eventStart.toLocaleString(DateTime.DATETIME_FULL);
            }

            // Format with timezone abbreviation for clarity
            const timezoneAbbr = this.getTimezoneAbbreviation(targetTimezone);

            return `${eventInTimezone.toLocaleString({
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })} (${timezoneAbbr})`;
        } catch (error) {
            console.error('Error formatting event datetime:', error);
            return event.start?.dateTime || 'the scheduled time';
        }
    }

    /**
     * Format time slots using Luxon for consistent timezone handling
     */
    private formatTimeSlots(
        slots: Array<{ startTime: string; endTime: string }>,
        timeZone?: string,
    ): string {
        return slots
            .map((slot, index) => {
                try {
                    const startDate = DateTime.fromISO(slot.startTime);
                    const endDate = DateTime.fromISO(slot.endTime);

                    if (!startDate.isValid || !endDate.isValid) {
                        console.error('Invalid slot times:', {
                            slot,
                            startValid: startDate.isValid,
                            endValid: endDate.isValid,
                        });
                        return `${index + 1}. Invalid time slot`;
                    }

                    // Convert to specified timezone or keep original
                    const targetTimezone = timeZone || startDate.zoneName || 'UTC';
                    const startInTZ = startDate.setZone(targetTimezone);
                    const endInTZ = endDate.setZone(targetTimezone);

                    if (!startInTZ.isValid || !endInTZ.isValid) {
                        console.error('Invalid timezone conversion for slot:', {
                            timeZone: targetTimezone,
                        });
                        // Fallback to original times
                        return `${index + 1}. ${startDate.toLocaleString(DateTime.DATETIME_FULL)} - ${endDate.toLocaleString(DateTime.TIME_SIMPLE)}`;
                    }

                    // Get timezone abbreviation for clarity
                    const timezoneAbbr = this.getTimezoneAbbreviation(targetTimezone);

                    const formattedStart = startInTZ.toLocaleString({
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    const formattedEnd = endInTZ.toLocaleString({
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    return `${index + 1}. ${formattedStart} - ${formattedEnd} (${timezoneAbbr})`;
                } catch (error) {
                    console.error('Error formatting slot:', error, slot);
                    return `${index + 1}. Error formatting time slot`;
                }
            })
            .join('\n');
    }

    private formatRescheduleEmailBody(
        event: calendar_v3.Schema$Event,
        eventDateTime: string,
        slots: Array<{ startTime: string; endTime: string }>,
        reason: string,
        timeZone?: string,
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

        // Format the suggested slots using Luxon
        const formattedSlots = this.formatTimeSlots(slots, timeZone);

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

        // Format the suggested slots using Luxon with proper timezone handling
        const formattedSlots = this.formatTimeSlots(options.slots, options.timeZone);

        // Format attendee list for a more personal touch
        const attendeeList = options.attendeeEmails.join(', ');
        const hostInfo = options.hostEmail ? `\nHost: ${options.hostEmail}` : '';

        // Add timezone info if available
        const timezoneInfo = options.timeZone ? `\nTimezone: ${options.timeZone}` : '';

        return `Hi there,

A meeting scheduling request is being made.

Event Details:
Title: ${eventTitle}
Description: ${eventDescription}
Attendees: ${attendeeList}${hostInfo}${timezoneInfo}

Here are some time slots that are available:

Suggested Time Slots:
${formattedSlots}

Please let us know which of these times work best for you, or suggest an alternative time that fits your schedule.`;
    }
}

export const createSchedulingInitiatorService = (userId: string) => {
    return new SchedulingInitiatorService(userId);
};
