"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Settings, Filter, ChevronDown, Shield, Package, Braces, Server, KeyRound, Waves, Cog, Code2, Cloud, Globe, Container, Monitor, Zap, Clock, AlertTriangle, History, Ban, RefreshCw, Download, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type Issue = {
  id: string;
  title: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "fixed" | "snoozed" | "ignored";
  scan_type: string;
  language: string | null;
  is_false_positive: boolean;
  file_path: string | null;
  found_at: string;
  created_at: string;
  repository_id: string | null;
  pentest_id: string | null;
  repositories: { full_name: string } | null;
  pentests: { name: string } | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SEV_CONFIG = {
  critical: { label: "Critical", dot: "bg-red-500", pill: "bg-red-50 text-red-700 border border-red-200" },
  high: { label: "High", dot: "bg-orange-400", pill: "bg-orange-50 text-orange-700 border border-orange-200" },
  medium: { label: "Medium", dot: "bg-yellow-400", pill: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  low: { label: "Low", dot: "bg-green-400", pill: "bg-green-50 text-green-700 border border-green-200" },
} as const;

const SCAN_TYPE_GROUPS = [
  [
    { value: "sca", label: "Open-source Dependencies", Icon: Package },
    { value: "sast", label: "SAST", Icon: Braces },
    { value: "iac", label: "Infrastructure as Code", Icon: Server },
    { value: "secrets", label: "Exposed Secrets", Icon: KeyRound },
  ],
  [
    { value: "dast", label: "DAST/Surface Monitoring", Icon: Waves },
    { value: "pentest", label: "AI Pentest Issues", Icon: Cog },
    { value: "code_quality", label: "Code Audit Issues", Icon: Code2 },
  ],
  [
    { value: "cloud", label: "Cloud Configurations", Icon: Cloud },
    { value: "k8s", label: "Kubernetes Configurations", Icon: Globe },
    { value: "container", label: "Container Images", Icon: Container },
    { value: "vm", label: "Virtual Machines", Icon: Monitor },
  ],
];

const ALL_SCAN_TYPES = SCAN_TYPE_GROUPS.flat().map((t) => t.value);

const TYPE_BADGE: Record<string, { abbr: string; color: string }> = {
  sca: { abbr: "SCA", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  sast: { abbr: "SAST", color: "bg-blue-100 text-blue-700 border-blue-300" },
  iac: { abbr: "IaC", color: "bg-amber-100 text-amber-700 border-amber-300" },
  secrets: { abbr: "SEC", color: "bg-red-100 text-red-700 border-red-300" },
  dast: { abbr: "DAST", color: "bg-purple-100 text-purple-700 border-purple-300" },
  pentest: { abbr: "PT", color: "bg-sky-100 text-sky-700 border-sky-300" },
  code_quality: { abbr: "CQ", color: "bg-slate-100 text-slate-700 border-slate-300" },
  cloud: { abbr: "CLD", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  k8s: { abbr: "K8s", color: "bg-violet-100 text-violet-700 border-violet-300" },
  container: { abbr: "CTR", color: "bg-teal-100 text-teal-700 border-teal-300" },
  vm: { abbr: "VM", color: "bg-pink-100 text-pink-700 border-pink-300" },
};

const FRONTEND_LANGS = ["JavaScript", "TypeScript", "Dart", "Swift"];
const BACKEND_LANGS = ["Python", "Go", "Java", "Ruby", ".NET", "Rust", "Scala", "Elixir", "C/C++", "Clojure", "Kotlin"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function estimateFixTime(severity: string): string {
  switch (severity) {
    case "critical": return "~15m";
    case "high": return "~30m";
    case "medium": return "~1h";
    case "low": return "~2h";
    default: return "—";
  }
}

function formatStatus(status: string): { label: string; className: string } {
  switch (status) {
    case "open": return { label: "Open", className: "text-red-600 bg-red-50 border-red-200" };
    case "in_progress": return { label: "In Progress", className: "text-blue-600 bg-blue-50 border-blue-200" };
    case "fixed": return { label: "Fixed", className: "text-green-600 bg-green-50 border-green-200" };
    case "snoozed": return { label: "Snoozed", className: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    case "ignored": return { label: "Ignored", className: "text-gray-600 bg-gray-50 border-gray-200" };
    default: return { label: status, className: "text-gray-600 bg-gray-50 border-gray-200" };
  }
}

function exportCSV(issues: Issue[]) {
  const headers = ["Title", "Severity", "Status", "Type", "Language", "File Path", "Found At"];
  const rows = issues.map((i) => [
    i.title,
    i.severity,
    i.status,
    i.scan_type,
    i.language || "",
    i.file_path || "",
    i.found_at,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zentinel-issues-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();

  // Data
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [feedMode, setFeedMode] = useState<"all" | "refined">("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(ALL_SCAN_TYPES));
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [stackFilter, setStackFilter] = useState<"all" | "frontend" | "backend">("all");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // Dropdowns
  const [showTypesDropdown, setShowTypesDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Refs for click-outside
  const typesRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (typesRef.current && !typesRef.current.contains(e.target as Node)) setShowTypesDropdown(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterPanel(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setShowActionsDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch user name
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {};
      const name = meta.full_name || meta.name || data?.user?.email?.split("@")[0] || "there";
      setUserName(name.split(" ")[0]);
    });
  }, []);

  // Fetch issues
  const fetchIssues = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data }, { data: newData }, { data: fixedData }, { data: ignoredData }] = await Promise.all([
      supabase
        .from("issues")
        .select("id, title, description, severity, status, scan_type, language, is_false_positive, file_path, found_at, created_at, repository_id, pentest_id, repositories(full_name), pentests(name)")
        .eq("organization_id", activeWorkspace.id)
        .order("found_at", { ascending: false })
        .limit(500),
      supabase.from("issues").select("id").eq("organization_id", activeWorkspace.id).gte("found_at", weekAgo),
      supabase.from("issues").select("id").eq("organization_id", activeWorkspace.id).eq("status", "fixed").gte("found_at", weekAgo),
      supabase.from("issues").select("id, hours_saved").eq("organization_id", activeWorkspace.id).eq("is_false_positive", true),
    ]);
    setIssues((data as unknown as Issue[]) || []);
    setNewCount(newData?.length || 0);
    setFixedCount(fixedData?.length || 0);
    setIgnoredCount((ignoredData || []).length);
    setHoursSaved(Math.round((ignoredData || []).reduce((s, r) => s + (r.hours_saved || 0), 0) * 10) / 10);
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, [activeWorkspace]);

  // Filtered issues
  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = issue.title?.toLowerCase().includes(q);
        const matchFile = issue.file_path?.toLowerCase().includes(q);
        const matchRepo = issue.repositories?.full_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchFile && !matchRepo) return false;
      }
      // Feed mode: refined excludes low severity and false positives
      if (feedMode === "refined") {
        if (issue.severity === "low" || issue.is_false_positive) return false;
      }
      // Type filter (multi-select)
      if (!selectedTypes.has(issue.scan_type)) return false;
      // Severity
      if (sevFilter !== "all" && issue.severity !== sevFilter) return false;
      // Status
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      // Language
      if (langFilter !== "all" && issue.language !== langFilter) return false;
      // Stack
      if (stackFilter === "frontend" && !FRONTEND_LANGS.includes(issue.language || "")) return false;
      if (stackFilter === "backend" && !BACKEND_LANGS.includes(issue.language || "")) return false;
      // Quick filters
      if (quickFilter === "quick_fixes") {
        if (issue.severity === "low" || issue.severity === "medium") return true;
        return false;
      }
      if (quickFilter === "sla_due_soon") {
        const age = (Date.now() - new Date(issue.found_at).getTime()) / 86400000;
        if (issue.severity === "critical" && age < 1) return false;
        if (issue.severity === "high" && age < 3) return false;
        if (issue.severity === "medium" && age < 7) return false;
        if (issue.severity === "low") return false;
      }
      if (quickFilter === "out_of_sla") {
        const age = (Date.now() - new Date(issue.found_at).getTime()) / 86400000;
        if (issue.severity === "critical" && age < 3) return false;
        if (issue.severity === "high" && age < 7) return false;
        if (issue.severity === "medium" && age < 14) return false;
        if (issue.severity === "low" && age < 30) return false;
      }
      if (quickFilter === "recently_discovered") {
        const age = (Date.now() - new Date(issue.found_at).getTime()) / 86400000;
        if (age > 3) return false;
      }
      if (quickFilter === "ignored") {
        if (issue.status !== "ignored") return false;
      }
      return true;
    });
  }, [issues, search, feedMode, selectedTypes, sevFilter, statusFilter, langFilter, stackFilter, quickFilter]);

  // Toggle type selection
  const toggleType = (val: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const selectAllTypes = () => setSelectedTypes(new Set(ALL_SCAN_TYPES));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar (sticky) ── */}
      <div className="sticky top-0 z-50 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg text-gray-600">
            Heyy, <span className="font-semibold text-gray-900">{userName}</span>!
          </h1>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" title="Notifications">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── KPI Overview Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Open Issues */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm col-span-2 lg:col-span-1">
            <div className="h-1.5 w-full bg-gray-100 rounded-full mb-4 overflow-hidden flex">
              {issues.filter(i => i.severity === "critical").length > 0 && <div className="bg-red-500 h-full" style={{ flex: issues.filter(i => i.severity === "critical").length }} />}
              {issues.filter(i => i.severity === "high").length > 0 && <div className="bg-orange-400 h-full" style={{ flex: issues.filter(i => i.severity === "high").length }} />}
              {issues.filter(i => i.severity === "medium").length > 0 && <div className="bg-blue-400 h-full" style={{ flex: issues.filter(i => i.severity === "medium").length }} />}
              {issues.filter(i => i.severity === "low").length > 0 && <div className="bg-green-400 h-full" style={{ flex: issues.filter(i => i.severity === "low").length }} />}
            </div>
            <p className="text-3xl font-bold text-gray-900">{issues.filter(i => ["open","in_progress"].includes(i.status)).length}</p>
            <p className="text-sm text-gray-600 mt-1">Open Issues</p>
            <div className="flex items-center gap-3 mt-3 text-xs font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" />{issues.filter(i => i.severity === "critical").length}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400" />{issues.filter(i => i.severity === "high").length}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" />{issues.filter(i => i.severity === "medium").length}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400" />{issues.filter(i => i.severity === "low").length}</span>
            </div>
          </div>

          {/* Auto Ignored */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                <Cog className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Auto Ignored</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{ignoredCount}</p>
            <p className="text-sm text-gray-500 mt-1">{hoursSaved} hours saved</p>
          </div>

          {/* New */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">+</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">New</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{newCount}</p>
            <p className="text-sm text-gray-500 mt-1">in last 7 days</p>
          </div>

          {/* Solved */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-xs">✓</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">Solved</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{fixedCount}</p>
            <p className="text-sm text-gray-500 mt-1">in last 7 days</p>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Feed mode toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setFeedMode("all")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                feedMode === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All findings
            </button>
            <button
              onClick={() => setFeedMode("refined")}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                feedMode === "refined" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Zentinel refined
            </button>
          </div>

          {/* All types dropdown */}
          <div className="relative" ref={typesRef}>
            <button
              onClick={() => setShowTypesDropdown(!showTypesDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700"
            >
              All types
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {showTypesDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 shadow-xl rounded-xl py-2 w-72">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-semibold text-gray-900">Show issue type</span>
                  <button onClick={selectAllTypes} className="text-xs font-medium text-teal-600 hover:text-teal-700">
                    Select all
                  </button>
                </div>
                <div className="border-t border-gray-100 my-1" />
                {SCAN_TYPE_GROUPS.map((group, gi) => (
                  <div key={gi}>
                    {group.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTypes.has(item.value)}
                          onChange={() => toggleType(item.value)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                        />
                        <item.Icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                    {gi < SCAN_TYPE_GROUPS.length - 1 && <div className="border-t border-gray-100 my-1" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter (funnel) button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilterPanel ? "border-sky-300 bg-sky-50 text-sky-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
            {showFilterPanel && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 shadow-xl rounded-xl py-2 w-72">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-semibold text-gray-900">Quick Filters</span>
                  <button
                    onClick={() => { setQuickFilter(null); setStackFilter("all"); setSevFilter("all"); setStatusFilter("all"); setLangFilter("all"); }}
                    className="text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    Clear Filter
                  </button>
                </div>
                {/* Quick filter items */}
                {[
                  { key: "quick_fixes", Icon: Zap, label: "Quick Fixes" },
                  { key: "sla_due_soon", Icon: Clock, label: "SLA Due Soon" },
                  { key: "out_of_sla", Icon: AlertTriangle, label: "Out of SLA" },
                  { key: "recently_discovered", Icon: History, label: "Recently Discovered" },
                  { key: "ignored", Icon: Ban, label: "Ignored Issues" },
                ].map((qf) => (
                  <button
                    key={qf.key}
                    onClick={() => setQuickFilter(quickFilter === qf.key ? null : qf.key)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                      quickFilter === qf.key ? "text-sky-700 bg-sky-50" : "text-gray-700"
                    }`}
                  >
                    <qf.Icon className="h-4 w-4 text-gray-500" />
                    <span>{qf.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />

                {/* Stack toggles */}
                <button
                  onClick={() => setStackFilter(stackFilter === "frontend" ? "all" : "frontend")}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                    stackFilter === "frontend" ? "text-sky-700 bg-sky-50" : "text-gray-700"
                  }`}
                >
                  <Code2 className="h-4 w-4 text-gray-500" />
                  <span>Frontend</span>
                </button>
                <button
                  onClick={() => setStackFilter(stackFilter === "backend" ? "all" : "backend")}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                    stackFilter === "backend" ? "text-sky-700 bg-sky-50" : "text-gray-700"
                  }`}
                >
                  <Server className="h-4 w-4 text-gray-500" />
                  <span>Backend</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                {/* Exploitability */}
                <div className="px-4 py-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exploitability</label>
                  <select className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500">
                    <option>All</option>
                  </select>
                </div>
                {/* Language */}
                <div className="px-4 py-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Language</label>
                  <select
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="all">All Languages</option>
                    {["JavaScript","TypeScript","PHP","Java","Scala","Go","Python","Ruby",".NET","Rust","Dart","Swift","Elixir","C/C++","Kotlin"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div className="px-4 py-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Severity</label>
                  <select
                    value={sevFilter}
                    onChange={(e) => setSevFilter(e.target.value)}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {/* Status */}
                <div className="px-4 py-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="fixed">Fixed</option>
                    <option value="snoozed">Snoozed</option>
                    <option value="ignored">Ignored</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Actions dropdown (right-aligned) */}
          <div className="relative ml-auto" ref={actionsRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700"
            >
              Actions
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {showActionsDropdown && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 shadow-xl rounded-xl py-2 w-56">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</div>
                <button
                  onClick={() => { fetchIssues(); setShowActionsDropdown(false); }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                  <span>Refresh Table</span>
                </button>
                <button
                  onClick={() => { exportCSV(filtered); setShowActionsDropdown(false); }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 text-gray-500" />
                  <span>Export Issues</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-[70px_1fr_100px_180px_80px_100px] gap-3 px-5 py-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fix time</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</div>
            </div>
          </div>

          {/* Table body */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-sky-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 && issues.length === 0 ? (
            /* Empty state - no issues at all */
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-sm text-gray-600 max-w-sm mb-6">
                Run a pentest or connect a repository to start finding vulnerabilities.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/pentests/new"
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Run Pentest
                </Link>
                <Link
                  href="/dashboard/integrations"
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Connect Repo
                </Link>
              </div>
            </div>

          ) : filtered.length === 0 ? (
            /* No results for current filters */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No issues match your filters</p>
              <p className="text-sm text-gray-500">Try adjusting the filters above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((issue) => {
                const sev = SEV_CONFIG[issue.severity];
                const badge = TYPE_BADGE[issue.scan_type] || { abbr: "?", color: "bg-gray-100 text-gray-700 border-gray-300" };
                const location = issue.file_path || issue.repositories?.full_name || issue.pentests?.name || "—";
                const statusInfo = formatStatus(issue.status);

                return (
                  <div
                    key={issue.id}
                    onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                    className="grid grid-cols-[70px_1fr_100px_180px_80px_100px] gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer items-center group"
                  >
                    {/* Type badge */}
                    <div>
                      <span className={`inline-flex items-center justify-center h-7 px-2 rounded border text-[10px] font-bold font-mono ${badge.color}`}>
                        {badge.abbr}
                      </span>
                    </div>
                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-sky-600 transition-colors">
                        {issue.title}
                      </p>
                    </div>
                    {/* Severity */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sev.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                        {sev.label}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{location}</p>
                    </div>
                    {/* Fix time */}
                    <div>
                      <span className="text-xs text-gray-500">{estimateFixTime(issue.severity)}</span>
                    </div>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
