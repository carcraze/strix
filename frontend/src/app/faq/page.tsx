"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, Search, Shield, DollarSign, Wrench, BookOpen, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    generalFaqs,
    pricingFaqs,
    technicalFaqs,
    securityConceptFaqs,
} from "@/components/FAQAccordion";

const DEMO_URL = "https://cal.com/alvin-zentinel/15min";

const categories = [
    {
        id: "general",
        label: "General & Product",
        icon: Shield,
        color: "text-[#00E5FF]",
        borderColor: "border-[#00E5FF]/20",
        bgColor: "bg-[#00E5FF]/5",
        dot: "bg-[#00E5FF]",
        items: generalFaqs,
    },
    {
        id: "pricing",
        label: "Pricing & Plans",
        icon: DollarSign,
        color: "text-[#00FF88]",
        borderColor: "border-[#00FF88]/20",
        bgColor: "bg-[#00FF88]/5",
        dot: "bg-[#00FF88]",
        items: pricingFaqs,
    },
    {
        id: "technical",
        label: "Technical & Integration",
        icon: Wrench,
        color: "text-[#A78BFA]",
        borderColor: "border-[#A78BFA]/20",
        bgColor: "bg-[#A78BFA]/5",
        dot: "bg-[#A78BFA]",
        items: technicalFaqs,
    },
    {
        id: "security",
        label: "Security Concepts",
        icon: BookOpen,
        color: "text-[#F59E0B]",
        borderColor: "border-[#F59E0B]/20",
        bgColor: "bg-[#F59E0B]/5",
        dot: "bg-[#F59E0B]",
        items: securityConceptFaqs,
    },
];

function AccordionItem({
    question,
    answer,
    index,
    openIndex,
    setOpenIndex,
    globalIndex,
}: {
    question: string;
    answer: string;
    index: number;
    openIndex: number | null;
    setOpenIndex: (i: number | null) => void;
    globalIndex: number;
}) {
    const isOpen = openIndex === globalIndex;
    return (
        <div className="bg-[#0c0c0c] border border-[#161616] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#2a2a2a]">
            <button
                onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-white/90 text-base leading-snug">{question}</span>
                <ChevronDown
                    className={`h-5 w-5 text-[#888888] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-white" : ""}`}
                />
            </button>
            <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[700px] opacity-100 pb-6" : "max-h-0 opacity-0"}`}
            >
                <p className="text-[#888888] text-[15px] leading-relaxed">{answer}</p>
            </div>
        </div>
    );
}

