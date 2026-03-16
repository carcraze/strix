"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, CalendarIcon as Cal, ChevronDown, ChevronLeft, ChevronRight, Check, X, Loader2, GitPullRequest, ExternalLink, Plus, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getPrReviews } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

const PR_STATUSES = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "running", label: "Running" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
];

const STATUS_COLORS: Record<string, string> = {
    pending: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    running: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20",
    completed: "text-green-400 bg-green-500/10 border border-green-500/20",
    failed: "text-red-400 bg-red-500/10 border border-red-500/20",
};

function ProviderIcon({ provider }: { provider?: string }) {
    if (provider === 'github') return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/70" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" /></svg>;
    if (provider === 'gitlab') return <span className="text-[10px] font-bold text-[#FC6D26]">GL</span>;
    if (provider === 'bitbucket') return <span className="text-[10px] font-bold text-[#2684FF]">BB</span>;
    return <GitPullRequest className="h-4 w-4 text-white/40" />;
}

function FindingsBadges({ review }: { review: any }) {
    if (review.status !== 'completed') return <span className="text-white/20 text-xs">—</span>;
    const critical = review.critical_count || 0;
    const high = review.high_count || 0;
    const medium = review.medium_count || 0;
    const total = review.issues_found || 0;
    if (total === 0) return <span className="text-xs text-green-400 font-mono">Clean ✓</span>;
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {critical > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">{critical} CRIT</span>}
            {high > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">{high} HIGH</span>}
            {medium > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">{medium} MED</span>}
        </div>
    );
}

function Dropdown({ label, options, value, onChange }: {
    label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-[#0D1117] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-white hover:border-white/30 transition-colors whitespace-nowrap min-w-[140px]">
                <span className="flex-1 text-left">{selected?.label || label}</span>
                <ChevronDown className={`h-4 w-4 text-[var(--color-textMuted)] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-11 left-0 z-50 bg-[#0D1117] border border-[var(--color-border)] rounded-xl shadow-2xl py-1 w-44 animate-in fade-in slide-in-from-top-1 duration-150">
                    {options.map(opt => (
                        <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                            className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
                            <span className={value === opt.value ? "text-white font-medium" : "text-[var(--color-textSecondary)]"}>{opt.label}</span>
                            {value === opt.value && <Check className="h-3.5 w-3.5 text-[var(--color-cyan)]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: {
    total: number; page: number; pageSize: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
    const totalPages = Math.ceil(total / pageSize);
    if (total === 0) return null;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 text-sm text-[var(--color-textSecondary)]">
            <div className="flex items-center gap-3">
                <span>Rows per page:</span>
                <div className="flex gap-1">
                    {[25, 50].map(size => (
                        <button key={size} onClick={() => { onPageSizeChange(size); onPageChange(1); }}
                            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${pageSize === size ? "bg-[var(--color-cyan)] text-black font-bold" : "bg-white/5 hover:bg-white/10 text-[var(--color-textSecondary)]"}`}>{size}</button>
                    ))}
                </div>
                <span className="text-[var(--color-textMuted)]">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 7) {
                        if (page <= 4) p = i + 1;
                        else if (page >= totalPages - 3) p = totalPages - 6 + i;
                        else p = page - 3 + i;
                    }
                    return (
                        <button key={p} onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded text-xs font-mono transition-colors ${page === p ? "bg-[var(--color-cyan)] text-black font-bold" : "hover:bg-white/10"}`}>{p}</button>
                    );
                })}
                <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// ─────────────── Main Page ───────────────
export default function PRReviewsPage() {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const { activeWorkspace } = useWorkspace();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadReviews = useCallback(async () => {
        if (!activeWorkspace) return;
        try {
            const data = await getPrReviews(activeWorkspace.id);
            setReviews(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeWorkspace]);

    // Initial load
    useEffect(() => {
        if (!activeWorkspace) return;
        setLoading(true);
        loadReviews();
    }, [activeWorkspace, loadReviews]);

    // Realtime subscription
    useEffect(() => {
        if (!activeWorkspace) return;
        const channel = supabase
            .channel(`pr_reviews_${activeWorkspace.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pr_reviews',
                filter: `organization_id=eq.${activeWorkspace.id}`,
            }, () => {
                // Reload on any change
                loadReviews();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeWorkspace, loadReviews]);

    // Fallback polling: when any row is pending/running, poll every 5s
    useEffect(() => {
        const hasActive = reviews.some(r => r.status === 'pending' || r.status === 'running');
        if (!hasActive) return;
        const timer = setInterval(loadReviews, 5000);
        return () => clearInterval(timer);
    }, [reviews, loadReviews]);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const filtered = reviews.filter(r => {
        const q = search.toLowerCase();
        if (q && !(
            r.pr_title?.toLowerCase().includes(q) ||
            r.repositories?.full_name?.toLowerCase().includes(q) ||
            String(r.pr_number).includes(q)
        )) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return true;
    });

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const hasFilters = search || statusFilter !== "all";
    const activeCount = reviews.filter(r => r.status === 'pending' || r.status === 'running').length;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white tracking-tight">PR Reviews</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1">
                        Automated security reviews on pull requests across connected repositories.
                        {activeCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-cyan-400 text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {activeCount} scan{activeCount > 1 ? 's' : ''} running
                            </span>
                        )}
                    </p>
                </div>
                <Link href="/dashboard/repositories"
                    className="inline-flex items-center justify-center bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Repository
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search repository, title, or PR number..."
                        className="w-full bg-[#0D1117] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-cyan)] transition-colors" />
                </div>
                <Dropdown label="All Status" options={PR_STATUSES} value={statusFilter} onChange={setStatusFilter} />
                {hasFilters && (
                    <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs text-[var(--color-textMuted)] hover:text-white transition-colors underline">
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden shadow-xl border border-[var(--color-border)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/40 border-b border-[var(--color-border)] font-syne text-[var(--color-textMuted)]">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">PR / MR</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Repository</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Findings</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Triggered By</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 text-right font-medium uppercase tracking-wider text-xs">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-textMuted)]">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading reviews...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <GitPullRequest className="h-10 w-10 text-[var(--color-textMuted)] mb-4" />
                                            <h3 className="text-lg font-syne font-medium text-white mb-2">
                                                {reviews.length === 0 ? "No PR reviews yet" : "No results"}
                                            </h3>
                                            <p className="text-[var(--color-textSecondary)] max-w-sm mx-auto mb-6">
                                                {reviews.length === 0
                                                    ? "Connect a repository and enable auto-review to see security checks here, or use \"Scan Now\" for a manual trigger."
                                                    : "No PR reviews match your current filters."}
                                            </p>
                                            {reviews.length === 0 && (
                                                <Link href="/dashboard/repositories" className="inline-flex items-center gap-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 text-sm">
                                                    <Plus className="h-4 w-4" /> Connect Repository
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map(r => {
                                    const statusClass = STATUS_COLORS[r.status] || "text-gray-400 bg-white/5 border border-white/10";
                                    const isActive = r.status === 'pending' || r.status === 'running';
                                    return (
                                        <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <ProviderIcon provider={r.provider} />
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-[var(--color-cyan)] transition-colors line-clamp-1 max-w-[200px]">
                                                            {r.pr_title || "Untitled"}
                                                        </div>
                                                        <div className="text-xs text-[var(--color-textMuted)] font-mono mt-0.5">#{r.pr_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-[var(--color-textSecondary)] font-mono">
                                                    {r.repositories?.full_name || r.repositories?.name || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2.5 py-1 rounded font-mono capitalize inline-flex items-center gap-1 ${statusClass}`}>
                                                    {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <FindingsBadges review={r} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-[var(--color-textSecondary)]">
                                                    <span className={`capitalize font-mono ${r.trigger_source === 'manual' ? 'text-purple-400' : 'text-[var(--color-textMuted)]'}`}>
                                                        {r.trigger_source || 'webhook'}
                                                    </span>
                                                    {r.author_username && (
                                                        <div className="text-[var(--color-textMuted)] mt-0.5">@{r.author_username}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-textSecondary)] text-xs">
                                                {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                <div className="text-[var(--color-textMuted)] mt-0.5">
                                                    {new Date(r.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {r.pr_url ? (
                                                    <a href={r.pr_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[var(--color-textMuted)] hover:text-[var(--color-cyan)] transition-colors p-1 rounded hover:bg-white/10 inline-flex">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                ) : <span className="text-[var(--color-textMuted)] text-xs">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="border-t border-[var(--color-border)] px-4">
                        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                    </div>
                )}
            </Card>
        </div>
    );
}
