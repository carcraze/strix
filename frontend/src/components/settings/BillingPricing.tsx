import { useState } from "react";
import { plans, oneTimeScans } from "@/lib/pricingData";
import { AnimatedPrice } from "@/app/pricing/page";
import { supabase } from "@/lib/supabase";

export function BillingPricing() {
    const [annual, setAnnual] = useState(false);

    return (
        <div className="mt-6 flex flex-col gap-10">
            <style>{`
        .billing-plan-card {
          background:#070707;border:1px solid #161616;border-radius:16px;
          padding:24px;display:flex;flex-direction:column;position:relative;
          transition:border-color 0.2s,transform 0.2s;
        }
        .billing-plan-card:hover{border-color:#2a2a2a;transform:translateY(-3px)}
        .billing-plan-card.hl{border-color:#00E5FF2a;background:#030b0d}
        .billing-plan-card.hl:hover{border-color:#00E5FF55;transform:translateY(-3px)}

        .billing-plan-badge{
          position:absolute;top:-11px;left:50%;transform:translateX(-50%);
          background:#00E5FF;color:#000;font-size:10px;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;
          padding:3px 14px;border-radius:100px;white-space:nowrap;
        }

        .billing-stat-chip{
          background:#0c0c0c;border:1px solid #161616;border-radius:8px;
          padding:6px 8px;font-size:11px;font-family:'DM Mono',monospace;color:#888;
        }
        .billing-stat-chip .lbl{font-size:10px;color:#333;display:block;margin-bottom:2px}

        .billing-feat{display:flex;align-items:flex-start;gap:9px;font-size:12px;color:#bbb;line-height:1.45}
        .billing-feat .ck{color:#00FF88;font-size:11px;margin-top:2px;flex-shrink:0;font-weight:700}
        .billing-feat .lk{color:#222;font-size:11px;margin-top:2px;flex-shrink:0}
        .billing-feat.dim{color:#252525}

        .billing-btn{width:100%;padding:10px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.15s;margin-top:auto}
        .billing-btn:disabled{opacity:0.6;cursor:not-allowed}
        .billing-btn-cyan{background:#00E5FF;color:#000;border:none}
        .billing-btn-cyan:hover{background:#2eeeff}
        .billing-btn-ghost{background:transparent;color:#666;border:1px solid #1e1e1e}
        .billing-btn-ghost:hover{border-color:#333;color:#fff}

        .billing-scan-card{background:#070707;border:1px solid #161616;border-radius:12px;padding:20px;position:relative;transition:all 0.2s;display:flex;flex-direction:column}
        .billing-scan-card:hover{border-color:#2a2a2a;transform:translateY(-3px)}
        .billing-scan-card.pop{border-color:#00FF8826}
        .billing-scan-pop{position:absolute;top:-10px;left:16px;background:#00FF88;color:#000;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px}
        
        .billing-toggle-pill{display:inline-flex;background:#0d0d0d;border:1px solid #191919;border-radius:100px;padding:3px;gap:2px}
        .billing-tgl{padding:7px 18px;border-radius:100px;border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;transition:all 0.15s}
        .billing-tgl.on{background:#fff;color:#000}
        .billing-tgl.off{background:transparent;color:#555}
        .billing-tgl.off:hover{color:#888}
        
        .billing-plans-grid, .billing-scans-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        @media (min-width: 1024px) {
             .billing-plans-grid, .billing-scans-grid {
                 grid-template-columns: repeat(2, 1fr);
             }
        }
      `}</style>

            {/* PRICING PLANS */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white mb-1">Available Plans</h3>
                        <p className="text-sm text-(--color-textSecondary)">Upgrade your workspace to unlock more scans and capabilities.</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="billing-toggle-pill">
                            <button className={`billing-tgl ${!annual ? "on" : "off"}`} onClick={() => setAnnual(false)}>Monthly</button>
                            <button className={`billing-tgl ${annual ? "on" : "off"}`} onClick={() => setAnnual(true)}>Annual</button>
                        </div>
                    </div>
                </div>

                <div className="billing-plans-grid">
                    {plans.map((p, i) => (
                        <div key={p.key} className={`billing-plan-card ${p.highlight ? "hl" : ""}`}>
                            {p.badge && <div className="billing-plan-badge">{p.badge}</div>}

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
                                    <div key={lbl} className="billing-stat-chip">
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
                                    <div key={f} className="billing-feat"><span className="ck">✓</span>{f}</div>
                                ))}
                                {p.locked && p.locked.map(f => (
                                    <div key={f} className="billing-feat dim"><span className="lk">—</span>{f}</div>
                                ))}
                            </div>

                            <button
                                className={`billing-btn ${p.solid ? "billing-btn-cyan" : "billing-btn-ghost"}`}
                                onClick={async (e) => {
                                    if (p.key === 'enterprise') return;
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
                                        btn.textContent = `Upgrade to ${p.name}`;
                                        alert("Error creating checkout session");
                                    }
                                }}
                            >
                                Upgrade to {p.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ONE TIME SCANS */}
            <div className="mt-8">
                <div className="mb-6">
                    <h3 className="text-xl font-syne font-bold text-white mb-1 flex items-center gap-2">
                        Buy a One-Time Scan
                    </h3>
                    <p className="text-sm text-(--color-textSecondary)">Need an immediate scan or compliance report without upgrading?</p>
                </div>

                <div className="billing-scans-grid">
                    {oneTimeScans.slice(0, 4).map(s => (
                        <div key={s.key} className={`billing-scan-card ${s.popular ? "pop" : ""}`}>
                            {s.popular && <div className="billing-scan-pop">Most popular</div>}
                            <div style={{ fontSize: 26, marginBottom: 12 }}>{s.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, letterSpacing: "-0.02em", color: "text-white" }}>{s.name}</div>

                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                                    <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: s.popular ? "#00FF88" : "#fff" }}>${s.price}</span>
                                    <span style={{ fontSize: 12, color: "#333", fontFamily: "'DM Mono',monospace", paddingBottom: 5 }}> one-time</span>
                                </div>
                            </div>

                            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.55, marginBottom: 12 }}>{s.desc}</div>
                            <div style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono',monospace", marginBottom: 16 }}>⏱ {s.time}</div>

                            <button
                                style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: s.popular ? "#00FF88" : "transparent", color: s.popular ? "#000" : "#555", border: s.popular ? "none" : "1px solid #1e1e1e", transition: "all 0.15s", marginTop: "auto" }}
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
                                        btn.textContent = "Purchase Scan →";
                                        alert("Error creating checkout session");
                                    }
                                }}
                            >
                                Purchase Scan →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