export default function FAQPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const allItems = useMemo(
        () =>
            categories.flatMap((cat) =>
                cat.items.map((item) => ({ ...item, categoryId: cat.id, categoryLabel: cat.label }))
            ),
        []
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return allItems.filter((item) => {
            const matchCategory = activeCategory === "all" || item.categoryId === activeCategory;
            const matchSearch =
                !q ||
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q);
            return matchCategory && matchSearch;
        });
    }, [search, activeCategory, allItems]);

    // Group filtered items by category for display
    const grouped = useMemo(() => {
        return categories
            .map((cat) => ({
                ...cat,
                filtered: filtered.filter((f) => f.categoryId === cat.id),
            }))
            .filter((g) => g.filtered.length > 0);
    }, [filtered]);

    // Assign stable global indices for accordion open state
    const globalIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        let i = 0;
        filtered.forEach((item) => {
            map.set(item.question, i++);
        });
        return map;
    }, [filtered]);

    return (
        <div className="min-h-screen bg-[#000000] text-white antialiased">
            {/* SEO structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: allItems.map((item) => ({
                            "@type": "Question",
                            name: item.question,
                            acceptedAnswer: {
                                "@type": "Answer",
                                text: item.answer,
                            },
                        })),
                    }),
                }}
            />
            <Navbar />

            <main className="pt-[72px]">
                {/* ── HERO ── */}
                <section className="text-center pt-24 pb-16 px-6 border-b border-white/5">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] text-[11px] font-mono font-bold uppercase tracking-[0.2em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                        Knowledge Base
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                        Frequently Asked
                        <br />
                        <span className="text-[#888888]">Questions</span>
                    </h1>
                    <p className="text-lg text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed">
                        Everything you need to know about Zentinel — from how AI pentesting works to pricing, integrations, and compliance. Can't find your answer?{" "}
                        <a href="mailto:hi@zentinel.dev" className="text-[#00E5FF] hover:underline">
                            Write to us
                        </a>
                        .
                    </p>

                    {/* Search */}
                    <div className="relative max-w-xl mx-auto mb-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#444]" />
                        <input
                            type="text"
                            placeholder="Search questions... (e.g. &quot;SOC 2&quot;, &quot;pricing&quot;, &quot;GitHub&quot;)"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setOpenIndex(null);
                            }}
                            className="w-full bg-[#0c0c0c] border border-[#222] rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-[#444] focus:outline-none focus:border-[#00E5FF]/40 transition-colors text-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors text-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-[#444] uppercase tracking-widest">
                        <span>{allItems.length} questions answered</span>
                        <span>·</span>
                        <span>4 categories</span>
                        <span>·</span>
                        <span className="text-[#00FF88]">{filtered.length} showing</span>
                    </div>
                </section>

                {/* ── CONTENT ── */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-3 mb-12 justify-center">
                        <button
                            onClick={() => {
                                setActiveCategory("all");
                                setOpenIndex(null);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                activeCategory === "all"
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent border-white/10 text-[#888] hover:border-white/30 hover:text-white"
                            }`}
                        >
                            All ({allItems.length})
                        </button>
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const count = allItems.filter((i) => i.categoryId === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setOpenIndex(null);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                        activeCategory === cat.id
                                            ? `${cat.bgColor} ${cat.borderColor} ${cat.color}`
                                            : "bg-transparent border-white/10 text-[#888] hover:border-white/30 hover:text-white"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {cat.label}
                                    <span className="opacity-60">({count})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Results */}
                    {filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <p className="text-[#444] text-lg mb-4">No results for &quot;{search}&quot;</p>
                            <p className="text-[#333] text-sm mb-8">Try a different keyword or browse all categories.</p>
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setActiveCategory("all");
                                }}
                                className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {grouped.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <div key={cat.id}>
                                        {/* Section header */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${cat.bgColor} border ${cat.borderColor}`}>
                                                <Icon className={`h-4 w-4 ${cat.color}`} />
                                                <span className={`text-xs font-bold font-mono uppercase tracking-wider ${cat.color}`}>
                                                    {cat.label}
                                                </span>
                                            </div>
                                            <div className="h-px flex-1 bg-[#1a1a1a]" />
                                            <span className="text-[11px] font-mono text-[#444]">{cat.filtered.length} questions</span>
                                        </div>

                                        {/* FAQ items */}
                                        <div className="flex flex-col gap-3">
                                            {cat.filtered.map((item, idx) => {
                                                const gi = globalIndexMap.get(item.question) ?? idx;
                                                return (
                                                    <AccordionItem
                                                        key={item.question}
                                                        question={item.question}
                                                        answer={item.answer}
                                                        index={idx}
                                                        openIndex={openIndex}
                                                        setOpenIndex={setOpenIndex}
                                                        globalIndex={gi}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── CTA ── */}
                <section className="border-t border-white/5 py-24 px-6 text-center bg-[#050505]">
                    <p className="text-xs font-mono text-[#444] uppercase tracking-[0.3em] mb-6">Still have questions?</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                        Talk to a security expert
                    </h2>
                    <p className="text-[#888] max-w-lg mx-auto mb-10 leading-relaxed">
                        Book a 15-minute demo and we'll walk you through the platform, run a live scan on your repo, and answer any questions specific to your stack.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={DEMO_URL}
                            className="bg-white text-black px-8 py-4 rounded-2xl text-sm font-black hover:bg-zinc-100 transition-all inline-flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Book a Demo <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="mailto:hi@zentinel.dev"
                            className="bg-transparent border border-white/10 text-[#888] px-8 py-4 rounded-2xl text-sm font-bold hover:border-white/30 hover:text-white transition-all"
                        >
                            Email us instead
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
