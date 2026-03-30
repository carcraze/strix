"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

import { plans, oneTimeScans } from "@/lib/pricingData";
import { FAQAccordion, pricingFaqs } from "@/components/FAQAccordion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const competitors = [
    { name: "Traditional Pentest", price: "$5K–$30K", per: "per engagement", note: "Once a year · 2–4 week wait", us: false },
    { name: "Basic Automated Scanners", price: "$299", per: "per month", note: "3 domains · 10 repos · scan limits", us: false },
    { name: "Enterprise Scanners", price: "$750+", per: "per month", note: "10 domains · 50 repos", us: false },
    { name: "Standard SAST/SCA Tools", price: "$350–$1,050", per: "per month", note: "SAST/SCA focus · limited pentest depth", us: false },
    { name: "Per-App Scan Platforms", price: "$199+", per: "per app/mo", note: "Per-app pricing · expensive at scale", us: false },
    { name: "Our Growth Plan", price: "$399", per: "per month", note: "Unlimited scans · 5 domains · 15 repos", us: true },
];

// ─────────────────────────────────────────────
// ANIMATED PRICE COMPONENT
// ─────────────────────────────────────────────
export function AnimatedPrice({ was, now, annual, prefix = "$", suffix = "/mo" }: { was: number; now: number; annual: boolean; prefix?: string; suffix?: string }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        setVisible(false);
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, [annual]);

    return (
        <div ref={ref} className="relative">
            {/* WAS price — strikethrough, fades out */}
            <div className={`text-sm font-mono text-[#3a3a3a] mb-1 flex items-center gap-1.5 transition-all duration-300 ${annual ? "opacity-100 translate-y-0 h-5" : "opacity-0 -translate-y-1 h-0 overflow-hidden"}`}>
                <span className="relative">
                    <span className="text-[#2a2a2a]">{prefix}{was}</span>
                    <span className="absolute left-0 right-0 top-1/2 h-px bg-[#ef4444] -translate-y-1/2" />
                </span>
                <span className="bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                    20% OFF
                </span>
            </div>

            {/* NOW price — big number */}
            <div className={`flex items-baseline gap-1 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`}>
                <span className="text-4xl font-bold tracking-tight text-white">
                    {prefix}{now}
                </span>
                <span className="text-xs text-[#555] font-mono">
                    {suffix}
                </span>
            </div>
        </div>
    );
}

