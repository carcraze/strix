"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Check, Activity, List } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues, getDomains, getRepositories } from "@/lib/queries";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";

// ─────────────── Configuration ───────────────
const SEVERITY_CONFIG: Record<string, { color: string, bg: string, label: string }> = {
    critical: { color: "text-[var(--color-red)]", bg: "bg-[var(--color-red)]/10", label: "Critical" },
    high: { color: "text-[var(--color-amber)]", bg: "bg-[var(--color-amber)]/10", label: "High" },
    medium: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Medium" },
    low: { color: "text-[var(--color-green)]", bg: "bg-[var(--color-green)]/10", label: "Low" },
    info: { color: "text-[var(--color-textSecondary)]", bg: "bg-white/5", label: "Info" },
};

const STATUS_TABS = [
    { id: "all",         label: "All" },
    { id: "open",        label: "Open" },
    { id: "in_progress", label: "In Progress" },
    { id: "fixed",       label: "Fixed" },
    { id: "ignored",     label: "Ignored" },
    { id: "snoozed",     label: "Snoozed" },
];

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

// ─────────────── Custom Dropdown ───────────────
function FilterDropdown({
    label, value, options, onChange, renderOption, align = "left"
}: {
    label: string,
    value: string,
    options: { value: string, label: string, color?: string }[],
    onChange: (v: string) => void,
    renderOption?: (opt: { value: string, label: string, color?: string }) => React.ReactNode,
    align?: "left" | "right"
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between gap-4 bg-[#0D1117] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-textSecondary)] hover:border-white/30 hover:text-white transition-colors whitespace-nowrap min-w-[170px]"
            >
                <div className="flex items-center gap-2">
                    {selected?.color && <span className={`w-2 h-2 rounded-full ${selected.color.replace('text-', 'bg-')}`} />}
                    <span>{selected?.label || label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--color-textMuted)] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className={`absolute top-11 ${align === 'right' ? 'right-0' : 'left-0'} z-50 bg-[#0D1117] border border-[var(--color-border)] rounded-xl shadow-2xl py-1 w-52 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto`}>
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2 truncate">
                                {renderOption ? renderOption(opt) : (
                                    <>
                                        {opt.color && <span className={`w-2 h-2 rounded-full min-w-2 ${opt.color.replace('text-', 'bg-')}`} />}
                                        <span className={`truncate ${value === opt.value ? "text-white font-medium" : "text-[var(--color-textSecondary)]"}`}>
                                            {opt.label}
                                        </span>
                                    </>
                                )}
                            </div>
                            {value === opt.value && <Check className="h-3.5 w-3.5 text-white flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────── Main Component ───────────────
export default function IssuesPage() {
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<any[]>([]);
    const [allRepos, setAllRepos] = useState<any[]>([]);
    const [allDomains, setAllDomains] = useState<any[]>([]);
    const { activeWorkspace } = useWorkspace();

    // Filters state
    const [activeTab, setActiveTab] = useState("open");
    const [sidebarId, setSidebarId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [repoFilter, setRepoFilter] = useState("all");
    const [domainFilter, setDomainFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [activeTab, searchQuery, severityFilter, repoFilter, domainFilter]);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const [issuesData, reposData, domainsData] = await Promise.all([
                    getIssues(activeWorkspace.id),
                    getRepositories(activeWorkspace.id),
                    getDomains(activeWorkspace.id)
                ]);
                setIssues(issuesData || []);
                setAllRepos(reposData || []);
                setAllDomains(domainsData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeWorkspace]);

    // ─── Derived Data ───
    const stats = useMemo(() => {
        return {
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length,
            statuses: {
                all: issues.length,
                open: issues.filter(i => i.status === 'open' || !i.status).length, // assuming empty is open
                in_progress: issues.filter(i => i.status === 'in_progress').length,
                fixed: issues.filter(i => i.status === 'fixed' || i.status === 'resolved').length,
                ignored: issues.filter(i => i.status === 'ignored').length,
                snoozed: issues.filter(i => i.snoozed_until && new Date(i.snoozed_until) > new Date()).length,
            }
        };
    }, [issues]);

    // Map all repos and domains to options
    const repoOptions = allRepos.map(r => ({ value: r.id, label: r.full_name || r.name || r.id }));
    const domainOptions = allDomains.map(d => ({ value: d.id, label: d.domain }));

    // ─── Filtering ───
    const filteredIssues = issues.filter(i => {
        // Tab status filtering
        const stat = i.status || 'open';
        if (activeTab === 'open' && stat !== 'open') return false;
        if (activeTab === 'in_progress' && stat !== 'in_progress') return false;
        if (activeTab === 'fixed' && stat !== 'fixed' && stat !== 'resolved') return false;
        if (activeTab === 'ignored' && stat !== 'ignored') return false;
        if (activeTab === 'snoozed') {
            const snoozedUntil = i.snoozed_until ? new Date(i.snoozed_until) : null;
            if (!snoozedUntil || snoozedUntil <= new Date()) return false;
        }

        // Dropdown filtering
        if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
        if (repoFilter !== 'all' && i.repository_id !== repoFilter) return false;
        if (domainFilter !== 'all' && i.domain_id !== domainFilter) return false;

        // Search text
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!(
                i.title?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q)
            )) return false;
        }

        return true;
    });

    const paginatedIssues = filteredIssues.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) =>
                    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
                }
                allIds={paginatedIssues.map((i: any) => i.id)}
            />
            {/* Header */}
            <div>
                <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Issues</h1>
            </div>

            {/* Severity Stats */}
            <div className="flex gap-8 md:gap-12 border-b border-[var(--color-border)] pb-6">
                <div>
                    <div className="text-[var(--color-textSecondary)] text-sm mb-2">Critical</div>
                    <div className="text-3xl font-bold font-syne text-[var(--color-red)]">{stats.critical}</div>
                </div>
                <div>
                    <div className="text-[var(--color-textSecondary)] text-sm mb-2">High</div>
                    <div className="text-3xl font-bold font-syne text-[var(--color-amber)]">{stats.high}</div>
                </div>
                <div>
                    <div className="text-[var(--color-textSecondary)] text-sm mb-2">Medium</div>
                    <div className="text-3xl font-bold font-syne text-blue-400">{stats.medium}</div>
                </div>
                <div>
                    <div className="text-[var(--color-textSecondary)] text-sm mb-2">Low</div>
                    <div className="text-3xl font-bold font-syne text-[var(--color-green)]">{stats.low}</div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-6 border-b border-[var(--color-border)]">
                {STATUS_TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const count = stats.statuses[tab.id as keyof typeof stats.statuses] || 0;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors -mb-[1px] ${isActive
                                ? "border-white text-white"
                                : "border-transparent text-[var(--color-textSecondary)] hover:text-white"
                                }`}
                        >
                            <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/10 text-white' : 'bg-[#0D1117] border border-[var(--color-border)] text-[var(--color-textMuted)]'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search issues..."
                        className="w-full bg-[#0D1117] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--color-textSecondary)] focus:outline-none focus:border-[var(--color-cyan)] focus:text-white transition-colors"
                    />
                </div>

                {/* Dropdowns */}
                <FilterDropdown
                    label="All Severity"
                    value={severityFilter}
                    onChange={setSeverityFilter}
                    options={[
                        { value: "all", label: "All Severity" },
                        { value: "critical", label: "Critical", color: "bg-[var(--color-red)]" },
                        { value: "high", label: "High", color: "bg-[var(--color-amber)]" },
                        { value: "medium", label: "Medium", color: "bg-blue-400" },
                        { value: "low", label: "Low", color: "bg-[var(--color-green)]" }
                    ]}
                />

                <FilterDropdown
                    label="All Repositories"
                    value={repoFilter}
                    onChange={setRepoFilter}
                    align="right"
                    options={[
                        { value: "all", label: "All Repositories" },
                        ...repoOptions
                    ]}
                />

                <FilterDropdown
                    label="All Domains"
                    value={domainFilter}
                    onChange={setDomainFilter}
                    align="right"
                    options={[
                        { value: "all", label: "All Domains" },
                        ...domainOptions
                    ]}
                />
            </div>

            {/* Table Area / Empty State */}
            <Card className="p-0 overflow-hidden border border-[var(--color-border)] bg-[#0D1117]">
                {loading ? (
                    <div className="flex justify-center py-20 text-[var(--color-textMuted)] text-sm">
                        Loading issues...
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <List className="h-5 w-5 text-[var(--color-textMuted)]" />
                        </div>
                        <h3 className="text-sm font-medium text-[var(--color-textSecondary)]">No issues</h3>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#0D1117] border-b border-[var(--color-border)] font-syne text-[var(--color-textMuted)]">
                                    <tr>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs w-28">Severity</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Vulnerability Name</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Target</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Fix Time</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Date Found</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {paginatedIssues.map((issue) => {
                                        const conf = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;

                                        // Target display logic — repositories use full_name or name
                                        let targetName = 'Unknown Target';
                                        if (issue.repository_id && issue.repositories) {
                                            targetName = issue.repositories.full_name || 'Repo';
                                        } else if (issue.domain_id && issue.domains?.domain) {
                                            targetName = issue.domains.domain;
                                        } else if (issue.pentests?.name) {
                                            targetName = issue.pentests.name;
                                        }

                                        return (
                                            <tr key={issue.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSidebarId(issue.id)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${conf.bg.replace('/10', '')} ${conf.color.replace('text-', 'bg-')}`} />
                                                        <span className={`text-[13px] font-medium capitalize ${conf.color}`}>
                                                            {issue.severity}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white group-hover:text-[var(--color-cyan)] transition-colors line-clamp-2 md:line-clamp-none">
                                                        {issue.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[var(--color-textSecondary)] text-sm">
                                                    {targetName}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--color-textMuted)] text-xs font-mono whitespace-nowrap">
                                                    {fixTime(issue.severity)}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--color-textSecondary)] text-xs whitespace-nowrap">
                                                    {new Date(issue.found_at || issue.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="border-t border-[var(--color-border)] px-4">
                            <Pagination
                                total={filteredIssues.length}
                                page={page}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                            />
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
