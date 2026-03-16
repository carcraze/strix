import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Starter", price: 149, description: "Essential security for early-stage teams",
        features: ["3 scans/month", "1 domain", "3 repos", "2 users", "API & web app pentesting", "Auto-fix PRs"],
        cta: "Get Started Now", href: "/sign-up", highlight: false,
    },
    {
        name: "Growth", price: 399, description: "Unlimited scanning and continuous monitoring",
        features: ["Unlimited scans", "5 domains", "15 repos", "5 users", "Everything in Starter", "Attack surface monitoring", "Scheduled pentesting"],
        cta: "Get Started Now", href: "/sign-up", highlight: true, badge: "Most Popular",
    },
];

export function Pricing() {
    return (
        <section className="py-24 px-6" id="pricing">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-syne font-bold text-white mb-4">Simple, transparent pricing</h2>
                    <p className="text-[#666]">Start free. Scale as you grow.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {plans.map(p => (
                        <div key={p.name} className={`relative rounded-2xl p-8 border flex flex-col ${p.highlight ? "border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5" : "border-white/10 bg-white/[0.02]"}`}>
                            {p.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-cyan)] text-black text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                                    {p.badge}
                                </div>
                            )}
                            <div className="mb-6">
                                <div className="text-sm font-bold uppercase tracking-widest text-[#555] mb-2">{p.name}</div>
                                <div className="flex items-end gap-1 mb-2">
                                    <span className="text-4xl font-syne font-black text-white">${p.price}</span>
                                    <span className="text-[#555] text-sm mb-1">/mo</span>
                                </div>
                                <p className="text-sm text-[#666]">{p.description}</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#aaa]">
                                        <Check className="h-4 w-4 text-[#00FF88] mt-0.5 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href={p.href} className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${p.highlight ? "bg-[var(--color-cyan)] text-black hover:bg-[var(--color-cyan)]/90" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"}`}>
                                {p.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