export default function PricingPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <div className="min-h-screen bg-[#000000] text-[#ffffff] antialiased selection:bg-[#00E5FF]/30 font-display">
            <Navbar />

            <main className="pt-[72px] pb-24">
                <div className="max-w-6xl mx-auto px-6">
                    {/* ── HERO ── */}
                    <section className="text-center pt-24 pb-16">
                        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] text-[11px] font-mono font-bold uppercase tracking-[0.2em]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                            Transparent Pricing
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-8">
                            Security that scales<br />
                            <span className="text-[#888888]">with your growth.</span>
                        </h1>
                        <p className="text-lg text-[#888888] max-w-xl mx-auto mb-12 leading-relaxed font-body">
                            Continuous security with validated PoCs, zero false positives, and AI AutoFix. Choose the plan that works for you.
                        </p>

                        {/* Toggle */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <div className="inline-flex bg-[#0c0c0c] border border-white/5 rounded-full p-1 gap-1">
                                <button
                                    onClick={() => setAnnual(false)}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!annual ? "bg-white text-black" : "text-[#555] hover:text-[#888]"}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setAnnual(true)}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${annual ? "bg-white text-black" : "text-[#555] hover:text-[#888]"}`}
                                >
                                    Annual
                                </button>
                            </div>
                            <div className={`transition-all duration-300 ${annual ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}`}>
                                <span className="bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-[11px] font-mono font-bold px-4 py-2 rounded-full tracking-wider">
                                    🎉 SAVE 20% ANNUALLY
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ── PLAN CARDS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-32">
                        {plans.map((p) => (
                            <div
                                key={p.key}
                                className={`relative group flex flex-col bg-[#0c0c0c] border rounded-3xl p-8 transition-all hover:-translate-y-1 ${p.highlight ? "border-[#00E5FF]/30 bg-[#030b0d]" : "border-white/5 hover:border-white/10"}`}
                            >
                                {p.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00E5FF] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                                        {p.badge}
                                    </div>
                                )}

                                <div className={`text-[11px] font-mono font-bold uppercase tracking-widest mb-4 ${p.highlight ? "text-[#00E5FF]" : "text-[#444]"}`}>
                                    {p.name}
                                </div>

                                <div className="mb-6 h-[72px]">
                                    {p.monthly ? (
                                        <AnimatedPrice
                                            was={annual ? p.wasAnnual : p.wasMonthly}
                                            now={annual ? p.annual : p.monthly}
                                            annual={annual}
                                        />
                                    ) : (
                                        <div>
                                            <div className="text-4xl font-bold tracking-tight text-white">Custom</div>
                                            <div className="text-xs text-[#444] font-mono mt-1">Negotiated annually</div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-[#888] mb-8 leading-relaxed font-body border-b border-white/5 pb-8">
                                    {p.tagline}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mb-8">
                                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col">
                                        <span className="text-[10px] font-mono text-[#333] uppercase">Scans</span>
                                        <span className="text-xs font-bold text-white uppercase">{p.scans}</span>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col">
                                        <span className="text-[10px] font-mono text-[#333] uppercase">Domains</span>
                                        <span className="text-xs font-bold text-white uppercase">{p.domains}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 mb-12 flex-1">
                                    {p.features.map(f => (
                                        <div key={f} className="flex gap-3 text-xs text-[#888] font-body leading-relaxed">
                                            <span className="text-[#00FF88] font-bold">✓</span>
                                            {f}
                                        </div>
                                    ))}
                                    {p.locked && p.locked.map(f => (
                                        <div key={f} className="flex gap-3 text-xs text-[#222] font-body line-through">
                                            <span className="opacity-40">—</span>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={`w-full py-4 rounded-xl text-sm font-black transition-all ${p.solid ? "bg-[#00E5FF] hover:bg-[#2eeeff] text-black" : "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20"}`}
                                    onClick={async (e) => {
                                        if (p.key === 'enterprise') return;
                                        const btn = e.currentTarget;
                                        btn.disabled = true;
                                        const originalText = btn.textContent;
                                        btn.textContent = "Loading...";

                                        const { data: { session } } = await supabase.auth.getSession();

                                        const res = await fetch("/api/billing/create-checkout", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `Bearer ${session?.access_token}`
                                            },
                                            body: JSON.stringify({ productId: annual && p.annual ? p.annualProductId : p.monthlyProductId })
                                        });
                                        if (res.ok) {
                                            const { url } = await res.json();
                                            window.location.href = url;
                                        } else {
                                            btn.disabled = false;
                                            btn.textContent = originalText;
                                            alert("Please sign in or create an organization first");
                                        }
                                    }}
                                >
                                    {p.cta}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* ── ONE-TIME SCANS ── */}
                    <section className="mb-32">
                        <div className="text-center mb-16">
                            <p className="text-xs font-mono text-[#888] uppercase tracking-[0.2em] mb-4">Pay-as-you-go</p>
                            <h2 className="text-4xl font-black text-white tracking-tight">One-time scans</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {oneTimeScans.map(s => (
                                <div key={s.key} className={`flex flex-col bg-[#0c0c0c] border rounded-3xl p-8 transition-all hover:border-white/10 ${s.popular ? "border-[#00FF88]/20" : "border-white/5"}`}>
                                    <div className="text-3xl mb-6">{s.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-4">{s.name}</h3>

                                    <div className="mb-8">
                                        <div className="text-[10px] font-mono text-[#ef4444]/60 line-through mb-1">
                                            Vs ${s.anchor.toLocaleString()} traditional
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-bold ${s.popular ? "text-[#00FF88]" : "text-white"}`}>${s.price}</span>
                                            <span className="text-[10px] font-mono text-[#555]">one-time</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mb-10 flex-1">
                                        {s.includes.map(inc => (
                                            <div key={inc} className="flex items-center gap-3 text-xs text-[#555] font-body">
                                                <span className={`${s.popular ? "text-[#00FF88]" : "text-[#333]"} font-bold`}>✓</span>
                                                {inc}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className={`w-full py-4 rounded-xl text-xs font-bold transition-all ${s.popular ? "bg-[#00FF88] text-black hover:bg-[#34ff9d]" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.textContent = "Loading...";

                                            const { data: { session } } = await supabase.auth.getSession();

                                            const res = await fetch("/api/billing/create-checkout", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    "Authorization": `Bearer ${session?.access_token}`
                                                },
                                                body: JSON.stringify({ productId: s.productId })
                                            });
                                            if (res.ok) {
                                                const { url } = await res.json();
                                                window.location.href = url;
                                            } else {
                                                btn.disabled = false;
                                                btn.textContent = "Buy now →";
                                                alert("Please sign in or create an organization first");
                                            }
                                        }}
                                    >
                                        Buy now →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── COMPETITOR TABLE ── */}
                    <section className="mb-32">
                        <div className="text-center mb-16">
                            <p className="text-xs font-mono text-[#888] uppercase tracking-[0.2em] mb-4">Market comparison</p>
                            <h2 className="text-4xl font-black text-white tracking-tight">Built for value</h2>
                        </div>

                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden">
                            <div className="hidden md:grid grid-cols-4 gap-4 px-8 py-4 border-b border-white/5 text-[10px] font-mono font-bold text-[#333] uppercase">
                                <span>Vendor</span>
                                <span className="text-center">Price</span>
                                <span>Billing</span>
                                <span>Reality check</span>
                            </div>
                            {competitors.map(c => (
                                <div key={c.name} className={`grid grid-cols-1 md:grid-cols-4 gap-4 px-8 py-6 items-center border-b border-white/5 last:border-0 ${c.us ? "bg-[#00E5FF]/5" : ""}`}>
                                    <div className={`font-bold text-sm ${c.us ? "text-[#00E5FF]" : "text-[#888]"}`}>
                                        {c.name}
                                        {c.us && <span className="ml-2 text-[9px] bg-[#00E5FF] text-black px-2 py-0.5 rounded-full uppercase">You</span>}
                                    </div>
                                    <div className={`font-mono text-sm text-center ${c.us ? "text-[#00FF88]" : "text-[#444]"}`}>{c.price}</div>
                                    <div className="text-xs text-[#333]">{c.per}</div>
                                    <div className={`text-xs ${c.us ? "text-[#00FF88]/60 italic" : "text-[#2e2e2e]"}`}>{c.note}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <FAQAccordion items={pricingFaqs} title="Pricing & Pentest FAQs" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
