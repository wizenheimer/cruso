import Image from 'next/image';

const logos = [
    { src: '/images/logos/Airtable.svg', alt: 'Airtable Logo' },
    { src: '/images/logos/Box.svg', alt: 'Box Logo' },
    { src: '/images/logos/Drive.svg', alt: 'Google Drive Logo' },
    { src: '/images/logos/Dropbox.svg', alt: 'Dropbox Logo' },
    { src: '/images/logos/Gmail.svg', alt: 'Gmail Logo' },
    { src: '/images/logos/Hubspot.png', alt: 'HubSpot Logo' },
    { src: '/images/logos/Meet.svg', alt: 'Google Meet Logo' },
    { src: '/images/logos/Notion.svg', alt: 'Notion Logo' },
    { src: '/images/logos/Outlook.svg', alt: 'Outlook Logo' },
    { src: '/images/logos/Slack.svg', alt: 'Slack Logo' },
    { src: '/images/logos/Teams.svg', alt: 'Microsoft Teams Logo' },
    { src: '/images/logos/Zapier.png', alt: 'Zapier Logo' },
    { src: '/images/logos/Zoom.svg', alt: 'Zoom Logo' },
];

function LogoCarousel() {
    return (
        <div className="relative w-full overflow-hidden">
            <div className="flex animate-infinite-scroll">
                {Array.from({ length: 4 }, (_, set) => (
                    <div key={set} className="flex shrink-0">
                        {logos.map((logo, index) => (
                            <div
                                key={`${set}-${index}`}
                                className="w-[120px] flex items-center justify-center px-8 shrink-0"
                            >
                                <Image
                                    src={logo.src}
                                    alt={logo.alt}
                                    width={36}
                                    height={36}
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Integrations() {
    return (
        <section className="pt-0 md:pt-2 pb-16 md:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-12">
                    <p className="text-zinc-600">Seamlessly integrate with your favorite tools</p>
                </div>

                <div className="relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l to-transparent z-10"></div>

                    {/* Logo Carousel */}
                    <LogoCarousel />
                </div>
            </div>
        </section>
    );
}
