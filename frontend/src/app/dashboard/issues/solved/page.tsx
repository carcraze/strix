"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, ChevronDown, SlidersHorizontal, CheckCircle2,
    History, Code2, Server, Folder, ChevronRight, X,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues } from "@/lib/queries";
import { IssueSidebar } from "@/components/issues/IssueSidebar";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500",    label: "Critical" },
    high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High"     },
    medium:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500",   label: "Medium"   },
    low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Low"      },
};

const TYPE_OPTIONS = [
    "All types", "SCA", "SAST", "DAST", "IaC", "Secrets",
    "Container", "License", "API", "Cloud", "Mobile",
    "Supply Chain", "Pentest", "Compliance", "AI",
];

const LANGUAGE_OPTIONS = [
    "All Languages", "JavaScript", "TypeScript", "PHP", "Java", "Scala",
    "Go", "Python", "Ruby", ".NET", "Rust", "Dart", "Swift",
    "Elixir", "C/C++", "Clojure", "Kotlin", "Apex", "Visual Basic",
];

const SEVERITY_OPTIONS = ["All Severities", "Critical", "High", "Medium", "Low"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeLabel(issue: any): string {
    const fp = (issue.file_path || issue.title || "").toLowerCase();
    if (fp.includes(".ts"))  return "TS";
    if (fp.includes(".js"))  return "JS";
    if (fp.includes(".py"))  return "PY";
    if (fp.includes(".go"))  return "GO";
    if (issue.pentest_id || fp.includes("http")) return "HTTP";
    return "TS";
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getLocation(issue: any): string {
    if (issue.repository_id && issue.repositories) return issue.repositories.full_name || "Repo";
    if (issue.domain_id && issue.domains?.domain)  return issue.domains.domain;
    if (issue.pentests?.name)                       return issue.pentests.name;
    return "Unknown";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        ts:      "bg-blue-100 text-blue-700 border-blue-300",
        js:      "bg-yellow-100 text-yellow-700 border-yellow-300",
        http:    "bg-blue-100 text-blue-700 border-blue-300",
        py:      "bg-green-100 text-green-700 border-green-300",
        go:      "bg-cyan-100 text-cyan-700 border-cyan-300",
        default: "bg-gray-100 text-gray-700 border-gray-300",
    };
    const color = colors[type.toLowerCase()] ?? colors.default;
    return (
        <div className={cn("h-7 w-9 rounded border flex items-center justify-center text-[10px] font-bold font-mono", color)}>
            {type.toUpperCase()}
        </div>
    );
}

function SelectPill({
    value, options, onChange,
}: { value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SolvedPage() {
    const { activeWorkspace } = useWorkspace();

    const [loading, setLoading]         = useState(true);
    const [allIssues, setAllIssues]     = useState<any[]>([]);
    const [sidebarId, setSidebarId]     = useState<string | null>(null);

    // Toolbar state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter]   = useState("All types");
    const [showFilters, setShowFilters] = useState(false);

    // Quick-filter state
    const [quickFilter, setQuickFilter]   = useState<"recent" | "frontend" | "backend" | null>(null);
    const [language, setLanguage]         = useState("All Languages");
    const [severityFilter, setSeverity]   = useState("All Severities");

    // ── Data fetch ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeWorkspace) return;
        setLoading(true);
        getIssues(activeWorkspace.id)
            .then(data => { setAllIssues(data || []); setLoading(false); })
            .catch(err  => { console.error(err);      setLoading(false); });
    }, [activeWorkspace]);

    const refresh = () => {
        if (!activeWorkspace) return;
        setLoading(true);
        getIssues(activeWorkspace.id)
            .then(data => { setAllIssues(data || []); setLoading(false); })
            .catch(err  => { console.error(err);      setLoading(false); });
    };

    // ── Filtering ───────────────────────────────────────────────────────────
    const filteredIssues = useMemo(() => {
        return allIssues.filter(issue => {
            if (issue.status !== "fixed") return false;

            // search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!issue.title?.toLowerCase().includes(q) && !issue.description?.toLowerCase().includes(q)) return false;
            }

            // type
            if (typeFilter !== "All types") {
                const label = getTypeLabel(issue);
                if (label !== typeFilter) return false;
            }

            // severity
            if (severityFilter !== "All Severities") {
                if (issue.severity?.toLowerCase() !== severityFilter.toLowerCase()) return false;
            }

            // language filter (maps to file extensions)
            if (language !== "All Languages") {
                const fp = (issue.file_path || "").toLowerCase();
                const langMap: Record<string, string[]> = {
                    TypeScript: [".ts", ".tsx"],
                    JavaScript: [".js", ".jsx"],
                    Python:     [".py"],
                    Go:         [".go"],
                    PHP:        [".php"],
                    Java:       [".java"],
                    Ruby:       [".rb"],
                    Rust:       [".rs"],
                    Swift:      [".swift"],
                    Kotlin:     [".kt"],
                    Dart:       [".dart"],
                };
                const exts = langMap[language];
                if (exts && !exts.some(e => fp.includes(e))) return false;
            }

            // quick filters
            if (quickFilter === "recent") {
                const daysSince = (Date.now() - new Date(issue.created_at || 0).getTime()) / 86400000;
                if (daysSince > 7) return false;
            }
            if (quickFilter === "frontend") {
                const fp = (issue.file_path || "").toLowerCase();
                if (!fp.includes(".ts") && !fp.includes(".js") && !fp.includes(".tsx") && !fp.includes(".jsx")) return false;
            }
            if (quickFilter === "backend") {
                const fp = (issue.file_path || "").toLowerCase();
                if (!fp.includes(".py") && !fp.includes(".go") && !fp.includes(".java") && !fp.includes(".rb")) return false;
            }

            return true;
        });
    }, [allIssues, searchQuery, typeFilter, severityFilter, language, quickFilter]);

    const hasActiveFilters = quickFilter !== null || language !== "All Languages" || severityFilter !== "All Severities";

    const clearFilters = () => {
        setQuickFilter(null);
        setLanguage("All Languages");
        setSeverity("All Severities");
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="bg-white min-h-screen">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) =>
                    setAllIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
                }
                allIds={filteredIssues.map(i => i.id)}
            />

            {/* ── Top header bar ── */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 text-sm">
                <button className="px-3 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1">
                    All Teams <ChevronDown className="h-3 w-3" />
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">All issues</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900">Solved issues</span>
            </div>

            {/* ── Page content ── */}
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Title + count */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Solved issues</h1>
                <div className="mb-6">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search solved issues…"
                            className="pl-9 pr-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                        />
                    </div>

                    {/* Type dropdown */}
                    <SelectPill value={typeFilter} options={TYPE_OPTIONS} onChange={setTypeFilter} />

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(p => !p)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors",
                            showFilters
                                ? "bg-gray-900 text-white border-gray-900"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50",
                        )}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">!</span>
                        )}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={refresh}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>

                {/* ── Quick Filters Panel ── */}
                {showFilters && (
                    <div className="mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quick Filters</span>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <X className="h-3 w-3" /> Clear Filter
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {/* Recently Discovered */}
                            <button
                                onClick={() => setQuickFilter(p => p === "recent" ? null : "recent")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                                    quickFilter === "recent"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100",
                                )}
                            >
                                <History className="h-3.5 w-3.5" /> Recently Discovered
                            </button>

                            {/* Frontend */}
                            <button
                                onClick={() => setQuickFilter(p => p === "frontend" ? null : "frontend")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                                    quickFilter === "frontend"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100",
                                )}
                            >
                                <Code2 className="h-3.5 w-3.5" /> Frontend
                            </button>

                            {/* Backend */}
                            <button
                                onClick={() => setQuickFilter(p => p === "backend" ? null : "backend")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                                    quickFilter === "backend"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100",
                                )}
                            >
                                <Server className="h-3.5 w-3.5" /> Backend
                            </button>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <SelectPill value={language} options={LANGUAGE_OPTIONS} onChange={setLanguage} />
                            <SelectPill value={severityFilter} options={SEVERITY_OPTIONS} onChange={setSeverity} />
                        </div>
                    </div>
                )}

                {/* ── Table ── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500 text-sm">Loading…</div>
                    ) : filteredIssues.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="font-semibold text-gray-700 mt-4">No solved issues yet.</p>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                                No issues solved yet. Once you start resolving them, they&apos;ll be listed here — our scanners will automatically detect and mark issues as solved.
                            </p>
                            <a
                                href="/dashboard/issues"
                                className="mt-4 text-sm text-blue-600 hover:underline"
                            >
                                View open issues
                            </a>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200">Type</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200">Name</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200">Severity</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200">Location</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200">Solved Date</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIssues.map((issue, idx) => {
                                        const conf      = SEVERITY_CONFIG[issue.severity?.toLowerCase()] ?? SEVERITY_CONFIG.low;
                                        const typeLabel = getTypeLabel(issue);
                                        const location  = getLocation(issue);
                                        const filePath  = issue.file_path || issue.title?.split(" ")[0] || "file.ts";
                                        const solvedDate = formatDate(issue.updated_at);
                                        const isLast = idx === filteredIssues.length - 1;

                                        return (
                                            <tr
                                                key={issue.id}
                                                onClick={() => setSidebarId(issue.id)}
                                                className={cn(
                                                    "hover:bg-gray-50 transition-colors cursor-pointer",
                                                    !isLast && "border-b border-gray-200",
                                                )}
                                            >
                                                <td className="px-4 py-4 border-r border-gray-200">
                                                    <TypeBadge type={typeLabel} />
                                                </td>
                                                <td className="px-4 py-4 border-r border-gray-200 max-w-xs">
                                                    <div className="font-medium text-gray-900 truncate">{issue.title}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5 truncate">{filePath}</div>
                                                </td>
                                                <td className="px-4 py-4 border-r border-gray-200">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                                                        conf.bg, conf.color,
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", conf.dot)} />
                                                        {conf.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 border-r border-gray-200">
                                                    <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                                                        <Folder className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{location}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-r border-gray-200 text-gray-600 text-sm whitespace-nowrap">
                                                    {solvedDate}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
