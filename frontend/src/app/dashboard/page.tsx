"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search, GitPullRequest, ArrowRight, Plus,
    CheckCircle2, ChevronRight,
    ShieldAlert, Loader2, Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";

// ── Trend sparkline (14-day issue count) ─────────────────────────────────────
function TrendSparkline({ data }: { data: number[] }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const W = 120, H = 36, pad = 2;
    const pts = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v / max) * (H - pad * 2));
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
            <polyline points={pts} fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            {data.map((v, i) => {
                const x = pad + (i / (data.length - 1)) * (W - pad * 2);
                const y = H - pad - ((v / max) * (H - pad * 2));
                return v > 0 ? <circle key={i} cx={x} cy={y} r="2" fill="var(--color-cyan)" /> : null;
            })}
        </svg>
    );
}

// ── Severity config ───────────────────────────────────────────────────────────
const SEV = {
    critical: { label: "Critical", dot: "bg-red-500",    text: "text-red-500",    pill: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
    high:     { label: "High",     dot: "bg-orange-400", text: "text-orange-500", pill: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" },
    medium:   { label: "Medium",   dot: "bg-yellow-400", text: "text-yellow-600", pill: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" },
    low:      { label: "Low",      dot: "bg-green-400",  text: "text-green-600",  pill: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" },
} as const;

type SevKey = keyof typeof SEV;

// ── Type icon ─────────────────────────────────────────────────────────────────
function TypeBadge({ source }: { source: string }) {
    const isPR = source === "pr";
    return (
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono
            ${isPR ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
            {isPR ? "PR" : "PT"}
        </div>
    );
}

// ── Severity bar ──────────────────────────────────────────────────────────────
function SeverityBar({ critical, high, medium, low }: { critical: number; high: number; medium: number; low: number }) {
    const total = critical + high + medium + low;
    if (total === 0) return null;
    const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
    return (
        <div className="flex h-2 w-full rounded-full overflow-hidden gap-px bg-[var(--color-border)]">
            {critical > 0 && <div className="bg-red-500 h-full" style={{ width: pct(critical) }} />}
            {high     > 0 && <div className="bg-orange-400 h-full" style={{ width: pct(high) }} />}
            {medium   > 0 && <div className="bg-yellow-400 h-full" style={{ width: pct(medium) }} />}
            {low      > 0 && <div className="bg-green-400 h-full" style={{ width: pct(low) }} />}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
    const { activeWorkspace } = useWorkspace();

    const [loading, setLoading]   = useState(true);
    const [userName, setUserName] = useState("there");
    const [issues, setIssues]     = useState<any[]>([]);
    const [newCount, setNewCount] = useState(0);
    const [fixedCount, setFixedCount] = useState(0);
    const [ignoredCount, setIgnoredCount] = useState(0);
    const [trendData, setTrendData] = useState<number[]>([]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const meta = data?.user?.user_metadata || {};
            const name = meta.full_name || meta.name || data?.user?.email?.split("@")[0] || "there";
            setUserName(name.split(" ")[0]);
        });
    }, []);

    useEffect(() => {
        if (!activeWorkspace) return;
        const load = async () => {
            setLoading(true);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const [{ data: allIssues }, { data: newIssues }, { data: fixedIssues }] = await Promise.all([
                supabase.from("issues")
                    .select("id, title, severity, status, found_at, repository_id, pentest_id, repositories(full_name), pentests(name)")
                    .eq("organization_id", activeWorkspace.id)
                    .in("status", ["open", "in_progress"])
                    .order("found_at", { ascending: false })
                    .limit(50),
                supabase.from("issues")
                    .select("id")
                    .eq("organization_id", activeWorkspace.id)
                    .gte("found_at", weekAgo),
                supabase.from("issues")
                    .select("id")
                    .eq("organization_id", activeWorkspace.id)
                    .eq("status", "fixed")
                    .gte("found_at", weekAgo),
            ]);

            // Build 14-day trend (issues found per day)
            const trend: number[] = Array(14).fill(0);
            for (const issue of newIssues || []) {
                const daysAgo = Math.floor((Date.now() - new Date(issue.created_at || issue.found_at || Date.now()).getTime()) / 86400000);
                if (daysAgo < 14) trend[13 - daysAgo]++;
            }

            setIssues(allIssues || []);
            setNewCount(newIssues?.length || 0);
            setFixedCount(fixedIssues?.length || 0);
            setIgnoredCount(0);
            setTrendData(trend);
            setLoading(false);
        };
        load();
    }, [activeWorkspace]);

    const open     = issues;
    const critical = open.filter(i => i.severity === "critical").length;
    const high     = open.filter(i => i.severity === "high").length;
    const medium   = open.filter(i => i.severity === "medium").length;
    const low      = open.filter(i => i.severity === "low").length;

    const [search, setSearch] = useState("");
    const [sevFilter, setSevFilter] = useState<string>("all");
    const [sidebarId, setSidebarId] = useState<string | null>(null);

    const filtered = open.filter(i => {
        if (sevFilter !== "all" && i.severity !== sevFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!i.title?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const isEmpty = !loading && open.length === 0;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) => {
                    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
                }}
                allIds={filtered.map(i => i.id)}
            />
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Greeting */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">
                        Hello, <span className="text-[var(--color-cyan)]">{userName}</span>!
                    </h1>
                    <Link href="/dashboard/pentests/new"
                        className="flex items-center gap-2 bg-[var(--color-cyan)] text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                        <Plus className="h-4 w-4" /> New Pentest
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-textMuted)]" />
                    </div>
                ) : isEmpty ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 flex items-center justify-center mb-5">
                            <ShieldAlert className="h-7 w-7 text-[var(--color-cyan)]" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No open issues</h2>
                        <p className="text-[var(--color-textSecondary)] max-w-sm mb-8">
                            Run a pentest or connect a repository to start finding vulnerabilities.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/dashboard/pentests/new"
                                className="flex items-center gap-2 bg-[var(--color-cyan)] text-black font-bold px-5 py-2.5 rounded-lg text-sm">
                                <Search className="h-4 w-4" /> Run Pentest
                            </Link>
                            <Link href="/dashboard/integrations"
                                className="flex items-center gap-2 border border-[var(--color-border)] text-[var(--foreground)] px-5 py-2.5 rounded-lg text-sm hover:bg-white/5 transition-colors">
                                <GitPullRequest className="h-4 w-4" /> Connect Repo
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── KPI row ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {/* Open issues card with severity bar */}
                            <div className="col-span-2 bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl p-5">
                                <div className="mb-3">
                                    <SeverityBar critical={critical} high={high} medium={medium} low={low} />
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-2xl font-bold text-[var(--foreground)]">{open.length}</span>
                                    <span className="text-[var(--color-textSecondary)] text-sm">Open Issues</span>
                                </div>
                                <div className="flex gap-3 text-xs font-mono">
                                    {critical > 0 && <span className="text-red-500">● {critical}</span>}
                                    {high     > 0 && <span className="text-orange-400">● {high}</span>}
                                    {medium   > 0 && <span className="text-yellow-400">● {medium}</span>}
                                    {low      > 0 && <span className="text-green-400">● {low}</span>}
                                </div>
                            </div>

                            {/* New this week */}
                            <div className="bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Plus className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="text-xs text-[var(--color-textSecondary)] font-medium">New</span>
                                </div>
                                <div className="text-2xl font-bold text-[var(--foreground)]">{newCount}</div>
                                <div className="text-xs text-[var(--color-textMuted)] mt-1">in last 7 days</div>
                            </div>

                            {/* Fixed this week */}
                            <div className="bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    </div>
                                    <span className="text-xs text-[var(--color-textSecondary)] font-medium">Fixed</span>
                                </div>
                                <div className="text-2xl font-bold text-[var(--foreground)]">{fixedCount}</div>
                                <div className="text-xs text-[var(--color-textMuted)] mt-1">in last 7 days</div>
                            </div>

                        {/* Trend sparkline — full width row */}
                        {trendData.some(v => v > 0) && (
                            <div className="col-span-2 md:col-span-4 bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-[var(--color-textSecondary)] font-medium mb-0.5">New issues · last 14 days</p>
                                    <p className="text-lg font-bold text-[var(--foreground)]">{newCount} total</p>
                                </div>
                                <TrendSparkline data={trendData} />
                            </div>
                        )}
                        </div>

                        {/* ── Filters ── */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-textMuted)]" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search issues..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface-container)] border border-[var(--color-border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--color-textMuted)] focus:outline-none focus:border-[var(--color-cyan)] transition-colors"
                                />
                            </div>
                            <div className="flex gap-1.5">
                                {["all", "critical", "high", "medium", "low"].map(s => (
                                    <button key={s} onClick={() => setSevFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                                            ${sevFilter === s
                                                ? "bg-[var(--color-cyan)] text-black"
                                                : "bg-[var(--surface-container)] border border-[var(--color-border)] text-[var(--color-textSecondary)] hover:text-[var(--foreground)]"
                                            }`}>
                                        {s === "all" ? "All findings" : s}
                                    </button>
                                ))}
                            </div>
                            <Link href="/dashboard/issues" className="text-xs text-[var(--color-textMuted)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors ml-auto">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {/* ── Issue list ── */}
                        <div className="bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[32px_1fr_110px_110px_90px_90px] gap-3 px-4 py-2.5 border-b border-[var(--color-border)] text-xs font-medium text-[var(--color-textMuted)] uppercase tracking-wider">
                                <div />
                                <div>Name</div>
                                <div>Severity</div>
                                <div>Source</div>
                                <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Fix Time</div>
                                <div className="text-right">Action</div>
                            </div>

                            {filtered.length === 0 ? (
                                <div className="py-16 text-center text-[var(--color-textMuted)] text-sm">
                                    No issues match your filter.
                                </div>
                            ) : (
                                filtered.map(issue => {
                                    const sev = SEV[issue.severity as SevKey] || SEV.low;
                                    const source = issue.pentest_id ? "pentest" : "pr";
                                    const sourceName = (issue.repositories as any)?.full_name
                                        || (issue.pentests as any)?.name
                                        || "—";

                                    return (
                                        <div key={issue.id}
                                            onClick={() => setSidebarId(issue.id)}
                                            className="grid grid-cols-[32px_1fr_110px_110px_90px_90px] gap-3 px-4 py-3.5 border-b border-[var(--color-border)] last:border-0 hover:bg-white/3 transition-colors cursor-pointer group items-center">

                                            {/* Type icon */}
                                            <TypeBadge source={source} />

                                            {/* Name */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--color-cyan)] transition-colors">
                                                    {issue.title}
                                                </p>
                                                <p className="text-xs text-[var(--color-textMuted)] truncate mt-0.5">{sourceName}</p>
                                            </div>

                                            {/* Severity */}
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sev.pill}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                                    {sev.label}
                                                </span>
                                            </div>

                                            {/* Source */}
                                            <div className="text-xs text-[var(--color-textSecondary)] truncate">
                                                {source === "pr"
                                                    ? <span className="flex items-center gap-1"><GitPullRequest className="h-3 w-3 shrink-0" />{sourceName}</span>
                                                    : <span className="flex items-center gap-1"><Search className="h-3 w-3 shrink-0" />{sourceName}</span>
                                                }
                                            </div>

                                            {/* Fix time */}
                                            <div className="flex items-center gap-1 text-xs text-[var(--color-textMuted)]">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                {fixTime(issue.severity)}
                                            </div>

                                            {/* Action */}
                                            <div className="flex justify-end">
                                                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-cyan)] border border-[var(--color-cyan)]/30 rounded-lg px-2.5 py-1 group-hover:bg-[var(--color-cyan)]/10 transition-colors">
                                                    View Fix <ChevronRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Quick links */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            {[
                                { href: "/dashboard/pentests/new", icon: Search,          label: "New Pentest",      sub: "Scan a domain or repo" },
                                { href: "/dashboard/pr-reviews",   icon: GitPullRequest,   label: "PR Reviews",       sub: "See all code reviews" },
                                { href: "/dashboard/issues",       icon: ShieldAlert,      label: "All Issues",       sub: "Full issue management" },
                            ].map(({ href, icon: Icon, label, sub }) => (
                                <Link key={href} href={href}
                                    className="flex items-center gap-3 p-4 bg-[var(--surface-container)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-cyan)]/40 hover:bg-[var(--color-cyan)]/5 transition-colors group">
                                    <div className="h-8 w-8 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center shrink-0">
                                        <Icon className="h-4 w-4 text-[var(--color-cyan)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--color-cyan)] transition-colors">{label}</p>
                                        <p className="text-xs text-[var(--color-textMuted)] truncate">{sub}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                    </>
                )}
            </div>
        </div>
    );
}
