"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, CalendarIcon as Cal, ChevronDown, ChevronLeft, ChevronRight, Check, X, Loader2, GitPullRequest, ExternalLink, Plus } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getPrReviews } from "@/lib/queries";

// ─────────────── Shared: Dropdown ───────────────
const PR_STATUSES = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "running", label: "Running" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
];

const STATUS_COLORS: Record<string, string> = {
    pending: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    running: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 animate-pulse",
    completed: "text-green-400 bg-green-500/10 border border-green-500/20",
    failed: "text-red-400 bg-red-500/10 border border-red-500/20",
};

function Dropdown({ label, options, value, onChange }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-[#0D1117] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-white hover:border-white/30 transition-colors whitespace-nowrap min-w-[140px]"
            >
                <span className="flex-1 text-left">{selected?.label || label}</span>
                <ChevronDown className={`h-4 w-4 text-[var(--color-textMuted)] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-11 left-0 z-50 bg-[#0D1117] border border-[var(--color-border)] rounded-xl shadow-2xl py-1 w-44 animate-in fade-in slide-in-from-top-1 duration-150">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        >
                            <span className={value === opt.value ? "text-white font-medium" : "text-[var(--color-textSecondary)]"}>
                                {opt.label}
                            </span>
                            {value === opt.value && <Check className="h-3.5 w-3.5 text-[var(--color-cyan)]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────── Shared: Calendar ───────────────
function CalendarPicker({ dateRange, onChange, onClear }: {
    dateRange: { start: Date | null; end: Date | null };
    onChange: (r: { start: Date | null; end: Date | null }) => void;
    onClear: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [hovered, setHovered] = useState<Date | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const isInRange = (d: Date) => {
        const end = dateRange.end || hovered;
        if (!dateRange.start || !end) return false;
        const [lo, hi] = dateRange.start <= end ? [dateRange.start, end] : [end, dateRange.start];
        return d >= lo && d <= hi;
    };

    const handleDayClick = (day: Date) => {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            onChange({ start: day, end: null });
        } else {
            const [lo, hi] = day >= dateRange.start ? [dateRange.start, day] : [day, dateRange.start];
            onChange({ start: lo, end: hi });
            setOpen(false);
        }
    };

    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const label = dateRange.start
        ? dateRange.end ? `${fmt(dateRange.start)} – ${fmt(dateRange.end)}` : `From ${fmt(dateRange.start)}`
        : "Date Range";

    const days: (Date | null)[] = [];
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    for (let i = 0; i < first; i++) days.push(null);
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= count; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors whitespace-nowrap ${dateRange.start
                    ? "bg-[var(--color-cyan)]/10 border-[var(--color-cyan)]/30 text-[var(--color-cyan)]"
                    : "bg-[#0D1117] border-[var(--color-border)] text-white hover:border-white/30"
                    }`}
            >
                <Cal className="h-4 w-4" />
                {label}
                {dateRange.start && (
                    <span onClick={e => { e.stopPropagation(); onClear(); }} className="ml-1 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute top-10 right-0 z-50 bg-[#0D1117] border border-[var(--color-border)] rounded-xl shadow-2xl p-3 w-56 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="p-1 rounded hover:bg-white/10 text-[var(--color-textMuted)] hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="text-sm font-syne font-bold text-white">{viewDate.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
                        <button onClick={nextMonth} className="p-1 rounded hover:bg-white/10 text-[var(--color-textMuted)] hover:text-white"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-0 mb-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                            <div key={d} className="text-center text-[9px] font-mono text-[var(--color-textMuted)] py-0.5">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0">
                        {days.map((day, i) => {
                            if (!day) return <div key={`e-${i}`} />;
                            const isStart = dateRange.start && isSameDay(day, dateRange.start);
                            const isEnd = dateRange.end && isSameDay(day, dateRange.end);
                            const inRange = isInRange(day);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    onMouseEnter={() => setHovered(day)}
                                    onMouseLeave={() => setHovered(null)}
                                    className={`h-7 w-full text-[11px] font-mono transition-colors rounded
                                        ${isStart || isEnd ? "bg-[var(--color-cyan)] text-black font-bold" : ""}
                                        ${inRange && !isStart && !isEnd ? "bg-[var(--color-cyan)]/15 text-white" : ""}
                                        ${!isStart && !isEnd && !inRange ? "text-[var(--color-textSecondary)] hover:bg-white/10 hover:text-white" : ""}
                                        ${isToday && !isStart && !isEnd ? "border border-white/20" : ""}
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                    {dateRange.start && !dateRange.end && (
                        <p className="text-[10px] text-center text-[var(--color-textMuted)] mt-3 font-mono">Click another date to set end range</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────── Pagination ───────────────
function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: {
    total: number; page: number; pageSize: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
}) {
    const totalPages = Math.ceil(total / pageSize);
    if (total === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 text-sm text-[var(--color-textSecondary)]">
            <div className="flex items-center gap-3">
                <span>Rows per page:</span>
                <div className="flex gap-1">
                    {[25, 50].map(size => (
                        <button
                            key={size}
                            onClick={() => { onPageSizeChange(size); onPageChange(1); }}
                            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${pageSize === size ? "bg-[var(--color-cyan)] text-black font-bold" : "bg-white/5 hover:bg-white/10 text-[var(--color-textSecondary)]"}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
                <span className="text-[var(--color-textMuted)]">
                    {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
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
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded text-xs font-mono transition-colors ${page === p ? "bg-[var(--color-cyan)] text-black font-bold" : "hover:bg-white/10"}`}
                        >
                            {p}
                        </button>
                    );
                })}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
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
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const data = await getPrReviews(activeWorkspace.id);
                setReviews(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [activeWorkspace]);

    // Reset to page 1 whenever filters change
    useEffect(() => { setPage(1); }, [search, statusFilter, dateRange]);

    const filtered = reviews.filter(r => {
        const q = search.toLowerCase();
        if (q && !(
            r.pr_title?.toLowerCase().includes(q) ||
            r.repositories?.name?.toLowerCase().includes(q) ||
            String(r.pr_number).includes(q)
        )) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (dateRange.start) {
            const created = new Date(r.created_at);
            const start = new Date(dateRange.start); start.setHours(0, 0, 0, 0);
            if (dateRange.end) {
                const end = new Date(dateRange.end); end.setHours(23, 59, 59, 999);
                if (created < start || created > end) return false;
            } else {
                const dayEnd = new Date(start); dayEnd.setHours(23, 59, 59, 999);
                if (created < start || created > dayEnd) return false;
            }
        }
        return true;
    });

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const hasFilters = search || statusFilter !== "all" || dateRange.start;
    const clearFilters = () => { setSearch(""); setStatusFilter("all"); setDateRange({ start: null, end: null }); };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white tracking-tight">PR Reviews</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1">Automated security reviews on pull requests across connected repositories.</p>
                </div>
                <Link
                    href="/dashboard/repositories"
                    className="inline-flex items-center justify-center bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Repository
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search repository, title, or PR number..."
                        className="w-full bg-[#0D1117] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-cyan)] transition-colors"
                    />
                </div>
                <Dropdown label="All Status" options={PR_STATUSES} value={statusFilter} onChange={setStatusFilter} />
                <CalendarPicker dateRange={dateRange} onChange={setDateRange} onClear={() => setDateRange({ start: null, end: null })} />
                {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-[var(--color-textMuted)] hover:text-white transition-colors underline">
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
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">PR</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Repository</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Issues Found</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 text-right font-medium uppercase tracking-wider text-xs">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-textMuted)]">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading reviews...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <GitPullRequest className="h-10 w-10 text-[var(--color-textMuted)] mb-4" />
                                            <h3 className="text-lg font-syne font-medium text-white mb-2">
                                                {reviews.length === 0 ? "No PR reviews yet" : "No results"}
                                            </h3>
                                            <p className="text-[var(--color-textSecondary)] max-w-sm mx-auto">
                                                {reviews.length === 0
                                                    ? "Connect a repository and enable auto-review PRs to start seeing security checks here."
                                                    : "No PR reviews match your current filters."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map(r => {
                                    const statusClass = STATUS_COLORS[r.status] || "text-gray-400 bg-white/5 border border-white/10";
                                    return (
                                        <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white group-hover:text-[var(--color-cyan)] transition-colors">{r.pr_title || "Untitled PR"}</div>
                                                <div className="text-xs text-[var(--color-textMuted)] font-mono mt-0.5">#{r.pr_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-[var(--color-textSecondary)] font-mono">
                                                    {r.repositories?.name || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2.5 py-1 rounded font-mono capitalize ${statusClass}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm">
                                                {r.issues_found != null
                                                    ? <span className={r.issues_found > 0 ? "text-[var(--color-red)]" : "text-[var(--color-green)]"}>{r.issues_found}</span>
                                                    : <span className="text-[var(--color-textMuted)]">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-textSecondary)] text-xs">
                                                {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {r.pr_url ? (
                                                    <a
                                                        href={r.pr_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-[var(--color-textMuted)] hover:text-[var(--color-cyan)] transition-colors p-1 rounded hover:bg-white/10 inline-flex"
                                                    >
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
                        <Pagination
                            total={filtered.length}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
