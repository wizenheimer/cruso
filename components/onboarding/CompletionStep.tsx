'use client';

import BoringAvatar from 'boring-avatars';
import { authClient } from '@/lib/auth-client';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/lib/ui-constants';

// User info display component specific to completion step
function UserInfo() {
    const { data: session } = authClient.useSession();

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
