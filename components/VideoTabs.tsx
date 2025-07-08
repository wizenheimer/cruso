'use client';

import { useState } from 'react';
import FadeIn from './ui/fade-in';

export default function VideoTabs() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            title: 'Scheduling',
            videoId: 'vk9D_EH3u9o',
            description: 'Learn how to start using your AI assistant via email',
        },
        {
            title: 'Monitoring',
            videoId: 'HjRdddeqZA4',
            description: 'See how the AI understands context and provides helpful responses',
        },
        {
            title: 'Deal Flow',
            videoId: 'BdILX-0n93Y',
            description: 'Get help with scheduling, reminders, and daily tasks',
        },
        {
            title: 'Research',
            videoId: '_CSwFnwr-ow',
            description: 'Ask questions and get assistance with writing',
        },
    ];

    return (
        <div className="w-full max-w-5xl">
            <FadeIn delay={0.6}>
                {/* Tab Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                activeTab === index
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>
            </FadeIn>

            {/* Tab Content - Fixed all edges and corners */}
            <div className="w-full rounded-lg overflow-hidden shadow-xl bg-white">
                <div className="relative w-full">
                    <div
                        className="w-full rounded-lg overflow-hidden"
                        style={{
                            aspectRatio: '16 / 9',
                            position: 'relative',
                        }}
                    >
                        <iframe
                            key={activeTab}
                            src={`https://www.youtube.com/embed/${tabs[activeTab].videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1`}
                            title={tabs[activeTab].title}
                            className="absolute block"
                            style={{
                                border: '0',
                                outline: '0',
                                margin: '0',
                                padding: '0',
                                width: 'calc(100% + 4px)',
                                height: 'calc(100% + 4px)',
                                left: '-2px',
                                top: '-2px',
                                borderRadius: '8px',
                            }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
