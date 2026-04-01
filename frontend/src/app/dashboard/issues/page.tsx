"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues, getDomains, getRepositories } from "@/lib/queries";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";
import { supabase } from "@/lib/supabase";

// ─────────────── Aikido-style Severity Config ───────────────
const SEVERITY_CONFIG: Record<string, { color: string, bg: string, dot: string, label: string }> = {
    critical: { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500", label: "Critical" },
    high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High" },
    medium:   { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", label: "Medium" },
    low:      { color: "text-green-700", bg: "bg-green-50 border-green-200", dot: "bg-green-500", label: "Low" },
};

// ─────────────── Issue Type Categories ───────────────
const ISSUE_TYPES = [
    { id: "open-source", label: "Open-source Dependencies", icon: "📦", keywords: ["dependency", "package", "npm", "yarn"] },
    { id: "sast", label: "SAST", icon: "{}", keywords: ["injection", "xss", "sqli", "code"] },
    { id: "iac", label: "Infrastructure As Code", icon: "🏗", keywords: ["terraform", "cloudformation", "infrastructure"] },
    { id: "secrets", label: "Exposed Secrets", icon: "🔑", keywords: ["secret", "key", "token", "password", "credential"] },
    { id: "dast", label: "DAST/Surface Monitoring", icon: "🌐", keywords: ["http", "request", "response", "web"] },
    { id: "ai-pentest", label: "AI Pentest Issues", icon: "⚡", keywords: ["pentest", "penetration"] },
    { id: "cloud", label: "Cloud Configurations", icon: "☁", keywords: ["aws", "azure", "gcp", "cloud"] },
    { id: "k8s", label: "Kubernetes Configurations", icon: "⚙", keywords: ["kubernetes", "k8s", "container"] },
    { id: "container", label: "Container Images", icon: "📦", keywords: ["docker", "container", "image"] },
    { id: "mobile", label: "Mobile Issues", icon: "📱", keywords: ["mobile", "android", "ios"] },
    { id: "malware", label: "Malware Issues", icon: "⚠", keywords: ["malware", "virus", "trojan"] },
    { id: "eol", label: "End-of-life Runtimes", icon: "⏰", keywords: ["deprecated", "eol", "end-of-life"] },
    { id: "access", label: "Access Controls", icon: "🔐", keywords: ["access", "permission", "auth"] },
    { id: "license", label: "License Issues", icon: "📄", keywords: ["license", "copyright"] },
];

// ─────────────── Quick Filters ───────────────
const QUICK_FILTERS = [
    { id: "quick-fixes", label: "Quick Fixes", icon: "⚡" },
    { id: "sla-soon", label: "SLA Due Soon", icon: "⏰" },
    { id: "out-sla", label: "Out of SLA", icon: "⚠" },
    { id: "recent", label: "Recently Discovered", icon: "🔍" },
    { id: "ignored", label: "Ignored Issues", icon: "👁" },
    { id: "frontend", label: "Frontend", icon: "</>" },
    { id: "backend", label: "Backend", icon: "⚙" },
];

// ─────────────── Severity Progress Bar ───────────────
function SeverityBar({ critical, high, medium, low }: { critical: number; high: number; medium: number; low: number }) {
    const total = critical + high + medium + low;
    if (total === 0) return <div className="h-2 w-full rounded-full bg-gray-200" />;

    const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

    return (
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200">
            {critical > 0 && <div className="bg-red-500 h-full" style={{ width: pct(critical) }} />}
            {high     > 0 && <div className="bg-orange-500 h-full" style={{ width: pct(high) }} />}
            {medium   > 0 && <div className="bg-blue-500 h-full" style={{ width: pct(medium) }} />}
            {low      > 0 && <div className="bg-green-500 h-full" style={{ width: pct(low) }} />}
        </div>
    );
}

// ─────────────── Type Badge (TS, JS, etc.) ───────────────
function TypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        ts: "bg-blue-100 text-blue-700 border-blue-300",
        js: "bg-yellow-100 text-yellow-700 border-yellow-300",
        http: "bg-purple-100 text-purple-700 border-purple-300",
        py: "bg-green-100 text-green-700 border-green-300",
        go: "bg-cyan-100 text-cyan-700 border-cyan-300",
        default: "bg-gray-100 text-gray-700 border-gray-300",
    };

    const color = colors[type.toLowerCase()] || colors.default;

    return (
        <div className={`h-7 w-9 rounded border flex items-center justify-center text-[10px] font-bold font-mono ${color}`}>
            {type.toUpperCase()}
        </div>
    );
}

