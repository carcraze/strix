"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search, EyeOff, ShieldCheck, ChevronDown, Filter,
    RefreshCw, Folder, ChevronRight,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues } from "@/lib/queries";
import { IssueSidebar } from "@/components/issues/IssueSidebar";

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500",    label: "Critical" },
    high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High"     },
    medium:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500",   label: "Medium"   },
    low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Low"      },
};

const ISSUE_TYPE_OPTIONS = [
    "All Ignored Issues",
    "Manually Ignored",
    "Ignored via Rule",
    "Automatically Ignored",
] as const;

const TYPE_OPTIONS = [
    "All types", "JavaScript", "TypeScript", "PHP", "Java", "Scala", "Go",
    "Python", "Ruby", ".NET", "Rust", "Dart", "Swift", "Elixir", "C/C++",
];

const LANGUAGE_OPTIONS = [
    "All Languages", "JavaScript", "TypeScript", "PHP", "Java", "Scala", "Go",
    "Python", "Ruby", ".NET", "Rust", "Dart", "Swift", "Elixir", "C/C++",
    "Clojure", "Kotlin", "Apex", "Visual Basic",
];

const REASON_DOT: Record<string, string> = {
    ai:         "bg-orange-400",
    dependency: "bg-blue-400",
    token:      "bg-green-500",
    function:   "bg-gray-700",
    default:    "bg-gray-400",
};

const REASON_DESCRIPTIONS: Record<string, string> = {
    "Dependency not used in production":
        "This package is part of the toolchain used to build and test your application. Since it is not shipped to production, resolving the issue is not urgent.",
    "Exploit affects only end-user browser speed":
        "This exploit can only cause the application to become slower in the end-user's browser. Since there is no security risk, Zentinel has downgraded its severity.",
    "AI assessed finding as false positive":
        "Zentinel's AI assessment ignored this finding because it appears to be a false positive based on context analysis.",
    "Affected function not in use":
        "Zentinel conducted a reachability analysis and determined that the affected function is not in use within your codebase.",
    "Expired token":
        "Zentinel determined that this token is revoked or expired and no longer poses a risk.",
};

