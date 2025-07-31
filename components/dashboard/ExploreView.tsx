'use client';

import type React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Circle,
    Settings,
    ExternalLink,
    Calendar,
    Clock,
    Users,
    Mail,
} from 'lucide-react';

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
    icon: React.ReactNode;
    description?: string;
    tasks: Task[];
    documents?: Array<{
        name: string;
    }>;
    expanded: boolean;
}

export default function ExploreView() {
    const [sections, setSections] = useState<OnboardingSection[]>([
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: <Calendar className="h-4 w-4" />,
            description:
                'Welcome to Cruso, your dedicated AI executive assistant for seamless calendar management. Send your scheduling requests via email and let Cruso handle all the coordination details for you.',
            documents: [
                {
                    name: 'Getting Started Help',
                },
                {
                    name: 'Email Setup Guide',
                },
                {
                    name: 'Calendar Connection',
                },
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
            icon: <Clock className="h-4 w-4" />,
            description:
                'Learn the core scheduling patterns that make working with Cruso effortless. From personal focus time to multi-person coordination, these fundamental commands will become second nature.',
            documents: [
                {
                    name: 'Scheduling Commands',
                },
                {
                    name: 'Multi-Person Meetings',
                },
                {
                    name: 'Email Templates',
                },
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
            icon: <Settings className="h-4 w-4" />,
            description:
                "Discover Cruso's sophisticated capabilities for complex scheduling scenarios. Handle batch operations, coordinate multi-stakeholder meetings, and let Cruso manage the intricate details.",
            documents: [
                {
                    name: 'Advanced Patterns',
                },
                {
                    name: 'Batch Operations',
                },
                {
                    name: 'Email Threads',
                },
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
            icon: <Mail className="h-4 w-4" />,
            description:
                'Experience the natural flow of email-based calendar management with Cruso. Forward requests, coordinate through existing threads, and maintain professional communication effortlessly.',
            documents: [
                {
                    name: 'Email Best Practices',
                },
                {
                    name: 'Professional Communication',
                },
                {
                    name: 'Email Forwarding',
                },
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
            icon: <Users className="h-4 w-4" />,
            description:
                "Transform your calendar into a productivity powerhouse with Cruso's intelligent optimization features. Discover time-blocking strategies, batching techniques, and proactive suggestions that enhance your workflow.",
            documents: [
                {
                    name: 'Calendar Optimization',
                },
                {
                    name: 'Time Blocking',
                },
                {
                    name: 'Productivity Workflows',
                },
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
    ]);

    const toggleSection = (sectionId: string) => {
        setSections(
            sections.map((section) =>
                section.id === sectionId ? { ...section, expanded: !section.expanded } : section,
            ),
        );
    };

    const toggleTask = (sectionId: string, taskId: string) => {
        setSections(
            sections.map((section) =>
                section.id === sectionId
                    ? {
                          ...section,
                          tasks: section.tasks.map((task) =>
                              task.id === taskId ? { ...task, completed: !task.completed } : task,
                          ),
                      }
                    : section,
            ),
        );
    };

    return (
        <div className="space-y-8 md:space-y-12">
            <div className="pt-6">
                <h2 className="text-xl font-semibold text-gray-900">Scheduling</h2>
                <p className="text-sm text-gray-600 mt-1">Explore Scheduling with Cruso</p>
            </div>

            <div className="space-y-4">
                {sections.map((section) => {
                    return (
                        <Card
                            key={section.id}
                            className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-none"
                        >
                            <Collapsible
                                open={section.expanded}
                                onOpenChange={() => toggleSection(section.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {section.expanded ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                                    )}
                                                    {section.icon}
                                                </div>
                                                <CardTitle className="text-sm">
                                                    {section.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0 mt-2">
                                        {section.description && (
                                            <div className="mb-6">
                                                <p className="text-gray-600 leading-relaxed">
                                                    {section.description}
                                                </p>
                                            </div>
                                        )}

                                        {section.documents && (
                                            <div className="mb-6">
                                                <div className="flex gap-4">
                                                    {section.documents.map((doc, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2 rounded-lg border p-3 bg-gray-50"
                                                        >
                                                            <Mail className="h-4 w-4 text-gray-500" />
                                                            <span className="text-xs text-gray-700">
                                                                {doc.name}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {section.tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-start gap-3 p-3 rounded-lg border bg-white"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            toggleTask(section.id, task.id)
                                                        }
                                                        className="mt-0.5"
                                                    >
                                                        {task.completed ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <Circle className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <h4
                                                            className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                                                        >
                                                            {task.title}
                                                        </h4>
                                                        {task.description && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {task.url && (
                                                        <a
                                                            href={task.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <span className="text-xs">Try Now</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
