'use client';

export default function AnimatedUnderline() {
    return (
        <span className="relative">
            Email
            <svg
                className="absolute -bottom-1 left-0 w-full h-3"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
            >
                <path
                    d="M0,6 Q25,0 50,6 T100,6"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: '100',
                        strokeDashoffset: '100',
                        animation: 'draw 1.5s ease-in-out forwards',
                    }}
                />
            </svg>
            <style jsx>{`
                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </span>
    );
}
