import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-zinc-800 bg-black text-white mt-24 mx-2 md:mx-4 rounded-t-2xl">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Product Links */}
                    <div className="space-y-4">
                        <div className="text-sm font-medium">Product</div>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/#scheduling"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Scheduling
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#research"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Research
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#monitoring"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Monitoring
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#briefings"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Briefings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#follow-ups"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Follow-ups
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#tracking"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Tracking
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Right Column: Cruso and Legal */}
                    <div className="space-y-8">
                        {/* Cruso Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Cruso</div>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/about"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        About
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link
                                        href="/blog"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Blog
                                    </Link>
                                </li> */}
                                <li>
                                    <a
                                        href="mailto:hey@cruso.dev"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Legal</div>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/privacy"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/terms"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/* Extended Footer with Logo */}
            <div className="bg-black py-2 md:py-4 pb-0 overflow-hidden -mt-16 sm:-mt-48 md:-mt-72">
                <div className="w-full">
                    <div className="flex justify-center transform translate-y-1/2">
                        {'CRUSO'.split('').map((char, index) => (
                            <span
                                key={index}
                                className="text-[8rem] sm:text-[10rem] md:text-[16rem] lg:text-[20rem] xl:text-[24rem] font-bold tracking-tighter text-white inline-block"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
