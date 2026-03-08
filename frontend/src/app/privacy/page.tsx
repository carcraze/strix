export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-[var(--color-cyan)]/30 selection:text-[var(--color-cyan)]">
            <div className="max-w-4xl mx-auto px-6 py-24 selection:bg-[var(--color-cyan)]/30">
                {/* Header Section */}
                <div className="mb-16 border-b border-white/10 pb-12">
                    <h1 className="text-5xl font-syne font-bold mb-6 tracking-tight text-white">
                        Privacy Policy
                    </h1>
                    <div className="flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[#666]">
                        <p>Effective Date: <span className="text-white">March 9, 2026</span></p>
                        <p>Version: <span className="text-white">1.3 (Public Release)</span></p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="prose prose-invert prose-sm max-w-none space-y-12 text-[#888] font-body leading-relaxed">
                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">01.</span> INTRODUCTION & SCOPE
                        </h2>
                        <p>
                            Moyopal Ltd (trading as &quot;Zentinel&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, and protect personal data when you use the Zentinel platform, APIs, and remediation tools (the &quot;Service&quot;).
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">02.</span> DATA CONTROLLER
                        </h2>
                        <div className="space-y-2 p-6 bg-white/5 border border-white/10 rounded-xl font-mono text-xs tracking-widest leading-loose">
                            <p className="text-white">Moyopal Ltd</p>
                            <p>Company Number: 16288400</p>
                            <p>Registered Office: England and Wales</p>
                            <p>Contact: <a href="mailto:legal@moyopal.io" className="text-[var(--color-cyan)] hover:underline">legal@moyopal.io</a></p>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">03.</span> DATA WE COLLECT
                        </h2>
                        <ul className="space-y-4 list-none pl-0">
                            <li className="grid md:grid-cols-[160px_1fr] gap-4">
                                <span className="text-white font-bold uppercase tracking-widest text-[10px]">Account Data</span>
                                <span>Name, business email, job title, and authentication credentials (via WorkOS or Google OAuth).</span>
                            </li>
                            <li className="grid md:grid-cols-[160px_1fr] gap-4">
                                <span className="text-white font-bold uppercase tracking-widest text-[10px]">Billing Data</span>
                                <span>We use third-party processors (Dodo Payments). We do not store full credit card numbers on our servers.</span>
                            </li>
                            <li className="grid md:grid-cols-[160px_1fr] gap-4">
                                <span className="text-white font-bold uppercase tracking-widest text-[10px]">Usage Data</span>
                                <span>IP addresses, browser types, and interaction logs with our autonomous agents to ensure service stability and security.</span>
                            </li>
                            <li className="grid md:grid-cols-[160px_1fr] gap-4">
                                <span className="text-white font-bold uppercase tracking-widest text-[10px]">Scan Metadata</span>
                                <span>Domains and IP ranges submitted for testing.</span>
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">04.</span> HOW WE USE YOUR DATA
                        </h2>
                        <div className="space-y-4">
                            <p>We process your data to:</p>
                            <ul className="space-y-2 list-disc pl-5">
                                <li>Provide and maintain the Service (Contractual Necessity).</li>
                                <li>Prevent fraud and unauthorized &quot;black-hat&quot; scanning (Legitimate Interest).</li>
                            </ul>
                            <div className="p-6 bg-[var(--color-cyan)]/5 border border-[var(--color-cyan)]/20 rounded-2xl">
                                <p><strong className="text-white uppercase tracking-widest text-[10px] block mb-2">AI Improvement & Machine Learning</strong></p>
                                <p>We use De-identified and Aggregated Data to train our machine learning models and improve the reasoning capabilities of our autonomous security agents. This data is stripped of all identifiers and cannot be linked back to you or your target systems.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">05.</span> DATA SHARING & SUB-PROCESSORS
                        </h2>
                        <p>We never sell your personal data. We share data only with essential sub-processors:</p>
                        <ul className="space-y-3 list-none pl-0">
                            <li className="flex gap-4"><span className="text-white font-bold min-w-[120px]">Infrastructure</span> <span>AWS / Supabase (Encrypted storage).</span></li>
                            <li className="flex gap-4"><span className="text-white font-bold min-w-[120px]">AI Processing</span> <span>Google Cloud Vertex AI (Processing of scan telemetry—no PII shared).</span></li>
                            <li className="flex gap-4"><span className="text-white font-bold min-w-[120px]">Communication</span> <span>AWS SES (Transactional emails).</span></li>
                        </ul>
                    </section>

                    <section className="space-y-6 p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">06.</span> SECURITY SCAN DATA PROTECTIONS
                        </h2>
                        <p className="italic text-white font-medium mb-6">As a security company, we apply &quot;Zero Trust&quot; principles to your scan results:</p>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <p className="text-white font-bold uppercase tracking-widest text-[10px]">Isolation</p>
                                <p className="text-xs">All vulnerability findings are stored with Row-Level Security (RLS).</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-bold uppercase tracking-widest text-[10px]">Encryption</p>
                                <p className="text-xs">All data is encrypted at rest (AES-256) and in transit (TLS 1.3).</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-bold uppercase tracking-widest text-[10px]">Access</p>
                                <p className="text-xs">Zentinel employees cannot access your results unless authorized for support.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">07.</span> YOUR RIGHTS (UK GDPR / GDPR / CCPA)
                        </h2>
                        <p>Depending on your location, you have the right to:</p>
                        <ul className="space-y-3 list-disc pl-5">
                            <li><strong className="text-white">Access & Export:</strong> Request a copy of your data in JSON format.</li>
                            <li><strong className="text-white">Deletion:</strong> Request that we &quot;forget&quot; your account and associated logs.</li>
                            <li><strong className="text-white">Opt-Out:</strong> Object to the processing of your data for ML training (where de-identification is not possible).</li>
                        </ul>
                        <p>To exercise these rights, email <a href="mailto:privacy@moyopal.io" className="text-[var(--color-cyan)] hover:underline">privacy@moyopal.io</a>.</p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">08.</span> DATA RETENTION
                        </h2>
                        <div className="space-y-4">
                            <p><strong className="text-white uppercase tracking-widest text-[10px] block mb-2">Account & Scan Data</strong></p>
                            <p>Account Data is retained for the duration of your active subscription. Scan Data is retained for the duration of your subscription plus a 30-day grace period for export. After 30 days of account termination, scan data is cryptographically erased.</p>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">09.</span> UK & EEA-SPECIFIC DISCLOSURES
                        </h2>
                        <p>
                            For users in the UK and EEA, we process data in accordance with the UK GDPR and EU GDPR. Where data is transferred outside the UK or EEA, we utilize Standard Contractual Clauses (SCCs) or other valid transfer mechanisms to ensure a level of protection equivalent to local laws.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">10.</span> CALIFORNIA-SPECIFIC DISCLOSURES (CCPA)
                        </h2>
                        <p>
                            We do not &quot;Sell&quot; or &quot;Share&quot; personal information for cross-context behavioral advertising. We limit the use of &quot;Sensitive Personal Information&quot; to that which is necessary to perform the Service.
                        </p>
                    </section>

                    <section className="space-y-6 border-t border-white/10 pt-12">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="text-[var(--color-cyan)] font-mono text-sm leading-none">11.</span> CHANGES TO THIS POLICY
                        </h2>
                        <p>
                            We will notify you of material changes via your registered email address at least 30 days prior to the effective date.
                        </p>
                    </section>

                    <section className="space-y-8 pb-12">
                        <h2 className="text-xl font-syne font-bold text-white tracking-tight">
                            12. CONTACT & SUPERVISORY AUTHORITY
                        </h2>
                        <div className="font-mono text-xs tracking-[0.2em] leading-loose space-y-4 uppercase">
                            <p>For privacy inquiries or to report a data concern:</p>
                            <a href="mailto:legal@moyopal.io" className="text-white hover:text-[var(--color-cyan)] transition-colors border-b border-[var(--color-cyan)]/30 pb-1 inline-block">legal@moyopal.io</a>

                            <p className="text-[#555] mt-12">
                                If you are located in the UK, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) (ico.org.uk). If you are in the EEA, you may contact your local Data Protection Authority.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
