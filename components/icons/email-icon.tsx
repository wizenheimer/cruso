import React from 'react';
import Image from 'next/image';

interface EmailIconProps {
    className?: string;
}

export const EmailIcon: React.FC<EmailIconProps> = ({ className = '' }) => {
    return (
        <Image
            src="/images/icons/microsoft-outlook.svg"
            alt="Outlook"
            className={className}
            width={24}
            height={24}
        />
    );
};