const DOT_CYCLE = [
    "bg-blue-400", "bg-green-500", "bg-orange-400", "bg-gray-700", "bg-green-400",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeIcon(issue: Record<string, unknown>): string {
    const fp = (issue.file_path as string) || (issue.title as string) || "";
    if (fp.includes(".ts"))  return "TS";
    if (fp.includes(".js"))  return "JS";
    if (fp.includes(".py"))  return "PY";
    if (fp.includes(".go"))  return "GO";
    if (fp.includes(".php")) return "PHP";
    if (fp.includes(".rb"))  return "RB";
    if (issue.pentest_id || fp.includes("http")) return "HTTP";
    return "TS";
}

function getLocation(issue: Record<string, unknown>): string {
    if (issue.repository_id && (issue as Record<string, Record<string, unknown>>).repositories)
        return ((issue as Record<string, Record<string, unknown>>).repositories.full_name as string) || "Repo";
    if (issue.domain_id && (issue as Record<string, Record<string, unknown>>).domains?.domain)
        return (issue as Record<string, Record<string, unknown>>).domains.domain as string;
    if ((issue as Record<string, Record<string, unknown>>).pentests?.name)
        return (issue as Record<string, Record<string, unknown>>).pentests.name as string;
    return "Unknown";
}

function getReasonDot(reason: string): string {
    if (!reason) return REASON_DOT.default;
    const r = reason.toLowerCase();
    if (r.includes("ai") || r.includes("false positive")) return REASON_DOT.ai;
    if (r.includes("dependency") || r.includes("prod"))   return REASON_DOT.dependency;
    if (r.includes("token") || r.includes("expired"))     return REASON_DOT.token;
    if (r.includes("function") || r.includes("use"))      return REASON_DOT.function;
    return REASON_DOT.default;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        ts:   "bg-blue-100 text-blue-700 border-blue-300",
        js:   "bg-yellow-100 text-yellow-700 border-yellow-300",
        http: "bg-blue-100 text-blue-700 border-blue-300",
        py:   "bg-green-100 text-green-700 border-green-300",
        go:   "bg-cyan-100 text-cyan-700 border-cyan-300",
        php:  "bg-indigo-100 text-indigo-700 border-indigo-300",
        rb:   "bg-red-100 text-red-700 border-red-300",
    };
    const color = colors[type.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-300";
    return (
        <div className={`h-7 w-9 rounded border flex items-center justify-center text-[10px] font-bold font-mono ${color}`}>
            {type.toUpperCase()}
        </div>
    );
}

function DropdownButton({
    label,
    options,
    selected,
    onSelect,
}: {
    label: string;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-gray-700 font-medium whitespace-nowrap"
            >
                {selected} <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => { onSelect(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selected === opt ? "text-blue-700 font-semibold" : "text-gray-700"}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IgnoredPage() {
    const { activeWorkspace } = useWorkspace();

    const [loading, setLoading]             = useState(true);
    const [allIssues, setAllIssues]         = useState<Record<string, unknown>[]>([]);
    const [searchQuery, setSearchQuery]     = useState("");
    const [sidebarId, setSidebarId]         = useState<string | null>(null);
    const [activeTab, setActiveTab]         = useState<"issues" | "reasons">("issues");
    const [ignoreTypeFilter, setIgnoreTypeFilter] = useState("All Ignored Issues");
    const [typeFilter, setTypeFilter]       = useState("All types");
    const [langFilter, setLangFilter]       = useState("All Languages");
    const [severityFilter, setSeverityFilter] = useState("All Severities");
    const [showFilters, setShowFilters]     = useState(false);
    const [refreshKey, setRefreshKey]       = useState(0);

    useEffect(() => {
        if (!activeWorkspace) return;
        setLoading(true);
        getIssues(activeWorkspace.id)
            .then(data => { setAllIssues((data as any[]) || []); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [activeWorkspace, refreshKey]);

    // Derived stats
    const ignoredIssues = useMemo(
        () => allIssues.filter(i => i.status === "ignored"),
        [allIssues]
    );

    const autoIgnored = useMemo(
        () => ignoredIssues.filter(i => i.is_false_positive),
        [ignoredIssues]
    );

    const hoursSaved = useMemo(
        () => Math.round(autoIgnored.reduce((acc, i) => acc + ((i.hours_saved as number) || 0), 0)),
        [autoIgnored]
    );

    const mostCommonReason = useMemo(() => {
        const freq: Record<string, number> = {};
        for (const i of ignoredIssues) {
            const r = (i.auto_ignore_reason as string) || "";
            if (r) freq[r] = (freq[r] || 0) + 1;
        }
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : "AI assessed finding as false positive";
    }, [ignoredIssues]);

    // Filtered list for tab 1
    const filteredIssues = useMemo(() => {
        return ignoredIssues.filter(i => {
            // ignore type filter
            if (ignoreTypeFilter === "Automatically Ignored" && !i.is_false_positive) return false;
            if (ignoreTypeFilter === "Manually Ignored" && (i.is_false_positive || i.auto_ignore_reason)) return false;
            if (ignoreTypeFilter === "Ignored via Rule" && !i.auto_ignore_reason) return false;

            // type filter (file extension)
            if (typeFilter !== "All types") {
                const fp = ((i.file_path as string) || "").toLowerCase();
                const map: Record<string, string> = {
                    "TypeScript": ".ts", "JavaScript": ".js", "Python": ".py",
                    "Go": ".go", "PHP": ".php", "Ruby": ".rb",
                };
                const ext = map[typeFilter];
                if (ext && !fp.includes(ext)) return false;
            }

            // language filter (same as type but from second dropdown)
            if (langFilter !== "All Languages") {
                const fp = ((i.file_path as string) || "").toLowerCase();
                const map: Record<string, string> = {
                    "TypeScript": ".ts", "JavaScript": ".js", "Python": ".py",
                    "Go": ".go", "PHP": ".php", "Ruby": ".rb",
                };
                const ext = map[langFilter];
                if (ext && !fp.includes(ext)) return false;
            }

            // severity filter
            if (severityFilter !== "All Severities" && i.severity !== severityFilter.toLowerCase()) return false;

            // search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const title = ((i.title as string) || "").toLowerCase();
                const desc  = ((i.description as string) || "").toLowerCase();
                if (!title.includes(q) && !desc.includes(q)) return false;
            }

            return true;
        });
    }, [ignoredIssues, ignoreTypeFilter, typeFilter, langFilter, severityFilter, searchQuery]);

    // Grouped reasons for tab 2
    const reasonGroups = useMemo(() => {
        const freq: Record<string, number> = {};
        for (const i of ignoredIssues) {
            const r = (i.auto_ignore_reason as string) || "AI assessed finding as false positive";
            freq[r] = (freq[r] || 0) + 1;
        }
        return Object.entries(freq).sort((a, b) => b[1] - a[1]);
    }, [ignoredIssues]);

    return (
        <div className="bg-white min-h-screen">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) =>
                    setAllIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
                }
                allIds={filteredIssues.map(i => i.id as string)}
            />

            {/* ── Top breadcrumb bar ── */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 text-sm">
                <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-xs">
                    All Teams <ChevronDown className="h-3 w-3" />
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">All issues</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900">Ignored issues</span>
                <div className="ml-auto flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                        <Search className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-6xl mx-auto px-6 py-6">

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <EyeOff className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">
                                {autoIgnored.length} auto ignored issue{autoIgnored.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-sm text-gray-500">{autoIgnored.length} this week</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">{hoursSaved} hours saved!</p>
                            <p className="text-sm text-gray-500">So much more time for activities</p>
                        </div>
                    </div>
                </div>

                {/* ── Most common reason card ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-700">Most common auto ignore reason</p>
                    <p className="text-sm text-gray-500 mt-0.5">{mostCommonReason}</p>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-200 mb-4">
                    {(["issues", "reasons"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${
                                activeTab === tab
                                    ? "text-blue-700"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab === "issues" ? "Ignored issues" : "Ignore reasons"}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════
                    TAB 1: IGNORED ISSUES
                ════════════════════════════════════════ */}
                {activeTab === "issues" && (
                    <>
                        {/* Toolbar */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search…"
                                    className="pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                />
                            </div>

                            {/* Ignore type dropdown */}
                            <DropdownButton
                                label="All Ignored Issues"
                                options={[...ISSUE_TYPE_OPTIONS]}
                                selected={ignoreTypeFilter}
                                onSelect={setIgnoreTypeFilter}
                            />

                            {/* Types dropdown */}
                            <DropdownButton
                                label="All types"
                                options={TYPE_OPTIONS}
                                selected={typeFilter}
                                onSelect={setTypeFilter}
                            />

                            {/* Quick filter toggle */}
                            <button
                                onClick={() => setShowFilters(f => !f)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-full transition-colors font-medium ${
                                    showFilters
                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <Filter className="h-3.5 w-3.5" /> Filters
                            </button>

                            {/* Refresh */}
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Refresh
                            </button>
                        </div>

                        {/* Quick filters panel */}
                        {showFilters && (
                            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</span>
                                    <select
                                        value={langFilter}
                                        onChange={e => setLangFilter(e.target.value)}
                                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {LANGUAGE_OPTIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</span>
                                    <select
                                        value={severityFilter}
                                        onChange={e => setSeverityFilter(e.target.value)}
                                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {["All Severities", "Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discovery</span>
                                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option>Recently Discovered</option>
                                        <option>Oldest First</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Surface</span>
                                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option>All</option>
                                        <option>Frontend</option>
                                        <option>Backend</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Issues table */}
                        {loading ? (
                            <div className="flex justify-center py-20 text-gray-400 text-sm">Loading…</div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-200 rounded-xl bg-white">
                                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                    <EyeOff className="h-7 w-7 text-blue-500" />
                                </div>
                                <p className="font-semibold text-gray-900 text-base mb-1">No ignored issues yet.</p>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    Issues that are ignored manually, via rule, or by AI will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white w-full">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200 w-20">Type</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200">Name</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200">Reason for ignoring</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200 w-28">Severity</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide w-40">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIssues.map((issue, idx) => {
                                            const conf       = SEVERITY_CONFIG[(issue.severity as string)] ?? SEVERITY_CONFIG.low;
                                            const typeIcon   = getTypeIcon(issue);
                                            const location   = getLocation(issue);
                                            const filePath   = (issue.file_path as string) || (issue.title as string)?.split(" ")[0] || "file.ts";
                                            const reason     = (issue.auto_ignore_reason as string) || (issue.is_false_positive ? "AI assessed finding as false positive" : "Manually ignored");
                                            const shortReason = reason.length > 40 ? reason.slice(0, 40) + "…" : reason;
                                            const dotColor   = getReasonDot(reason);

                                            return (
                                                <tr
                                                    key={issue.id as string}
                                                    onClick={() => setSidebarId(issue.id as string)}
                                                    className={`cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 ${idx === filteredIssues.length - 1 ? "border-b-0" : ""}`}
                                                >
                                                    <td className="px-4 py-3 border-r border-gray-200">
                                                        <TypeBadge type={typeIcon} />
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-gray-200 max-w-[260px]">
                                                        <div className="font-medium text-gray-900 truncate">{issue.title as string}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5 truncate">{filePath}</div>
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-gray-200">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                                            <span className="text-sm text-gray-700">{shortReason}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-gray-200">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                                            {conf.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                            <Folder className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                            <span className="truncate max-w-[140px]">{location}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════
                    TAB 2: IGNORE REASONS
                ════════════════════════════════════════ */}
                {activeTab === "reasons" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-20 text-gray-400 text-sm">Loading…</div>
                        ) : reasonGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-200 rounded-xl bg-white">
                                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <EyeOff className="h-7 w-7 text-gray-400" />
                                </div>
                                <p className="font-semibold text-gray-900 text-base mb-1">No ignore reasons yet.</p>
                                <p className="text-sm text-gray-500">Reasons will appear once issues are ignored.</p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white w-full">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200 w-12">#</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200">Reason for ignoring</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide border-r border-gray-200 w-28"># Issues</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wide">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reasonGroups.map(([reason, count], idx) => {
                                            const dot  = DOT_CYCLE[idx % DOT_CYCLE.length];
                                            const desc = REASON_DESCRIPTIONS[reason] ?? "Zentinel automatically ignored this finding based on security analysis.";
                                            return (
                                                <tr
                                                    key={reason}
                                                    className={`border-b border-gray-200 ${idx === reasonGroups.length - 1 ? "border-b-0" : ""}`}
                                                >
                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs border-r border-gray-200">{idx + 1}</td>
                                                    <td className="px-4 py-3 border-r border-gray-200">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                                                            <span className="font-medium text-gray-900">{reason}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-r border-gray-200">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                            {count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-sm">{desc}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
