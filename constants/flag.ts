/**
 * Feature flags and fallback values
 */

import { DEFAULT_SMALL_LANGUAGE_MODEL, DEFAULT_LARGE_LANGUAGE_MODEL } from './model';

// ================================
// Email Drafting Agent Fallbacks
// ================================

/**
 * Default email formatting prompt
 */
export const DEFAULT_EMAIL_FORMATTING_PROMPT = `
You are an HTML email formatter. Convert unstructured text into clean HTML while preserving ALL original content exactly.

Rules:
- Use only: <p>, <br>, <strong>, <em>
- Keep formatting minimal - no colors, complex layouts, or fancy styling
- Never add, remove, or change any original content
- Maintain the original voice and tone exactly
- Use validateEmailHTMLTool to ensure valid output
- Return only the HTML content, no additional text or explanations.

Process: Convert text → Validate HTML → Return clean HTML that preserves everything.
`;

/**
 * Default allowed tools for email drafting agent
 */
export const DEFAULT_EMAIL_DRAFTING_TOOLS = ['validateEmailHTMLTool'];

/**
 * Default model configuration for email drafting agent
 */
export const DEFAULT_EMAIL_DRAFTING_MODEL = {
    model: DEFAULT_SMALL_LANGUAGE_MODEL,
    provider: 'openai' as const,
};

// ================================
// First Person Scheduling Agent Fallbacks
// ================================

/**
 * Default scheduling prompt
 */
export const DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT = `You are cruso, a seasoned executive assistant specializing in calendar management and scheduling. Your primary objective is to manage calendars on behalf of the user, handling scheduling, rescheduling, availability checks, conflict resolution, and preference management with minimal back-and-forth to ensure task completion.`;

/**
 * Default allowed tools for first person scheduling agent
 */
export const DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS = [
    'createEvent',
    'modifyEvent',
    'cancelEvent',
    'viewCalendarEvents',
    'searchCalendarEvents',
    'checkBusyStatus',
    'findBookableSlots',
    'getSchedulingDefaults',
    'updateSchedulingDefaults',
    'initiateReschedulingOverEmailWithHostAndAttendees',
    'initiateSchedulingOverEmailWithHostAndAttendees',
];

/**
 * Default model configuration for first person scheduling agent
 */
export const DEFAULT_FIRST_PERSON_SCHEDULING_MODEL = {
    model: DEFAULT_LARGE_LANGUAGE_MODEL,
    provider: 'openai' as const,
};

// ================================
// Third Person Scheduling Agent Fallbacks
// ================================

/**
 * Default third-party scheduling prompt
 */
export const DEFAULT_THIRD_PERSON_SCHEDULING_PROMPT = `You are cruso, a seasoned executive assistant specializing in scheduling negotiations with external parties. Your primary objective is to facilitate scheduling agreements between your executive and third parties, suggesting slots, performing availability checks, handling counteroffers, constraint management, and relationship preservation with minimal back-and-forth to ensure successful booking.`;

/**
 * Default allowed tools for third person scheduling agent
 */
export const DEFAULT_THIRD_PERSON_SCHEDULING_TOOLS = [
    'createEvent',
    'modifyEvent',
    'findBookableSlots',
    'getSchedulingDefaults',
];

/**
 * Default model configuration for third person scheduling agent
 */
export const DEFAULT_THIRD_PERSON_SCHEDULING_MODEL = {
    model: DEFAULT_LARGE_LANGUAGE_MODEL,
    provider: 'openai' as const,
};
