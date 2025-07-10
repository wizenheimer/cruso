import React from 'react';

interface EmailIconProps {
    className?: string;
}

export const EmailIcon: React.FC<EmailIconProps> = ({ className = '' }) => {
    return <img src="/images/icons/microsoft-outlook.svg" alt="Outlook" className={className} />;
};