// ─────────────── Main Component ───────────────
export default function IssuesPage() {
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<any[]>([]);
    const [userName, setUserName] = useState("there");
    const { activeWorkspace } = useWorkspace();

    // Filters state
    const [activeTab, setActiveTab] = useState("all-findings");
    const [sidebarId, setSidebarId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [quickFiltersOpen, setQuickFiltersOpen] = useState(false);
    const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
    const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
    const [languageFilter, setLanguageFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const quickFiltersRef = useRef<HTMLDivElement>(null);
    const actionsDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user name
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const meta = data?.user?.user_metadata || {};
            const name = meta.full_name || meta.name || data?.user?.email?.split("@")[0] || "there";
            setUserName(name.split(" ")[0]);
        });
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node))
                setTypeDropdownOpen(false);
            if (quickFiltersRef.current && !quickFiltersRef.current.contains(e.target as Node))
                setQuickFiltersOpen(false);
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node))
                setActionsDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const issuesData = await getIssues(activeWorkspace.id);
                setIssues(issuesData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeWorkspace]);

    // ─── Derived Stats ───
    const stats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const openIssues = issues.filter(i => i.status === 'open' || !i.status);
        const critical = openIssues.filter(i => i.severity === 'critical').length;
        const high = openIssues.filter(i => i.severity === 'high').length;
        const medium = openIssues.filter(i => i.severity === 'medium').length;
        const low = openIssues.filter(i => i.severity === 'low').length;

        const autoIgnored = issues.filter(i => i.status === 'ignored' && i.is_false_positive);
        const hoursSaved = autoIgnored.reduce((sum, i) => sum + (i.hours_saved || 0), 0);

        const newCount = issues.filter(i => new Date(i.found_at || i.created_at) >= weekAgo).length;
        const solvedCount = issues.filter(i =>
            i.status === 'fixed' && new Date(i.updated_at || i.created_at) >= weekAgo
        ).length;

        return {
            openTotal: openIssues.length,
            critical,
            high,
            medium,
            low,
            autoIgnored: autoIgnored.length,
            hoursSaved: Math.round(hoursSaved * 10) / 10,
            newCount,
            solvedCount,
        };
    }, [issues]);

    // ─── Helper: Detect issue type ───
    const detectIssueType = (issue: any): string => {
        const title = (issue.title || '').toLowerCase();
        const desc = (issue.description || '').toLowerCase();
        const combined = title + ' ' + desc;

        for (const type of ISSUE_TYPES) {
            if (type.keywords.some(kw => combined.includes(kw))) {
                return type.id;
            }
        }
        return 'other';
    };

    // ─── Helper: Detect language from file path ───
    const detectLanguage = (issue: any): string => {
        const filePath = issue.file_path || issue.title || '';
        if (filePath.endsWith('.ts')) return 'TypeScript';
        if (filePath.endsWith('.js')) return 'JavaScript';
        if (filePath.endsWith('.py')) return 'Python';
        if (filePath.endsWith('.go')) return 'Go';
        if (filePath.endsWith('.java')) return 'Java';
        if (filePath.endsWith('.rb')) return 'Ruby';
        return 'Other';
    };

    // ─── Helper: Get file extension for badge ───
    const getTypeIcon = (issue: any): string => {
        const filePath = issue.file_path || issue.title || '';
        if (filePath.includes('.ts')) return 'TS';
        if (filePath.includes('.js')) return 'JS';
        if (filePath.includes('.py')) return 'PY';
        if (filePath.includes('.go')) return 'GO';
        if (issue.pentest_id || filePath.includes('http')) return 'HTTP';
        return 'TS';
    };

    // ─── Helper: Is quick fix? ───
    const isQuickFix = (issue: any): boolean => {
        const severity = issue.severity || 'low';
        return severity === 'low' || severity === 'medium';
    };

    // ─── Helper: Is recently discovered? ───
    const isRecentlyDiscovered = (issue: any): boolean => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return new Date(issue.found_at || issue.created_at) >= threeDaysAgo;
    };

    // ─── Helper: Is frontend/backend? ───
    const isFrontend = (issue: any): boolean => {
        const path = (issue.file_path || issue.title || '').toLowerCase();
        return path.includes('frontend') || path.includes('client') || path.includes('ui') ||
               path.includes('component') || path.includes('react') || path.includes('vue');
    };

    const isBackend = (issue: any): boolean => {
        const path = (issue.file_path || issue.title || '').toLowerCase();
        return path.includes('backend') || path.includes('server') || path.includes('api') ||
               path.includes('controller') || path.includes('service') || path.includes('database');
    };

    // ─── Filtering Logic ───
    const filteredIssues = issues.filter(i => {
        // Only show open issues
        const stat = i.status || 'open';
        if (stat !== 'open') return false;

        // Type filter
        if (selectedTypes.length > 0) {
            const issueType = detectIssueType(i);
            if (!selectedTypes.includes(issueType)) return false;
        }

        // Severity filter
        if (severityFilter !== 'all' && i.severity !== severityFilter) return false;

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'new' && !isRecentlyDiscovered(i)) return false;
            if (statusFilter === 'ignored' && i.status !== 'ignored') return false;
        }

        // Language filter
        if (languageFilter !== 'all') {
            const lang = detectLanguage(i);
            if (lang !== languageFilter) return false;
        }

        // Quick filters
        if (selectedQuickFilters.includes('quick-fixes') && !isQuickFix(i)) return false;
        if (selectedQuickFilters.includes('recent') && !isRecentlyDiscovered(i)) return false;
        if (selectedQuickFilters.includes('ignored') && i.status !== 'ignored') return false;
        if (selectedQuickFilters.includes('frontend') && !isFrontend(i)) return false;
        if (selectedQuickFilters.includes('backend') && !isBackend(i)) return false;

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

    // ─── Get unique languages from issues ───
    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        issues.forEach(i => langs.add(detectLanguage(i)));
        return Array.from(langs).sort();
    }, [issues]);

    // ─── Toggle type selection ───
    const toggleType = (typeId: string) => {
        setSelectedTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(t => t !== typeId)
                : [...prev, typeId]
        );
    };

    // ─── Toggle quick filter ───
    const toggleQuickFilter = (filterId: string) => {
        setSelectedQuickFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    // ─── Clear all filters ───
    const clearAllFilters = () => {
        setSelectedTypes([]);
        setSelectedQuickFilters([]);
        setLanguageFilter('all');
        setSeverityFilter('all');
        setStatusFilter('all');
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) =>
                    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
                }
                allIds={filteredIssues.map((i: any) => i.id)}
            />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* ─── Header with Greeting ─── */}
                <div className="flex items-center justify-between">
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

                {/* ──────────── 4 METRIC CARDS (Aikido-exact) ──────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Open Issues (left, spans 2 rows) */}
                    <div className="md:row-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="mb-4">
                            <SeverityBar
                                critical={stats.critical}
                                high={stats.high}
                                medium={stats.medium}
                                low={stats.low}
                            />
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-bold text-gray-900">{stats.openTotal}</span>
                            <span className="text-gray-600 text-base">Open Issues</span>
                        </div>
                        <div className="flex gap-4 text-sm font-medium">
                            {stats.critical > 0 && <span className="text-red-600">■ {stats.critical}</span>}
                            {stats.high     > 0 && <span className="text-orange-600">■ {stats.high}</span>}
                            {stats.medium   > 0 && <span className="text-blue-600">■ {stats.medium}</span>}
                            {stats.low      > 0 && <span className="text-green-600">■ {stats.low}</span>}
                        </div>
                    </div>

                    {/* 2. Auto Ignored */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg">
                                ⚙
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Auto Ignored</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.autoIgnored}</div>
                        <div className="text-sm text-gray-500">{stats.hoursSaved} hours saved</div>
                    </div>

                    {/* 3. New */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-bold">
                                ●
                            </div>
                            <span className="text-sm text-gray-600 font-medium">New</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.newCount}</div>
                        <div className="text-sm text-gray-500">in last 7 days</div>
                    </div>

                    {/* 4. Solved */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm md:col-start-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg font-bold">
                                ✓
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Solved</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.solvedCount}</div>
                        <div className="text-sm text-gray-500">in last 7 days</div>
                    </div>
                </div>

                {/* ──────────── FILTERS & TABLE ──────────── */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Filters Row */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search"
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tab Pills */}
                        <button
                            onClick={() => setActiveTab("all-findings")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "all-findings"
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            All findings
                        </button>
                        <button
                            onClick={() => setActiveTab("zentinel-refined")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === "zentinel-refined"
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Zentinel refined
                        </button>

                        {/* All types dropdown */}
                        <div className="relative" ref={typeDropdownRef}>
                            <button
                                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    selectedTypes.length > 0
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                All types
                                {selectedTypes.length > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{selectedTypes.length}</span>}
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {typeDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-96 overflow-y-auto">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 flex items-center justify-between">
                                        Show issue type
                                        <button
                                            onClick={() => setSelectedTypes(ISSUE_TYPES.map(t => t.id))}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            Select all
                                        </button>
                                    </div>
                                    {ISSUE_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => toggleType(type.id)}
                                            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                                selectedTypes.includes(type.id)
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(type.id)}
                                                onChange={() => {}}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="text-base">{type.icon}</span>
                                            <span className="flex-1">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Filter icon */}
                        <div className="relative" ref={quickFiltersRef}>
                            <button
                                onClick={() => setQuickFiltersOpen(!quickFiltersOpen)}
                                className={`p-2 rounded-lg transition-colors ${
                                    selectedQuickFilters.length > 0 || severityFilter !== 'all' || languageFilter !== 'all' || statusFilter !== 'all'
                                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <Filter className="h-4 w-4" />
                            </button>
                            {quickFiltersOpen && (
                                <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-3">
                                    <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-200 flex items-center justify-between">
                                        Quick Filters
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-normal"
                                        >
                                            Clear Filter
                                        </button>
                                    </div>
                                    <div className="p-3 space-y-1">
                                        {QUICK_FILTERS.map(filter => (
                                            <button
                                                key={filter.id}
                                                onClick={() => toggleQuickFilter(filter.id)}
                                                className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                    selectedQuickFilters.includes(filter.id)
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                <span>{filter.icon}</span>
                                                <span className="flex-1">{filter.label}</span>
                                                {selectedQuickFilters.includes(filter.id) && (
                                                    <ChevronRight className="h-4 w-4 text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="px-4 pt-3 pb-2 space-y-3 border-t border-gray-200">
                                        {/* Language */}
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1.5 block">Language</label>
                                            <select
                                                value={languageFilter}
                                                onChange={(e) => setLanguageFilter(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">All Languages</option>
                                                {availableLanguages.map(lang => (
                                                    <option key={lang} value={lang}>{lang}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Severity */}
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1.5 block">Severity</label>
                                            <select
                                                value={severityFilter}
                                                onChange={(e) => setSeverityFilter(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">All Severities</option>
                                                <option value="critical">Critical</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                        {/* Status */}
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1.5 block">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="open">Open</option>
                                                <option value="new">New</option>
                                                <option value="ignored">Ignored</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions dropdown (right side) */}
                        <div className="ml-auto relative" ref={actionsDropdownRef}>
                            <button
                                onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Actions
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {actionsDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Export to CSV
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Mark all as read
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Bulk ignore
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active filters display */}
                    {(selectedTypes.length > 0 || selectedQuickFilters.length > 0 || searchQuery) && (
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-600 font-medium">Active filters:</span>
                            {selectedTypes.map(typeId => {
                                const type = ISSUE_TYPES.find(t => t.id === typeId);
                                return type ? (
                                    <span key={typeId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                                        {type.icon} {type.label}
                                        <button onClick={() => toggleType(typeId)} className="hover:text-blue-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ) : null;
                            })}
                            {selectedQuickFilters.map(filterId => {
                                const filter = QUICK_FILTERS.find(f => f.id === filterId);
                                return filter ? (
                                    <span key={filterId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                                        {filter.icon} {filter.label}
                                        <button onClick={() => toggleQuickFilter(filterId)} className="hover:text-purple-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ) : null;
                            })}
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:text-gray-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* ──────────── TABLE ──────────── */}
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500 text-sm">
                            Loading issues...
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-2xl">
                                📋
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 mb-1">No issues found</h3>
                            <p className="text-xs text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Type</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Name</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Severity</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Location</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Fix time</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredIssues.map((issue) => {
                                        const conf = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
                                        const typeIcon = getTypeIcon(issue);

                                        // Determine location
                                        let locationName = 'Unknown';
                                        let filePath = '';
                                        if (issue.repository_id && issue.repositories) {
                                            locationName = issue.repositories.full_name || 'Repo';
                                        } else if (issue.domain_id && issue.domains?.domain) {
                                            locationName = issue.domains.domain;
                                        } else if (issue.pentests?.name) {
                                            locationName = issue.pentests.name;
                                        }

                                        // Extract file path from title or use mock
                                        filePath = issue.file_path || issue.title?.split(' ')[0] || 'file.ts';

                                        const isNew = isRecentlyDiscovered(issue);
                                        const isAutoIgnored = issue.status === 'ignored' && issue.is_false_positive;

                                        return (
                                            <tr
                                                key={issue.id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                                onClick={() => setSidebarId(issue.id)}
                                            >
                                                {/* Type */}
                                                <td className="px-5 py-4">
                                                    <TypeBadge type={typeIcon} />
                                                </td>

                                                {/* Name */}
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        {issue.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        in {filePath}
                                                    </div>
                                                </td>

                                                {/* Severity */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                                        {conf.label}
                                                    </span>
                                                </td>

                                                {/* Location */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                        </svg>
                                                        <span className="text-sm">{locationName}</span>
                                                    </div>
                                                </td>

                                                {/* Fix time */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {fixTime(issue.severity)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    {isAutoIgnored ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-gray-100">
                                                            Auto Ignored
                                                        </span>
                                                    ) : isNew ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-purple-700 bg-purple-100 border border-purple-200">
                                                            New
                                                        </span>
                                                    ) : (
                                                        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                                                            View Fix
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
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
