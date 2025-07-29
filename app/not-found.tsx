import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import FadeIn from '../components/ui/fade-in';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="w-full min-h-screen flex flex-col">
            <Navigation />
            <main className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-40 space-y-8 md:space-y-12 relative">
                <div className="text-center max-w-4xl mx-auto">
                    <FadeIn delay={0.2}>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 font-lora text-gray-200 group cursor-pointer select-none">
                            <span className="inline-block transition-all duration-300 ease-out hover:scale-110 hover:text-gray-300 hover:drop-shadow-2xl hover:rotate-1">
                                4
                            </span>
                            <span className="inline-block transition-all duration-300 ease-out hover:scale-110 hover:text-gray-300 hover:drop-shadow-2xl hover:-rotate-1">
                                0
                            </span>
                            <span className="inline-block transition-all duration-300 ease-out hover:scale-110 hover:text-gray-300 hover:drop-shadow-2xl hover:rotate-1">
                                4
                            </span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.4}>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-lora">
                            Page Not Found
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.6}>
                        <p className="text-lg md:text-xl lg:text-2xl mb-8 mt-6 max-w-2xl mx-auto text-gray-600 font-lora">
                            We couldn&apos;t find the page you&apos;re looking for
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.8}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/"
                                className="bg-black text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
                            >
                                Go Home
                            </Link>
                            <Link
                                href="/signup"
                                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </main>
            <Footer />
        </div>
    );
}
