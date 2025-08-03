'use client';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-xl mb-8">
                        We take user privacy very seriously & hence put every effort to keep things
                        safe & secure for you!
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
                    <p>
                        At Cruso, we are committed to protecting your privacy and personal
                        information. This Privacy Policy explains how we collect, use, disclose, and
                        safeguard your information when you use our AI assistant platform.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Application and Scope</h2>
                    <p>
                        This Privacy Policy applies to all personal information that Cruso collects,
                        uses, and discloses in the course of providing our services. This includes
                        information collected through our website, platform, and any other
                        interactions with our services.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Definition of Personal Information
                    </h2>
                    <p>
                        Personal information means any information about an identifiable individual,
                        including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Name and contact information</li>
                        <li>Account credentials</li>
                        <li>Usage data and analytics</li>
                        <li>Email conversations and AI interactions</li>
                        <li>Communication preferences</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Collection and Use of Personal Information
                    </h2>
                    <p>We collect and use personal information for the following purposes:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>To provide and maintain our services</li>
                        <li>To process your transactions</li>
                        <li>To send you important updates and notifications</li>
                        <li>To improve our services and user experience</li>
                        <li>To comply with legal obligations</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Security of Personal Information
                    </h2>
                    <p>
                        We implement appropriate technical and organizational measures to protect
                        your personal information, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Encryption of data in transit and at rest</li>
                        <li>Regular security assessments and updates</li>
                        <li>Access controls and authentication</li>
                        <li>Secure data storage and backup procedures</li>
                        <li>Employee training on data protection</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Data Rights</h2>
                    <p>Under applicable privacy laws, you have the right to:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Access your personal information</li>
                        <li>Correct inaccurate information</li>
                        <li>Request deletion of your information</li>
                        <li>Object to processing of your information</li>
                        <li>Data portability</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy or our data practices,
                        please contact us at nick.roy@cruso.app.
                    </p>

                    <div className="mt-8 pt-8 border-t">
                        <p className="text-sm text-gray-600">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
