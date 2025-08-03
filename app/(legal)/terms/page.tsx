'use client';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-xl mb-8">
                        We take user privacy very seriously & hence put every effort to keep things
                        safe & secure for you!
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Terms of Service</h2>
                    <p>
                        These terms of service (the &ldquo;General Terms&rdquo;) govern the use of,
                        and the subscription to, the Website and/or the Cruso Platform provided by
                        Cruso. By accessing the Website and/or the Cruso Platform or by the Parties
                        signing or accepting the present agreement, you agree to the General Terms
                        on behalf of yourself as a User and/or, as the case may be, on behalf of the
                        organisation that you represent (&ldquo;Customer&rdquo;).
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Definitions</h2>
                    <p>
                        The following capitalized terms shall have the meaning ascribed to them
                        below:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>
                            &ldquo;Customer Data&rdquo; means any content, which may include
                            Personal Information of Users, that Customer or Users submit or transfer
                            to Cruso in conjunction with the Services
                        </li>
                        <li>
                            &ldquo;Effective Date&rdquo; means the first date a User accessed the
                            Website or the Cruso Platform
                        </li>
                        <li>
                            &ldquo;Cruso Platform&rdquo; means the AI assistant platform
                            commercialized by Cruso
                        </li>
                        <li>
                            &ldquo;Personal Information&rdquo; has the meaning set out in Privacy
                            Laws
                        </li>
                        <li>
                            &ldquo;Privacy Laws&rdquo; means all applicable data protection and
                            privacy legislation, regulations and guidance
                        </li>
                        <li>
                            &ldquo;User&rdquo; means any individual to whom Customer provides access
                            to the Cruso Platform
                        </li>
                        <li>
                            &ldquo;Website&rdquo; means the public website available at
                            https://cruso.app
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Access and Use</h2>
                    <p>
                        During the Term, Cruso grants to Customer and its Users the right to access
                        and use the Cruso Platform, and any related services, in accordance with the
                        General Terms (the &ldquo;Services&rdquo;).
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Unacceptable Use</h2>
                    <p>
                        Customer and Users shall not, nor attempt to, nor permit third parties to:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Share non-public features or content with any third party</li>
                        <li>Copy, duplicate, reverse engineer, or create derivative works</li>
                        <li>Send any viruses, worms, or other harmful code</li>
                        <li>Attempt to gain unauthorized access to the Platform</li>
                        <li>
                            Use the Platform in a manner that overburdens or threatens its integrity
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Service Fees and Billing</h2>
                    <p>
                        In consideration for the Services, Customer shall pay Cruso the fees
                        specified on the Website for the subscription term selected by Customer.
                        Customer&apos;s subscription will be automatically renewed unless cancelled
                        before the Renewal Date.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Data and Privacy</h2>
                    <p>
                        Cruso shall store and process Customer Data in accordance with our Privacy
                        Policy. We have implemented technical, organizational and administrative
                        systems to help ensure the security, integrity, availability and
                        confidentiality of Customer Data.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Term and Termination</h2>
                    <p>
                        The General Terms are effective as of the Effective Date and continue until
                        terminated by either party. The General Terms may be terminated:
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>By Customer at any time if it cancels the Services</li>
                        <li>
                            By either party if the other party materially breaches any obligations
                        </li>
                        <li>
                            By Cruso if Customer fails to make any payment within 15 days after
                            notice
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
                    <p>
                        In no event shall a party be liable to the other party for any lost profits,
                        revenues, goodwill, business or data or any consequential, indirect,
                        special, incidental, or punitive damages arising out of or related to the
                        General Terms.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
                    <p>
                        Any questions or complaints regarding these Terms can be addressed by
                        sending an email to nick.roy@cruso.app.
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
