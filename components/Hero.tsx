import VideoTabs from './VideoTabs';
import AnimatedUnderline from './AnimatedUnderline';
import FadeIn from './ui/fade-in';

export default function Hero() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-40 space-y-8 md:space-y-12">
            <div className="text-center max-w-5xl mx-auto">
                <FadeIn delay={0.2}>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-lora">
                        <span className="block">
                            AI Assistant You Can <AnimatedUnderline />
                        </span>
                    </h2>
                </FadeIn>
                <FadeIn delay={0.4}>
                    <p className="text-lg md:text-xl lg:text-2xl mb-8 mt-6 max-w-4xl mx-auto text-gray-600 font-lora">
                        No apps. No logins. Just email.
                    </p>
                </FadeIn>
            </div>

            {/* Tabbed Dashboard Preview */}
            <VideoTabs />
        </main>
    );
}
