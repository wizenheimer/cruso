import { cn } from '@/lib/utils';

interface CursorProps {
    className?: string;
    color?: string;
}

export default function Cursor({ className, color = 'currentColor' }: CursorProps) {
    return (
        <span
            className={cn(
                'inline-block w-2 h-8 md:h-12 lg:h-16 bg-current animate-pulse',
                className,
            )}
            style={{
                backgroundColor: color,
                animation: 'cursor-blink 1.5s ease-in-out infinite',
            }}
        />
    );
}
