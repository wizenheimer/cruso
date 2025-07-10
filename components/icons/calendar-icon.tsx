import React from 'react';
import Image from 'next/image';

interface GoogleCalendarIconProps {
    className?: string;
}

export const GoogleCalendarIcon: React.FC<GoogleCalendarIconProps> = ({ className = '' }) => {
    return (
        <Image
            src="/images/icons/google-calendar.svg"
            alt="Google Calendar"
            className={className}
            width={24}
            height={24}
        />
    );
};
