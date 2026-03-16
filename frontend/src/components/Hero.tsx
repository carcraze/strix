import Link from "next/link";
import { ArrowRight, Shield, Zap, CheckCircle2 } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-cyan)]/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto px-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 text-[var(--color-cyan)] text-xs font-mono font-bold mb-8 tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
                    AI-Powered Pentesting
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-syne font-black text-white leading-[1.05] tracking-tight mb-6">
                    Real vulnerabilities.<br />
                    <span className="text-[var(--color-cyan)]">Zero false positives.</span>
                </h1>

                <p className="text-lg sm:text-xl text-[#666] max-w-2xl mx-auto mb-10 leading-relaxed">
                    Zentinel runs autonomous pentests 24/7, validates every finding with a real PoC, and writes the fix PR automatically. No security team required.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link href="/sign-up"
                        className="group flex items-center gap-2 bg-[var(--color-cyan)] text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--color-cyan)]/90 transition-all shadow-[0_0_30px_rgba(0,229,255,0.25)] hover:shadow-[0_0_50px_rgba(0,229,255,0.4)]">
                        Get Started Now
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/demo"
                        className="flex items-center gap-2 text-[#888] hover:text-white text-base font-medium transition-colors">
                        View sample report →
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-8 text-sm text-[#555]">
                    {["Pay as you go or Subscribe", "Cancel anytime", "SOC2 compliant"].map(t => (
                        <div key={t} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00FF88]" />
                            {t}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
