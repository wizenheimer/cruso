import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Explore Store
 *
 * Manages the explore view state including task completion status and section expansion.
 * All state is automatically persisted to localStorage and restored on page reload.
 */
interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    url?: string;
}

interface OnboardingSection {
    id: string;
    title: string;
    description?: string;
    tasks: Task[];
    documents?: Array<{
        name: string;
    }>;
    expanded: boolean;
}

interface ExploreState {
    sections: OnboardingSection[];
    toggleSection: (sectionId: string) => void;
    toggleTask: (sectionId: string, taskId: string) => void;
    resetAllTasks: () => void;
    resetSectionTasks: (sectionId: string) => void;
}

export const useExploreStore = create<ExploreState>()(
    persist(
        (set) => ({
            sections: [
                {
                    id: 'getting-started',
                    title: 'Getting Started',
                    description:
                        'Welcome to Cruso, your dedicated AI executive assistant for seamless calendar management. Send your scheduling requests via email and let Cruso handle all the coordination details for you.',
                    documents: [
                        { name: 'Getting Started' },
                        { name: 'Email Setup' },
                        { name: 'Calendar Connection' },
                    ],
                    tasks: [
                        {
                            id: 'send-first-email',
                            title: 'Send your first email to Cruso',
                            description:
                                'Try sending an email to cruso@crusolabs.com with a simple request like "Schedule 30 minutes with myself tomorrow afternoon to review quarterly goals."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=My%20First%20Scheduling%20Request&body=Hi%20Cruso%2C%0A%0ASchedule%2030%20minutes%20with%20myself%20tomorrow%20afternoon%20to%20review%20quarterly%20goals.%0A%0AThanks!',
                        },
                        {
                            id: 'connect-calendar',
                            title: 'Connect your calendar accounts',
                            description:
                                'Link your primary calendar (Google Calendar, Outlook, etc.) so Cruso can check availability and create events.',
                            completed: false,
                            url: 'https://crusolabs.com/dashboard',
                        },
                        {
                            id: 'set-preferences',
                            title: 'Configure your scheduling preferences',
                            description:
                                'Set your working hours, default meeting lengths, and timezone preferences for optimal scheduling.',
                            completed: false,
                            url: 'https://crusolabs.com/dashboard',
                        },
                    ],
                    expanded: true,
                },
                {
                    id: 'basic-scheduling',
                    title: 'Basic Scheduling',
                    description:
                        'Learn the core scheduling patterns that make working with Cruso effortless. From personal focus time to multi-person coordination, these fundamental commands will become second nature.',
                    documents: [
                        { name: 'Scheduling Commands' },
                        { name: 'Multi-Person Meetings' },
                        { name: 'Email Templates' },
                    ],
                    tasks: [
                        {
                            id: 'personal-meeting',
                            title: 'Schedule a personal meeting or focus time',
                            description:
                                'Try scheduling time for yourself: "Block 2 hours Friday morning for strategic planning" or "Schedule 1 hour with myself next week for project review."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Personal%20Meeting%20Request&body=Hi%20Cruso%2C%0A%0ABlock%202%20hours%20Friday%20morning%20for%20strategic%20planning.%0A%0AThanks!',
                        },
                        {
                            id: 'team-meeting',
                            title: 'Coordinate a meeting with multiple attendees',
                            description:
                                'Try multi-person scheduling: "Schedule 45 minutes with the marketing team next week to discuss the Q3 budget."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Team%20Meeting%20Coordination&body=Hi%20Cruso%2C%0A%0ASchedule%2045%20minutes%20with%20the%20marketing%20team%20next%20week%20to%20discuss%20the%20Q3%20budget.%0A%0AThanks!',
                        },
                        {
                            id: 'check-availability',
                            title: 'Check your calendar availability',
                            description:
                                'Try getting calendar briefings and availability checks: "What does my calendar look like tomorrow?" or "When am I free this afternoon?"',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Calendar%20Check&body=Hi%20Cruso%2C%0A%0AWhat%20does%20my%20calendar%20look%20like%20tomorrow%3F%0A%0AThanks!',
                        },
                        {
                            id: 'reschedule-meeting',
                            title: 'Reschedule an existing meeting',
                            description:
                                'Try moving meetings around: "Move my 2 PM client call to Thursday morning" or "Reschedule the team sync to next week."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Reschedule%20Request&body=Hi%20Cruso%2C%0A%0AMove%20my%202%20PM%20client%20call%20to%20Thursday%20morning.%0A%0AThanks!',
                        },
                    ],
                    expanded: false,
                },
                {
                    id: 'advanced-coordination',
                    title: 'Advanced Scheduling',
                    description:
                        "Discover Cruso's sophisticated capabilities for complex scheduling scenarios. Handle batch operations, coordinate multi-stakeholder meetings, and let Cruso manage the intricate details.",
                    documents: [
                        { name: 'Advanced Patterns' },
                        { name: 'Batch Operations' },
                        { name: 'Email Threads' },
                    ],
                    tasks: [
                        {
                            id: 'clear-calendar',
                            title: 'Clear your calendar for focused work',
                            description:
                                'Try clearing time blocks by rescheduling everything: "Clear my calendar this Friday afternoon" or "Free up my morning tomorrow."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Clear%20Calendar%20Request&body=Hi%20Cruso%2C%0A%0AClear%20my%20calendar%20this%20Friday%20afternoon%20so%20I%20can%20focus%20on%20the%20quarterly%20report.%0A%0AThanks!',
                        },
                        {
                            id: 'block-time',
                            title: 'Block calendar time and reschedule conflicts',
                            description:
                                'Try reserving time blocks and handling conflicts automatically: "Block my calendar as \'Deep Work\' from 2-5 PM today and reschedule any conflicts."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Block%20Calendar%20Time&body=Hi%20Cruso%2C%0A%0ABlock%20my%20calendar%20as%20%27Deep%20Work%27%20from%202-5%20PM%20today%20and%20reschedule%20any%20conflicts.%0A%0AThanks!',
                        },
                        {
                            id: 'email-thread-scheduling',
                            title: 'Coordinate complex meetings via email threads',
                            description:
                                'Try letting Cruso handle multi-stakeholder coordination: "Start an email thread to schedule a Q4 planning meeting with the leadership team."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Email%20Thread%20Coordination&body=Hi%20Cruso%2C%0A%0AStart%20an%20email%20thread%20to%20schedule%20a%20Q4%20planning%20meeting%20with%20the%20leadership%20team%20for%20next%20week.%0A%0AThanks!',
                        },
                        {
                            id: 'preference-updates',
                            title: 'Update your scheduling preferences',
                            description:
                                'Try modifying your default settings on the fly: "Change my default meeting length to 45 minutes" or "Update my working hours to 8 AM - 4 PM."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Update%20Preferences&body=Hi%20Cruso%2C%0A%0AChange%20my%20default%20meeting%20length%20to%2045%20minutes%20going%20forward.%0A%0AThanks!',
                        },
                    ],
                    expanded: false,
                },
                {
                    id: 'email-integration',
                    title: 'Email Workflows',
                    description:
                        'Experience the natural flow of email-based calendar management with Cruso. Forward requests, coordinate through existing threads, and maintain professional communication effortlessly.',
                    documents: [
                        { name: 'Workflows' },
                        { name: 'Batch Scheduling' },
                        { name: 'Email Threads' },
                    ],
                    tasks: [
                        {
                            id: 'forward-scheduling-request',
                            title: 'Forward a scheduling email to Cruso',
                            description:
                                'Try forwarding scheduling requests from colleagues. When someone emails asking to meet, simply forward to cruso@crusolabs.com with any additional context.',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Forwarded%20Scheduling%20Request&body=Hi%20Cruso%2C%0A%0A%5BForward%20the%20original%20scheduling%20email%20here%5D%0A%0APlease%20coordinate%20this%20meeting%20request.%0A%0AThanks!',
                        },
                        {
                            id: 'calendar-briefing',
                            title: 'Request daily or weekly calendar briefings',
                            description:
                                'Try getting organized with regular calendar summaries: "Give me a rundown of my week" or "What\'s my schedule looking like today?"',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Calendar%20Briefing%20Request&body=Hi%20Cruso%2C%0A%0AGive%20me%20a%20rundown%20of%20my%20week%20ahead%20with%20key%20meetings%20highlighted.%0A%0AThanks!',
                        },
                        {
                            id: 'search-meetings',
                            title: 'Search for specific meetings and events',
                            description:
                                'Try finding meetings by keyword or attendee: "Find my meetings with the design team this month" or "Show me all budget-related meetings."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Meeting%20Search&body=Hi%20Cruso%2C%0A%0AFind%20my%20meetings%20with%20the%20design%20team%20this%20month.%0A%0AThanks!',
                        },
                    ],
                    expanded: false,
                },
                {
                    id: 'optimization-tips',
                    title: 'Productivity Tips',
                    description:
                        "Transform your calendar into a productivity powerhouse with Cruso's intelligent optimization features. Discover time-blocking strategies, batching techniques, and proactive suggestions that enhance your workflow.",
                    documents: [
                        { name: 'Calendar Optimization' },
                        { name: 'Time Blocking' },
                        { name: 'Productivity Workflows' },
                    ],
                    tasks: [
                        {
                            id: 'batch-similar-meetings',
                            title: 'Learn to batch similar meetings for efficiency',
                            description:
                                'Try asking Cruso to group similar meetings together: "Schedule all my 1-on-1s for Tuesday morning" or "Batch my client calls for Thursday afternoon."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Batch%20Meeting%20Request&body=Hi%20Cruso%2C%0A%0ASchedule%20all%20my%201-on-1s%20for%20Tuesday%20morning%20to%20create%20better%20flow.%0A%0AThanks!',
                        },
                        {
                            id: 'prep-time-blocks',
                            title: 'Add preparation time before important meetings',
                            description:
                                'Try building in prep time automatically: "Schedule 15 minutes before my board meeting for preparation" or "Add prep blocks before all client calls."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Add%20Prep%20Time&body=Hi%20Cruso%2C%0A%0ASchedule%2015%20minutes%20before%20my%20board%20meeting%20tomorrow%20for%20preparation.%0A%0AThanks!',
                        },
                        {
                            id: 'focus-time-optimization',
                            title: 'Optimize your calendar for deep work and focus',
                            description:
                                'Try creating focused work blocks strategically: "Block 3 hours every morning this week for deep work" or "Protect my Friday afternoons for strategic thinking."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Focus%20Time%20Optimization&body=Hi%20Cruso%2C%0A%0ABlock%203%20hours%20every%20morning%20this%20week%20for%20deep%20work.%20Reschedule%20any%20conflicts.%0A%0AThanks!',
                        },
                        {
                            id: 'follow-up-scheduling',
                            title: 'Automatically schedule follow-ups and check-ins',
                            description:
                                'Try building systematic follow-up workflows: "After my client meeting tomorrow, schedule a 30-minute follow-up for next week" or "Schedule monthly check-ins with my direct reports."',
                            completed: false,
                            url: 'mailto:cruso@crusolabs.com?subject=Follow-up%20Scheduling&body=Hi%20Cruso%2C%0A%0AAfter%20my%20client%20meeting%20tomorrow%2C%20schedule%20a%2030-minute%20follow-up%20for%20next%20week.%0A%0AThanks!',
                        },
                    ],
                    expanded: false,
                },
            ],
            toggleSection: (sectionId: string) =>
                set((state) => ({
                    sections: state.sections.map((section) =>
                        section.id === sectionId
                            ? { ...section, expanded: !section.expanded }
                            : section,
                    ),
                })),
            toggleTask: (sectionId: string, taskId: string) =>
                set((state) => ({
                    sections: state.sections.map((section) =>
                        section.id === sectionId
                            ? {
                                  ...section,
                                  tasks: section.tasks.map((task) =>
                                      task.id === taskId
                                          ? { ...task, completed: !task.completed }
                                          : task,
                                  ),
                              }
                            : section,
                    ),
                })),
            resetAllTasks: () =>
                set((state) => ({
                    sections: state.sections.map((section) => ({
                        ...section,
                        tasks: section.tasks.map((task) => ({ ...task, completed: false })),
                    })),
                })),
            resetSectionTasks: (sectionId: string) =>
                set((state) => ({
                    sections: state.sections.map((section) =>
                        section.id === sectionId
                            ? {
                                  ...section,
                                  tasks: section.tasks.map((task) => ({
                                      ...task,
                                      completed: false,
                                  })),
                              }
                            : section,
                    ),
                })),
        }),
        {
            name: 'explore-tasks',
        },
    ),
);
