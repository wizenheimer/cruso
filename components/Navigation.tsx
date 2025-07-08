import Link from 'next/link';

export default function Navigation() {
    return (
        <header className="sticky top-0 z-50 w-full py-4 px-6 md:px-12 flex justify-between items-center backdrop-blur-md">
            <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
                Cruso
            </Link>
            <nav className="hidden md:flex space-x-8"></nav>
            <a href="https://cal.com/nayann/cruso" target="_blank" rel="noopener noreferrer">
                <button className="bg-black text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                    Get Started
                </button>
            </a>
        </header>
    );
}
