export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-3xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-syne font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[#888]">
                    <p><strong className="text-white">Last updated:</strong> March 2026</p>
                    <p>By using Zentinel, you agree to these Terms of Service. Please read them carefully.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Use of Service</h2>
                    <p>You may use Zentinel only on systems you own or have explicit written authorization to test. You are solely responsible for ensuring you have permission to run security scans on any target.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Prohibited Use</h2>
                    <p>You may not use Zentinel to attack systems without authorization, violate any laws, or disrupt third-party services.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Limitation of Liability</h2>
                    <p>Zentinel is provided &quot;as is&quot;. We are not liable for any damages resulting from the use of our service.</p>
                    <h2 className="text-xl font-syne font-bold text-white mt-8">Contact</h2>
                    <p>For questions about these terms, contact legal@zentinel.ai</p>
                </div>
            </div>
        </main>
    );
}
