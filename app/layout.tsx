import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://cruso.com'),
    title: {
        default: 'Cruso',
        template: '%s | Cruso',
    },
    description: 'AI Assistant You Can Email',
    openGraph: {
        title: 'Cruso',
        description: 'AI Assistant You Can Email',
        url: 'https://cruso.com',
        siteName: 'Cruso',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Cruso - AI Assistant You Can Email',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cruso',
        description: 'AI Assistant You Can Email',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
