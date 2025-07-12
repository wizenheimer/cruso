import { Context } from 'hono';
import { db } from '@/db';
import { availability } from '@/db/schema/availability';
import { eq, and } from 'drizzle-orm';
import { preferenceService } from '@/services/preferences';

interface AvailabilitySlot {
    days: number[]; // [1,2,3,4,5] for Mon-Fri (1=Monday, 7=Sunday)
    startTime: string; // "09:00" or "09:00:00"
    endTime: string; // "17:00" or "17:00:00"
    timezone: string;
}

interface PreferencesData {
    // Personal Info - from preferences table
    displayName?: string;
    nickname?: string;

    // Availability - computed from availability table
    availability?: AvailabilitySlot[];
    defaultTimezone?: string; // fallback timezone from preferences table

    // Scheduling - from preferences table
    minNoticeMinutes?: number;
    defaultMeetingDurationMinutes?: number;

    // Buffer settings - from preferences table
    virtualBufferMinutes?: number;
    inPersonBufferMinutes?: number;
    backToBackBufferMinutes?: number;
    flightBufferMinutes?: number;
}

// Helper function to convert day numbers to day names
function getDayName(dayNum: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Unknown';
}

// Helper function to format time from 24h to 12h format
function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Helper function to format availability slots into readable working hours
function formatAvailability(availability: AvailabilitySlot[]): string[] {
    if (!availability || availability.length === 0) return [];

    const formattedSlots = availability.map((slot) => {
        const dayNames = slot.days.map(getDayName);
        const startTime = formatTime(slot.startTime);
        const endTime = formatTime(slot.endTime);

        if (dayNames.length === 1) {
            return `${dayNames[0]}: ${startTime} - ${endTime}`;
        } else if (dayNames.length === 2) {
            return `${dayNames[0]} and ${dayNames[1]}: ${startTime} - ${endTime}`;
        } else {
            const lastDay = dayNames.pop();
            return `${dayNames.join(', ')}, and ${lastDay}: ${startTime} - ${endTime}`;
        }
    });

    return formattedSlots;
}

export function generatePreferencesMarkdown(data: PreferencesData): string {
    const sections: string[] = [];

    // General Preferences Header
    sections.push('# General Preferences\n');

    // Personal Info Section
    if (data.displayName || data.nickname) {
        sections.push('## Personal Info\n');
        if (data.displayName) {
            sections.push(`- My full name is ${data.displayName}.\n`);
        }
        if (data.nickname) {
            sections.push(`- You can call me ${data.nickname}.\n`);
        }
    }

    // Availability Section
    if (data.availability && data.availability.length > 0) {
        sections.push('## Availability\n');

        const workingHours = formatAvailability(data.availability);
        workingHours.forEach((hours) => {
            sections.push(`- My working hours are typically ${hours}.\n`);
        });

        // Use timezone from first availability slot, or fallback to default
        const timezone = data.availability[0]?.timezone || data.defaultTimezone;
        if (timezone) {
            sections.push(`- My timezone is usually ${timezone}.\n`);
        }
    }

    // Scheduling Section
    if (
        data.minNoticeMinutes !== undefined ||
        data.defaultMeetingDurationMinutes !== undefined ||
        data.virtualBufferMinutes !== undefined ||
        data.inPersonBufferMinutes !== undefined ||
        data.backToBackBufferMinutes !== undefined ||
        data.flightBufferMinutes !== undefined
    ) {
        sections.push('## Scheduling\n');

        if (data.minNoticeMinutes !== undefined) {
            const hours = Math.floor(data.minNoticeMinutes / 60);
            const minutes = data.minNoticeMinutes % 60;
            if (hours > 0 && minutes > 0) {
                sections.push(
                    `- Minimum notice for meetings: ${hours} hours and ${minutes} minutes.\n`,
                );
            } else if (hours > 0) {
                sections.push(`- Minimum notice for meetings: ${hours} hours.\n`);
            } else {
                sections.push(`- Minimum notice for meetings: ${minutes} minutes.\n`);
            }
        }

        if (data.defaultMeetingDurationMinutes !== undefined) {
            sections.push(
                `- I usually schedule ${data.defaultMeetingDurationMinutes}-minute meetings.\n`,
            );
        }

        // Buffer rules section
        const hasBufferRules =
            data.virtualBufferMinutes !== undefined ||
            data.inPersonBufferMinutes !== undefined ||
            data.backToBackBufferMinutes !== undefined ||
            data.flightBufferMinutes !== undefined;

        if (hasBufferRules) {
            sections.push('- Apply these buffer rules:\n');

            if (data.virtualBufferMinutes !== undefined) {
                if (data.virtualBufferMinutes === 0) {
                    sections.push('  - All events: No buffer\n');
                } else {
                    sections.push(
                        `  - Virtual meetings: ${data.virtualBufferMinutes} minutes buffer\n`,
                    );
                }
            }

            if (data.inPersonBufferMinutes !== undefined) {
                if (data.inPersonBufferMinutes === 0) {
                    sections.push('  - In-person events: No buffer\n');
                } else {
                    sections.push(
                        `  - In-person events: ${data.inPersonBufferMinutes} minutes before and after\n`,
                    );
                }
            }

            if (data.backToBackBufferMinutes !== undefined) {
                if (data.backToBackBufferMinutes === 0) {
                    sections.push('  - Back-to-back: No buffer\n');
                } else {
                    sections.push(
                        `  - Back-to-back: ${data.backToBackBufferMinutes} minutes buffer\n`,
                    );
                }
            }

            if (data.flightBufferMinutes !== undefined) {
                if (data.flightBufferMinutes === 0) {
                    sections.push('  - Travel: No buffer\n');
                } else {
                    sections.push(
                        `  - Travel: ${data.flightBufferMinutes} minutes before and after\n`,
                    );
                }
            }
        }
    }

    return sections.join('');
}

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with user preferences or error message
 */
