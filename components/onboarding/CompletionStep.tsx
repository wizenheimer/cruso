'use client';

import { useEffect, useRef } from 'react';
import BoringAvatar from 'boring-avatars';
import confetti from 'canvas-confetti';
import { authClient } from '@/client/auth';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';

// User info display component specific to completion step
function UserInfo() {
    const { data: session, isPending } = authClient.useSession();
    const hasTriggeredConfetti = useRef(false);

    // Trigger confetti when loading completes
    useEffect(() => {
        if (!isPending && !hasTriggeredConfetti.current && session?.user) {
            hasTriggeredConfetti.current = true;

            // Fire confetti from multiple angles for a more dynamic effect
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });

            // Add a second burst after a short delay
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                });
            }, 150);

            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                });
            }, 300);
        }
    }, [isPending, session?.user]);

    // Show loading skeleton while session is loading
    if (isPending) {
        return (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
            </div>
        );
    }

    const userName = session?.user?.name || 'Anonymous User';
    const userEmail = session?.user?.email || 'user@example.com';

    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <BoringAvatar
                name={userName}
                colors={AVATAR_COLORS}
                variant={AVATAR_VARIANT}
                size={40}
            />
            <div>
                <div className="text-sm font-medium text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
        </div>
    );
}

const CompletionStep = () => {
    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">And you&apos;re in</h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Cruso is now added to your Team
            </p>

            {/* User info */}
            <UserInfo />
        </>
    );
};

export default CompletionStep;
