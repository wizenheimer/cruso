'use client';

import React from 'react';
import Image from 'next/image';

export default function WorldMapOverlay() {
    return (
        <div className="relative w-full h-auto">
            <Image
                src="/images/assets/onboarding/worldmap.svg"
                alt="World Map"
                width={1200}
                height={800}
                className="w-full h-auto block"
                priority
            />
        </div>
    );
}