export async function handleGetPreferences(requestContext: Context) {
    console.log('[HANDLER] Getting preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const preferencesResult = await preferenceService.getOrCreatePreferences(
            authenticatedUser.id,
        );

        if (!preferencesResult.success) {
            console.log('[HANDLER] Failed to get or create preferences:', preferencesResult.error);
            return requestContext.json({ error: preferencesResult.error }, 500);
        }

        console.log('[HANDLER] Preferences retrieved successfully');
        return requestContext.json(preferencesResult.data);
    } catch (fetchPreferencesError) {
        console.error('[HANDLER] Error fetching preferences:', fetchPreferencesError);
        return requestContext.json({ error: 'Failed to fetch preferences' }, 500);
    }
}

/**
 * Handle POST request to create user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with created preferences or error message
 */
export async function handleCreatePreferences(requestContext: Context) {
    console.log('[HANDLER] Creating preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);
        // Note: request body is not used for default preferences creation
        await requestContext.req.json(); // Consume the request body

        const createPreferencesResult = await preferenceService.createDefaultPreferences(
            authenticatedUser.id,
        );

        if (!createPreferencesResult.success) {
            console.log('[HANDLER] Failed to create preferences:', createPreferencesResult.error);
            return requestContext.json({ error: createPreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences created successfully for user:', authenticatedUser.id);
        return requestContext.json(createPreferencesResult.data, 201);
    } catch (createPreferencesError) {
        console.error('Error creating preferences:', createPreferencesError);
        return requestContext.json({ error: 'Failed to create preferences' }, 500);
    }
}

/**
 * Handle PATCH request to update user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePreferences(requestContext: Context) {
    console.log('[HANDLER] Updating preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const preferencesUpdatePayload = await requestContext.req.json();

        const updatePreferencesResult = await preferenceService.updatePreferences(
            authenticatedUser.id,
            preferencesUpdatePayload,
        );

        if (!updatePreferencesResult.success) {
            console.log('[HANDLER] Failed to update preferences:', updatePreferencesResult.error);
            return requestContext.json({ error: updatePreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences updated successfully for user:', authenticatedUser.id);
        return requestContext.json(updatePreferencesResult.data);
    } catch (updatePreferencesError) {
        console.error('Error updating preferences:', updatePreferencesError);
        return requestContext.json({ error: 'Failed to update preferences' }, 500);
    }
}

/**
 * Handle DELETE request to delete user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with deletion result or error message
 */
export async function handleDeletePreferences(requestContext: Context) {
    console.log('[HANDLER] Deleting preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const deletePreferencesResult = await preferenceService.deletePreferences(
            authenticatedUser.id,
        );

        if (!deletePreferencesResult.success) {
            console.log('[HANDLER] Failed to delete preferences:', deletePreferencesResult.error);
            return requestContext.json({ error: deletePreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences deleted successfully for user:', authenticatedUser.id);
        return requestContext.json({ success: true });
    } catch (deletePreferencesError) {
        console.error('Error deleting preferences:', deletePreferencesError);
        return requestContext.json({ error: 'Failed to delete preferences' }, 500);
    }
}

/**
 * Handle POST request to generate preferences document
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with generated document or error message
 */
export async function handleGeneratePreferencesDocument(requestContext: Context) {
    console.log('[HANDLER] Generating preferences document for user');
    try {
        const authenticatedUser = getUser(requestContext);

        // Get user preferences
        const preferencesResult = await preferenceService.getBasicPreferences(authenticatedUser.id);
        if (!preferencesResult.success || !preferencesResult.data) {
            console.log('[HANDLER] Failed to get preferences:', preferencesResult.error);
            return requestContext.json({ error: 'Preferences not found' }, 404);
        }

        const userPreferences = preferencesResult.data;

        // Get user availability
        const userAvailability = await db
            .select({
                days: availability.days,
                startTime: availability.startTime,
                endTime: availability.endTime,
                timezone: availability.timezone,
            })
            .from(availability)
            .where(
                and(eq(availability.userId, authenticatedUser.id), eq(availability.isActive, true)),
            )
            .orderBy(availability.createdAt);

        // Prepare data for document generation
        const preferencesData: PreferencesData = {
            displayName: userPreferences.displayName || undefined,
            nickname: userPreferences.nickname || undefined,
            availability: userAvailability.map((avail) => ({
                days: avail.days || [],
                startTime: avail.startTime,
                endTime: avail.endTime,
                timezone: avail.timezone,
            })),
            defaultTimezone: userPreferences.timezone || undefined,
            minNoticeMinutes: userPreferences.minNoticeMinutes || undefined,
            defaultMeetingDurationMinutes:
                userPreferences.defaultMeetingDurationMinutes || undefined,
            virtualBufferMinutes: userPreferences.virtualBufferMinutes || undefined,
            inPersonBufferMinutes: userPreferences.inPersonBufferMinutes || undefined,
            backToBackBufferMinutes: userPreferences.backToBackBufferMinutes || undefined,
            flightBufferMinutes: userPreferences.flightBufferMinutes || undefined,
        };

        // Generate the markdown document
        const document = generatePreferencesMarkdown(preferencesData);

        // Update the preferences with the generated document
        const updateResult = await preferenceService.updatePreferences(authenticatedUser.id, {
            document,
        });

        if (!updateResult.success) {
            console.log(
                '[HANDLER] Failed to update preferences with document:',
                updateResult.error,
            );
            return requestContext.json({ error: 'Failed to save generated document' }, 500);
        }

        console.log('[HANDLER] Preferences document generated and saved successfully');
        return requestContext.json({
            success: true,
            document,
            data: updateResult.data,
        });
    } catch (error) {
        console.error('[HANDLER] Error generating preferences document:', error);
        return requestContext.json({ error: 'Failed to generate preferences document' }, 500);
    }
}

/**
 * Handle PATCH request to update primary user email
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePrimaryEmail(requestContext: Context) {
    console.log('[HANDLER] Updating primary email for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const primaryEmailUpdatePayload = await requestContext.req.json();

        if (primaryEmailUpdatePayload.primaryUserEmailId === undefined) {
            return requestContext.json({ error: 'primaryUserEmailId is required' }, 400);
        }

        const updatePrimaryEmailResult = await preferenceService.updatePrimaryEmail(
            authenticatedUser.id,
            primaryEmailUpdatePayload.primaryUserEmailId,
        );

        if (!updatePrimaryEmailResult.success) {
            console.log(
                '[HANDLER] Failed to update primary email:',
                updatePrimaryEmailResult.error,
            );
            return requestContext.json({ error: updatePrimaryEmailResult.error }, 400);
        }

        console.log('[HANDLER] Primary email updated successfully for user:', authenticatedUser.id);
        return requestContext.json(updatePrimaryEmailResult.data);
    } catch (updatePrimaryEmailError) {
        console.error('Error updating primary email:', updatePrimaryEmailError);
        return requestContext.json({ error: 'Failed to update primary email' }, 500);
    }
}

/**
 * Handle PATCH request to update primary account
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePrimaryAccount(requestContext: Context) {
    console.log('[HANDLER] Updating primary account for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const primaryAccountUpdatePayload = await requestContext.req.json();

        if (primaryAccountUpdatePayload.primaryAccountId === undefined) {
            return requestContext.json({ error: 'primaryAccountId is required' }, 400);
        }

        const updatePrimaryAccountResult = await preferenceService.updatePrimaryAccount(
            authenticatedUser.id,
            primaryAccountUpdatePayload.primaryAccountId,
        );

        if (!updatePrimaryAccountResult.success) {
            console.log(
                '[HANDLER] Failed to update primary account:',
                updatePrimaryAccountResult.error,
            );
            return requestContext.json({ error: updatePrimaryAccountResult.error }, 400);
        }

        console.log(
            '[HANDLER] Primary account updated successfully for user:',
            authenticatedUser.id,
        );
        return requestContext.json(updatePrimaryAccountResult.data);
    } catch (updatePrimaryAccountError) {
        console.error('Error updating primary account:', updatePrimaryAccountError);
        return requestContext.json({ error: 'Failed to update primary account' }, 500);
    }
}

/**
 * Handle GET request to fetch available primary options
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with primary options or error message
 */
export async function handleGetPrimaryOptions(requestContext: Context) {
    console.log('[HANDLER] Getting primary options for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const primaryOptionsResult = await preferenceService.getPrimaryOptions(
            authenticatedUser.id,
        );

        if (!primaryOptionsResult.success) {
            console.log('[HANDLER] Failed to get primary options:', primaryOptionsResult.error);
            return requestContext.json({ error: primaryOptionsResult.error }, 500);
        }

        console.log('[HANDLER] Primary options retrieved successfully');
        return requestContext.json(primaryOptionsResult.data);
    } catch (fetchPrimaryOptionsError) {
        console.error('[HANDLER] Error fetching primary options:', fetchPrimaryOptionsError);
        return requestContext.json({ error: 'Failed to fetch primary options' }, 500);
    }
}
