export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-3xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-syne font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[#888]">
                    <p><strong className="text-white">Last updated:</strong> March 2026</p>
                    <p>Zentinel (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal information. This policy explains what data we collect and how we use it.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Data We Collect</h2>
                    <p>We collect account information (name, email), usage data (scans run, findings), and payment information (processed securely by our payment provider).</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">How We Use It</h2>
                    <p>We use your data to provide the Zentinel service, send security reports, and improve our product. We never sell your data to third parties.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Contact</h2>
                    <p>For privacy inquiries, contact us at privacy@zentinel.ai</p>
                </div>
            </div>
        </main>
    );
}
