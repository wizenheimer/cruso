'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FadeIn from './ui/fade-in';

const tabs = [
    {
        title: 'Scheduling',
        videoId: '4f67BmWlZN0',
        description: 'Learn how to start using your AI assistant via email',
        comingSoon: false,
    },
    {
        title: 'Monitoring',
        videoId: '4f67BmWlZN0',
        description: 'See how the AI understands context and provides helpful responses',
        comingSoon: true,
    },
    {
        title: 'Deal Flow',
        videoId: '4f67BmWlZN0',
        description: 'Get help with scheduling, reminders, and daily tasks',
        comingSoon: true,
    },
    {
        title: 'Research',
        videoId: '4f67BmWlZN0',
        description: 'Ask questions and get assistance with writing',
        comingSoon: true,
    },
];

export default function VideoTabs() {
    const [activeTab, setActiveTab] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // YouTube Player API command helper
    const postMessage = (command: string, args?: unknown[]) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: command,
                    args: args || [],
                }),
                'https://www.youtube.com',
            );
        }
    };

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            postMessage('pauseVideo');
            setIsPlaying(false);
        } else {
            postMessage('playVideo');
            setIsPlaying(true);
        }
    }, [isPlaying]);

    const handleReplay = useCallback(() => {
        postMessage('seekTo', [0, true]);
        postMessage('playVideo');
        setIsPlaying(true);
    }, []);

    const handleVolumeChange = useCallback(
        (newVolume: number) => {
            setVolume(newVolume);
            postMessage('setVolume', [newVolume]);
            if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                postMessage('unMute');
            }
        },
        [isMuted],
    );

    const handleMuteToggle = useCallback(() => {
        if (isMuted) {
            postMessage('unMute');
            setIsMuted(false);
        } else {
            postMessage('mute');
            setIsMuted(true);
        }
    }, [isMuted]);

    const handleFullscreen = useCallback(() => {
        const currentVideoId = tabs[activeTab].videoId;
        const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
        window.open(youtubeUrl, '_blank');
    }, [activeTab]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab switching
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                if (tabIndex < tabs.length && !tabs[tabIndex].comingSoon) {
                    setActiveTab(tabIndex);
                    setIsPlaying(false);
                }
                return;
            }

            // Video controls
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    handleVolumeChange(Math.min(100, volume + 10));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    handleVolumeChange(Math.max(0, volume - 10));
                    break;
                case 'r':
                    e.preventDefault();
                    handleReplay();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [volume, handlePlayPause, handleReplay, handleVolumeChange]);

    // Show/hide controls on mouse movement
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 2000);
    };

    // Format time helper - removed since we're not tracking time

    return (
        <div className="w-full max-w-5xl">
            <FadeIn delay={0.6}>
                {/* Tab Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => !tab.comingSoon && setActiveTab(index)}
                            disabled={tab.comingSoon}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                tab.comingSoon
                                    ? 'bg-white text-gray-500 border border-gray-200 cursor-not-allowed opacity-60'
                                    : activeTab === index
                                      ? 'bg-black text-white shadow-lg'
                                      : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span>{tab.title}</span>
                            {tab.comingSoon ? (
                                <span className="ml-2 text-xs opacity-40">Coming Soon</span>
                            ) : (
                                <span className="ml-2 text-xs opacity-60">Beta</span>
                            )}
                        </button>
                    ))}
                </div>
            </FadeIn>

            {/* Video Container */}
            <div className="video-container w-full rounded-lg overflow-hidden shadow-xl bg-white">
                <div className="relative w-full" onMouseMove={handleMouseMove}>
                    <div
                        className="w-full rounded-lg overflow-hidden bg-gray-900"
                        style={{
                            aspectRatio: '16 / 9',
                            position: 'relative',
                        }}
                    >
                        {/* YouTube iframe - completely covered by overlay */}
                        <iframe
                            ref={iframeRef}
                            key={activeTab}
                            src={`https://www.youtube.com/embed/${tabs[activeTab].videoId}?autoplay=0&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                            title={tabs[activeTab].title}
                            className="absolute block"
                            style={{
                                pointerEvents: 'none', // Disable all interactions with iframe
                                border: '0',
                                outline: '0',
                                margin: '0',
                                padding: '0',
                                width: 'calc(100% + 4px)',
                                height: 'calc(100% + 4px)',
                                left: '-2px',
                                top: '-2px',
                            }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />

                        {/* Custom overlay for all interactions */}
                        <div className="absolute inset-0 z-10">
                            {/* Click area for play/pause */}
                            <div
                                className="absolute inset-0 cursor-pointer"
                                onClick={handlePlayPause}
                            />

                            {/* Play button when paused */}
                            {!isPlaying && showControls && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black bg-opacity-50 rounded-full p-6 backdrop-blur-sm">
                                        <svg
                                            className="w-16 h-16 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Custom controls bar */}
                            <div
                                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                            >
                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Play/Pause */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayPause();
                                            }}
                                            className="text-white hover:text-white/80 transition-colors"
                                            title="Play/Pause (Space)"
                                        >
                                            {isPlaying ? (
                                                <svg
                                                    className="w-8 h-8"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-8 h-8"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Replay */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReplay();
                                            }}
                                            className="text-white hover:text-white/80 transition-colors"
                                            title="Replay (R)"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                            </svg>
                                        </button>

                                        {/* Volume */}
                                        <div className="flex items-center gap-2 group">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMuteToggle();
                                                }}
                                                className="text-white hover:text-white/80 transition-colors"
                                            >
                                                {isMuted || volume === 0 ? (
                                                    <svg
                                                        className="w-6 h-6"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="w-6 h-6"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <div className="w-0 group-hover:w-20 overflow-hidden transition-all duration-300">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={volume}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleVolumeChange(
                                                            parseInt(e.target.value),
                                                        );
                                                    }}
                                                    className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right controls */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFullscreen();
                                            }}
                                            className="text-white hover:text-white/80 transition-colors"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyboard shortcuts guide */}
            <div className="mt-6 text-center space-y-2">
                {/* <div className="text-sm font-medium text-gray-700">Keyboard Shortcuts</div> */}
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded">⌘1-4</kbd> Switch tabs
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> Play/Pause
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd> Replay
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded">↑/↓</kbd> Volume
                    </span>
                </div>
            </div>
        </div>
    );
}
