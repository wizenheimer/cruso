import React from 'react';

interface GoogleCalendarIconProps {
    className?: string;
}

export const GoogleCalendarIcon: React.FC<GoogleCalendarIconProps> = ({ className = '' }) => {
    return (
        <img src="/images/icons/google-calendar.svg" alt="Google Calendar" className={className} />
    );
};
