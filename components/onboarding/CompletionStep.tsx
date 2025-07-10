'use client';

interface CompletionStepProps {
    userName: string;
    userEmail: string;
}

const CompletionStep = ({ userName, userEmail }: CompletionStepProps) => {
    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">And you&apos;re in</h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Cruso is now added to your Team
            </p>

            {/* User info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                        {userName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                    </span>
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900">{userName}</div>
                    <div className="text-xs text-gray-500">{userEmail}</div>
                </div>
            </div>
        </>
    );
};

export default CompletionStep;
