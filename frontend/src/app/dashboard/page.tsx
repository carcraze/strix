"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search, GitPullRequest, ArrowRight, Plus,
    CheckCircle2, ChevronRight,
    ShieldAlert, Loader2, Clock, Sparkles
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
    const [hoursSaved, setHoursSaved] = useState(0);
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
            for (const issue of (newIssues as any[]) || []) {
                const daysAgo = Math.floor((Date.now() - new Date(issue.found_at || issue.created_at || Date.now()).getTime()) / 86400000);
                if (daysAgo < 14) trend[13 - daysAgo]++;
            }

            // Hours saved from auto-ignored false positives
            const { data: savedData } = await supabase
                .from('issues')
                .select('hours_saved')
                .eq('organization_id', activeWorkspace.id)
                .eq('is_false_positive', true);
            const totalHours = (savedData || []).reduce((sum, r) => sum + (r.hours_saved || 0), 0);

            setIssues(allIssues || []);
            setNewCount(newIssues?.length || 0);
            setFixedCount(fixedIssues?.length || 0);
            setIgnoredCount((savedData || []).length);
            setHoursSaved(Math.round(totalHours * 10) / 10);
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
        <div className="min-h-screen bg-gray-50">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) => {
                    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
                }}
                allIds={filtered.map(i => i.id)}
            />
            <div className="max-w-7xl mx-auto px-6 py-6">

                {/* Greeting */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl text-gray-600">
                        Hello, <span className="text-gray-900 font-semibold">{userName}</span>!
                    </h1>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Search className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            Docs
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Open issues card with severity bar */}
                            <div className="md:row-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="mb-4">
                                    <SeverityBar critical={critical} high={high} medium={medium} low={low} />
                                </div>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-4xl font-bold text-gray-900">{open.length}</span>
                                    <span className="text-gray-600 text-base">Open Issues</span>
                                </div>
                                <div className="flex gap-4 text-sm font-medium">
                                    {critical > 0 && <span className="text-red-600">■ {critical}</span>}
                                    {high     > 0 && <span className="text-orange-600">■ {high}</span>}
                                    {medium   > 0 && <span className="text-blue-600">■ {medium}</span>}
                                    {low      > 0 && <span className="text-green-600">■ {low}</span>}
                                </div>
                            </div>

                            {/* Auto Ignored */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg">
                                        ⚙
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">Auto Ignored</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{ignoredCount}</div>
                                <div className="text-sm text-gray-500">{hoursSaved} hours saved</div>
                            </div>

                            {/* New this week */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-bold">
                                        ●
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">New</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{newCount}</div>
                                <div className="text-sm text-gray-500">in last 7 days</div>
                            </div>

                            {/* Fixed this week */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm md:col-start-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg font-bold">
                                        ✓
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">Solved</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{fixedCount}</div>
                                <div className="text-sm text-gray-500">in last 7 days</div>
                            </div>

                        </div>

                        {/* ── Issue list ── */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Filters Row */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 flex-wrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search"
                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={() => setSevFilter("all")}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        sevFilter === "all"
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    All findings
                                </button>

                                <div className="flex gap-2 ml-auto">
                                    <Link
                                        href="/dashboard/issues"
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        View all <ArrowRight className="h-4 w-4 inline ml-1" />
                                    </Link>
                                </div>
                            </div>
                            {/* Table header */}
                            <div className="bg-white border-b border-gray-200">
                                <div className="grid grid-cols-[40px_1fr_120px_150px_100px_120px] gap-3 px-5 py-3">
                                    <div className="text-sm font-semibold text-gray-900">Type</div>
                                    <div className="text-sm font-semibold text-gray-900">Name</div>
                                    <div className="text-sm font-semibold text-gray-900">Severity</div>
                                    <div className="text-sm font-semibold text-gray-900">Source</div>
                                    <div className="text-sm font-semibold text-gray-900">Fix time</div>
                                    <div className="text-sm font-semibold text-gray-900">Status</div>
                                </div>
                            </div>

                            {filtered.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                                        📋
                                    </div>
                                    <p className="text-sm text-gray-600">No issues found</p>
                                </div>
                            ) : (
                                filtered.map(issue => {
                                    const sev = SEV[issue.severity as SevKey] || SEV.low;
                                    const source = issue.pentest_id ? "pentest" : "pr";
                                    const sourceName = (issue.repositories as any)?.full_name
                                        || (issue.pentests as any)?.name
                                        || "—";

                                    // Type badge
                                    const typeIcon = issue.repository_id ? "TS" : "HTTP";
                                    const typeColors: Record<string, string> = {
                                        ts: "bg-blue-100 text-blue-700 border-blue-300",
                                        http: "bg-purple-100 text-purple-700 border-purple-300",
                                        default: "bg-gray-100 text-gray-700 border-gray-300",
                                    };
                                    const typeColor = typeColors[typeIcon.toLowerCase()] || typeColors.default;

                                    const isNew = new Date(issue.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                                    return (
                                        <div key={issue.id}
                                            onClick={() => setSidebarId(issue.id)}
                                            className="grid grid-cols-[40px_1fr_120px_150px_100px_120px] gap-3 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group items-center">

                                            {/* Type icon */}
                                            <div className={`h-7 w-9 rounded border flex items-center justify-center text-[10px] font-bold font-mono ${typeColor}`}>
                                                {typeIcon}
                                            </div>

                                            {/* Name */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {issue.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">in {sourceName}</p>
                                            </div>

                                            {/* Severity */}
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sev.pill}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                                    {sev.label}
                                                </span>
                                            </div>

                                            {/* Source */}
                                            <div className="text-sm text-gray-700 truncate flex items-center gap-2">
                                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                                {sourceName}
                                            </div>

                                            {/* Fix time */}
                                            <div className="text-sm text-gray-600">
                                                {fixTime(issue.severity)}
                                            </div>

                                            {/* Action */}
                                            <div>
                                                {isNew ? (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-purple-700 bg-purple-100 border border-purple-200">
                                                        New
                                                    </span>
                                                ) : (
                                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                                                        View Fix
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
