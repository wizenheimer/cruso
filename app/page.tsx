import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Integrations from '../components/Integrations';
import Footer from '../components/Footer';

export default function Page() {
    return (
        <div className="w-full min-h-screen flex flex-col">
            <Navigation />
            <Hero />
            <Integrations />
            <Footer />
        </div>
    );
}
