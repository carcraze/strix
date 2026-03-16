import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl font-syne font-bold text-white mb-6">
                    Ready to secure your app?
                </h2>
                <p className="text-[#666] text-lg mb-10">Deploy autonomous AI agents to secure your environment.</p>
                <Link href="/sign-up"
                    className="inline-flex items-center gap-2 bg-[var(--color-cyan)] text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--color-cyan)]/90 transition-all shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                    Get Started Now <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
}
