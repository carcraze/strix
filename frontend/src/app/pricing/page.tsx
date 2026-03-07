"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

import { plans, oneTimeScans } from "@/lib/pricingData";

const competitors = [
    { name: "Traditional Pentest", price: "$5K–$30K", per: "per engagement", note: "Once a year · 2–4 week wait", us: false },
    { name: "Basic Automated Scanners", price: "$299", per: "per month", note: "3 domains · 10 repos · scan limits", us: false },
    { name: "Enterprise Scanners", price: "$750+", per: "per month", note: "10 domains · 50 repos", us: false },
    { name: "Standard SAST/SCA Tools", price: "$350–$1,050", per: "per month", note: "SAST/SCA focus · limited pentest depth", us: false },
    { name: "Per-App Scan Platforms", price: "$199+", per: "per app/mo", note: "Per-app pricing · expensive at scale", us: false },
    { name: "Our Growth Plan", price: "$399", per: "per month", note: "Unlimited scans · 5 domains · 15 repos", us: true },
];

const faqs = [
    { q: "What counts as a scan?", a: "One scan = one pentest run. A quick blackbox domain check or a full whitebox code + API + domain scan both count as one scan. Growth and Scale have unlimited scans so you never hit a wall mid-month." },
    { q: "Growth says unlimited — is there really no cap?", a: "Truly unlimited. Growth and Scale have no monthly scan limit. We can do this because our scanning infrastructure runs on Google Cloud and is built for cost efficiency. Starter has 3 scans/month to keep the entry price accessible." },
    { q: "What's the difference between Starter's 3 scans and a one-time scan?", a: "Starter gives you 3 scans every month plus the full dashboard — issue tracking, PR reviews, integrations, history. One-time scans are for founders who want a single report without a monthly commitment. Just results, no dashboard." },
    { q: "How are scans powered?", a: "Autonomous AI agents backed by Google Gemini, running on our cloud. Each scan spins up an isolated container, agents actively probe your targets like a real hacker, validate every finding with a proof-of-concept, then the container is destroyed. No code or data is retained." },
    { q: "Can I self-host Zentinel?", a: "No — Zentinel is fully managed. Enterprise customers get dedicated isolated scan infrastructure on our cloud for compliance requirements, but you never manage any infrastructure yourself." },
    { q: "What compliance frameworks are covered?", a: "Growth includes SOC2 and ISO27001. Scale adds HIPAA and PCI DSS. Enterprise supports custom frameworks. All reports are audit-ready PDFs." },
    { q: "Do I need to verify domain ownership before scanning?", a: "Yes, always. DNS TXT record, file upload, or meta tag — your choice. This protects you and prevents unauthorized scanning of domains you don't own." },
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
        <div ref={ref} style={{ position: "relative" }}>
            {/* WAS price — strikethrough, fades out */}
            <div style={{
                fontSize: 14,
                fontFamily: "'DM Mono', monospace",
                color: "#3a3a3a",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: annual ? 1 : 0,
                transform: annual ? "translateY(0)" : "translateY(-4px)",
                transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                height: annual ? 20 : 0,
                overflow: "hidden",
            }}>
                <span style={{ position: "relative", display: "inline-block" }}>
                    <span style={{ color: "#2a2a2a" }}>{prefix}{was}</span>
                    {/* red strikethrough line */}
                    <span style={{
                        position: "absolute",
                        left: 0, right: 0,
                        top: "50%",
                        height: 1.5,
                        background: "#ef4444",
                        transform: "translateY(-50%) scaleX(1)",
                        transformOrigin: "left",
                    }} />
                </span>
                <span style={{
                    background: "#00FF880d",
                    border: "1px solid #00FF8820",
                    color: "#00FF88",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 100,
                    letterSpacing: ".06em",
                }}>20% OFF</span>
            </div>

            {/* NOW price — big number */}
            <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 0,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
            }}>
                <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {prefix}{now}
                </span>
                <span style={{ fontSize: 13, color: "#2e2e2e", fontFamily: "'DM Mono', monospace", paddingBottom: 6, paddingLeft: 4 }}>
                    {suffix}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function PricingPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <div style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        .plan-card{
          background:#070707;border:1px solid #161616;border-radius:16px;
          padding:28px;display:flex;flex-direction:column;position:relative;
          transition:border-color 0.2s,transform 0.2s;
        }
        .plan-card:hover{border-color:#2a2a2a;transform:translateY(-3px)}
        .plan-card.hl{border-color:#00E5FF2a;background:#030b0d}
        .plan-card.hl:hover{border-color:#00E5FF55;transform:translateY(-3px)}

        .plan-badge{
          position:absolute;top:-11px;left:50%;transform:translateX(-50%);
          background:#00E5FF;color:#000;font-size:10px;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;
          padding:3px 14px;border-radius:100px;white-space:nowrap;
        }

        .stat-chip{
          background:#0c0c0c;border:1px solid #161616;border-radius:8px;
          padding:8px 10px;font-size:11px;font-family:'DM Mono',monospace;color:#888;
        }
        .stat-chip .lbl{font-size:10px;color:#333;display:block;margin-bottom:2px}

        .feat{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:#bbb;line-height:1.45}
        .feat .ck{color:#00FF88;font-size:11px;margin-top:2px;flex-shrink:0;font-weight:700}
        .feat .lk{color:#222;font-size:11px;margin-top:2px;flex-shrink:0}
        .feat.dim{color:#252525}

        .btn{width:100%;padding:13px;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.15s;margin-top:auto}
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .btn-cyan{background:#00E5FF;color:#000;border:none}
        .btn-cyan:hover{background:#2eeeff}
        .btn-ghost{background:transparent;color:#666;border:1px solid #1e1e1e}
        .btn-ghost:hover{border-color:#333;color:#fff}

        .scan-card{background:#070707;border:1px solid #161616;border-radius:12px;padding:22px;position:relative;transition:all 0.2s;display:flex;flex-direction:column}
        .scan-card:hover{border-color:#2a2a2a;transform:translateY(-3px)}
        .scan-card.pop{border-color:#00FF8826}
        .scan-pop{position:absolute;top:-10px;left:16px;background:#00FF88;color:#000;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px}

        .comp-row{display:grid;grid-template-columns:1.3fr 90px 120px 1fr;gap:12px;align-items:center;padding:14px 18px;font-size:13px;border-bottom:1px solid #0d0d0d}
        .comp-row.us{background:#030b0d;border:1px solid #00E5FF18;border-radius:10px;margin:3px 0}
        .comp-row.us{border-bottom:1px solid #00E5FF18}

        .faq-row{padding:20px 0;border-bottom:1px solid #0d0d0d}

        .toggle-pill{display:inline-flex;background:#0d0d0d;border:1px solid #191919;border-radius:100px;padding:3px;gap:2px}
        .tgl{padding:7px 18px;border-radius:100px;border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;transition:all 0.15s}
        .tgl.on{background:#fff;color:#000}
        .tgl.off{background:transparent;color:#555}
        .tgl.off:hover{color:#888}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.5s ease forwards}

        @media(max-width:960px){.plans-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:640px){.plans-grid,.scans-grid{grid-template-columns:1fr!important}.comp-row{grid-template-columns:1fr 1fr!important;font-size:12px}}
      `}</style>

            <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>

                {/* ── HERO ── */}
                <div style={{ textAlign: "center", padding: "72px 0 64px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#00E5FF0c", border: "1px solid #00E5FF18", borderRadius: 100, padding: "5px 14px", fontSize: 11, color: "#00E5FF", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 24 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5FF", display: "inline-block" }} />
                        Transparent pricing
                    </div>
                    <h1 style={{ fontSize: "clamp(34px,5vw,58px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.06, marginBottom: 16 }}>
                        Security scanning at<br />
                        <span style={{ color: "#00E5FF" }}>half the competition's price</span>
                    </h1>
                    <p style={{ fontSize: 17, color: "#444", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.65 }}>
                        Continuous security with validated PoCs, zero false positives, and auto-fix PRs. Choose the plan that works for you.
                    </p>

                    {/* Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                        <div className="toggle-pill">
                            <button className={`tgl ${!annual ? "on" : "off"}`} onClick={() => setAnnual(false)}>Monthly</button>
                            <button className={`tgl ${annual ? "on" : "off"}`} onClick={() => setAnnual(true)}>Annual</button>
                        </div>
                        <div style={{ overflow: "hidden", maxWidth: annual ? 160 : 0, opacity: annual ? 1 : 0, transition: "max-width 0.35s ease,opacity 0.3s ease", whiteSpace: "nowrap" }}>
                            <span style={{ background: "#00FF880d", border: "1px solid #00FF8820", color: "#00FF88", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 100, letterSpacing: ".06em", display: "inline-block" }}>
                                🎉 SAVE 20% ANNUALLY
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── PLAN CARDS ── */}
                <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 96 }}>
                    {plans.map((p, i) => (
                        <div
                            key={p.key}
                            className={`plan-card ${p.highlight ? "hl" : ""} fade-up`}
                            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: "both" }}
                        >
                            {p.badge && <div className="plan-badge">{p.badge}</div>}

                            {/* Plan name */}
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: p.highlight ? "#00E5FF" : "#333", marginBottom: 12 }}>
                                {p.name}
                            </div>

                            {/* Price with animation */}
                            {p.monthly ? (
                                <AnimatedPrice
                                    was={annual ? p.wasAnnual : p.wasMonthly}
                                    now={annual ? p.annual : p.monthly}
                                    annual={annual}
                                />
                            ) : (
                                <div>
                                    <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, paddingTop: 4 }}>Custom</div>
                                    <div style={{ fontSize: 12, color: "#2c2c2c", fontFamily: "'DM Mono',monospace", margin: "4px 0 4px" }}>$2,000–$5,000 / month</div>
                                    <div style={{ fontSize: 11, color: "#00FF8844", fontFamily: "'DM Mono',monospace", marginBottom: 0 }}>negotiated annually</div>
                                </div>
                            )}

                            {/* Annual save callout */}
                            {p.annual && annual && (
                                <div style={{ fontSize: 11, color: "#00FF8866", fontFamily: "'DM Mono',monospace", margin: "6px 0 0", opacity: annual ? 1 : 0, transition: "opacity 0.3s ease" }}>
                                    saves ${p.annualSave}/yr
                                </div>
                            )}

                            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5, margin: "14px 0 18px", paddingBottom: 18, borderBottom: "1px solid #111" }}>
                                {p.tagline}
                            </div>

                            {/* Stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                                {[["Scans", p.scans], ["Overage", p.overage], ["Domains", p.domains], ["Repos", p.repos]].map(([lbl, val]) => (
                                    <div key={lbl} className="stat-chip">
                                        <span className="lbl">{lbl}</span>{val}
                                    </div>
                                ))}
                            </div>

                            {/* Users */}
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0c0c0c", border: "1px solid #161616", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#555", fontFamily: "'DM Mono',monospace", marginBottom: 20 }}>
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#555" strokeWidth="1.2" /><path d="M1.5 10.5C1.5 8.567 3.567 7 6 7s4.5 1.567 4.5 3.5" stroke="#555" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                {p.users}
                            </div>

                            {/* Features */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
                                {p.features.map(f => (
                                    <div key={f} className="feat"><span className="ck">✓</span>{f}</div>
                                ))}
                                {p.locked && p.locked.map(f => (
                                    <div key={f} className="feat dim"><span className="lk">—</span>{f}</div>
                                ))}
                            </div>

                            <button
                                className={`btn ${p.solid ? "btn-cyan" : "btn-ghost"}`}
                                onClick={async (e) => {
                                    if (p.key === 'enterprise') return; // Handled differently typically (mailto: or form)
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
                                        body: JSON.stringify({ productId: annual && p.annual ? p.annualProductId : p.monthlyProductId })
                                    });
                                    if (res.ok) {
                                        const { url } = await res.json();
                                        window.location.href = url;
                                    } else {
                                        btn.disabled = false;
                                        btn.textContent = p.cta;
                                        alert("Please sign in or create an organization first");
                                    }
                                }}
                            >
                                {p.cta}
                            </button>
                            {p.monthly && (
                                <a
                                    href="/demo"
                                    style={{ display: "block", textAlign: "center", fontSize: 11, color: "#888", marginTop: 10, textDecoration: "none" }}
                                    onMouseOver={(e) => e.currentTarget.style.color = "#fff"}
                                    onMouseOut={(e) => e.currentTarget.style.color = "#888"}
                                >
                                    View sample report →
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── ONE-TIME SCANS ── */}
                <div style={{ marginBottom: 96 }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2e2e2e", marginBottom: 10 }}>Pay-as-you-go</div>
                        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 10 }}>One-time scans</h2>
                        <p style={{ color: "#3d3d3d", fontSize: 14, maxWidth: 420, margin: "0 auto" }}>
                            Not ready for a subscription? One scan, full report, no commitment.
                        </p>
                    </div>

                    <div className="scans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                        {oneTimeScans.map(s => (
                            <div key={s.key} className={`scan-card ${s.popular ? "pop" : ""}`}>
                                {s.popular && <div className="scan-pop">Most popular</div>}
                                <div style={{ fontSize: 26, marginBottom: 12 }}>{s.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, letterSpacing: "-0.02em" }}>{s.name}</div>

                                {/* Anchor price + actual price */}
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#2a2a2a", position: "relative", display: "inline-block" }}>
                                            vs ${s.anchor.toLocaleString()} traditional
                                            <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#ef444477", transform: "translateY(-50%)" }} />
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                                        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: s.popular ? "#00FF88" : "#fff" }}>${s.price}</span>
                                        <span style={{ fontSize: 12, color: "#333", fontFamily: "'DM Mono',monospace", paddingBottom: 5 }}> one-time</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: s.popular ? "#00FF8855" : "#252525", fontFamily: "'DM Mono',monospace" }}>
                                        {Math.round((1 - s.price / s.anchor) * 100)}% less than manual pentest
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, color: "#3a3a3a", lineHeight: 1.55, marginBottom: 12 }}>{s.desc}</div>
                                <div style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "'DM Mono',monospace", marginBottom: 16 }}>⏱ {s.time}</div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, flex: 1 }}>
                                    {s.includes.map(inc => (
                                        <div key={inc} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#555" }}>
                                            <span style={{ color: s.popular ? "#00FF88" : "#333", fontSize: 10, fontWeight: 700 }}>✓</span>{inc}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    style={{ width: "100%", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: s.popular ? "#00FF88" : "transparent", color: s.popular ? "#000" : "#555", border: s.popular ? "none" : "1px solid #1e1e1e", transition: "all 0.15s", marginTop: "auto" }}
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
                </div>

                {/* ── COMPETITOR TABLE ── */}
                <div style={{ marginBottom: 96 }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2e2e2e", marginBottom: 10 }}>Market comparison</div>
                        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 10 }}>
                            The market charges more, delivers less
                        </h2>
                        <p style={{ color: "#3d3d3d", fontSize: 14 }}>
                            Our Growth Plan gives you more value and better coverage than alternative solutions.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 90px 120px 1fr", gap: 12, padding: "0 18px 12px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#252525" }}>
                        <span>Vendor</span><span>Price</span><span>Billing</span><span>Reality check</span>
                    </div>
                    {competitors.map(c => (
                        <div key={c.name} className={`comp-row ${c.us ? "us" : ""}`}>
                            <div style={{ fontWeight: c.us ? 700 : 500, color: c.us ? "#00E5FF" : "#666", display: "flex", alignItems: "center", gap: 8 }}>
                                {c.name}
                                {c.us && <span style={{ background: "#00E5FF", color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 100, letterSpacing: ".08em" }}>YOU</span>}
                            </div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: c.us ? "#00FF88" : "#444", fontWeight: c.us ? 700 : 400 }}>{c.price}</div>
                            <div style={{ fontSize: 12, color: "#333" }}>{c.per}</div>
                            <div style={{ fontSize: 12, color: c.us ? "#00FF8877" : "#2e2e2e" }}>{c.note}</div>
                        </div>
                    ))}
                </div>



            </div>
        </div>
    );
}
