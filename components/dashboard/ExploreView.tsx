'use client';

import type React from 'react';

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
import { useExploreStore } from '@/lib/stores/explore';

export default function ExploreView() {
    const { sections, toggleSection, toggleTask } = useExploreStore();

    // Helper function to get icon for each section
    const getSectionIcon = (sectionId: string) => {
        switch (sectionId) {
            case 'getting-started':
                return <Calendar className="h-4 w-4" />;
            case 'basic-scheduling':
                return <Clock className="h-4 w-4" />;
            case 'advanced-coordination':
                return <Settings className="h-4 w-4" />;
            case 'email-integration':
                return <Mail className="h-4 w-4" />;
            case 'optimization-tips':
                return <Users className="h-4 w-4" />;
            default:
                return <Calendar className="h-4 w-4" />;
        }
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
                                                    {getSectionIcon(section.id)}
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
                                                <p className="text-gray-600 leading-relaxed text-sm">
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
