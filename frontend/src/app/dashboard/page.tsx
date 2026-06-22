"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, Settings, Shield, Loader2, Filter, ChevronDown,
  ShieldAlert, GitPullRequest, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type Issue = {
  id: string;
  title: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  scan_type: string;
  language: string | null;
  is_false_positive: boolean;
  auto_ignore_reason: string | null;
  ignore_method: string | null;
  ignore_reason: string | null;
  snoozed_until: string | null;
  hours_saved: number | null;
  file_path: string | null;
  found_at: string;
  created_at: string;
  repository_id: string | null;
  pentest_id: string | null;
  repositories: { full_name: string } | null;
  pentests: { name: string } | null;
};

type SevKey = "critical" | "high" | "medium" | "low";

// ── Constants ─────────────────────────────────────────────────────────────────
const SEV_CONFIG = {
  critical: { label: "Critical", dot: "bg-red-500", pill: "bg-red-50 text-red-700 border border-red-200" },
  high:     { label: "High",     dot: "bg-orange-400", pill: "bg-orange-50 text-orange-700 border border-orange-200" },
  medium:   { label: "Medium",   dot: "bg-yellow-400", pill: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  low:      { label: "Low",      dot: "bg-green-400", pill: "bg-green-50 text-green-700 border border-green-200" },
} as const;

const SCAN_TYPE_OPTIONS = [
  { value: "sca",       label: "Open-source Dependencies" },
  { value: "sast",      label: "SAST" },
  { value: "iac",       label: "Infrastructure as Code" },
  { value: "secrets",   label: "Exposed Secrets" },
  { value: "dast",      label: "DAST/Surface Monitoring" },
  { value: "pentest",   label: "AI Pentest Issues" },
  { value: "code_quality", label: "Code Audit Issues" },
  { value: "cloud",     label: "Cloud Configurations" },
  { value: "k8s",       label: "Kubernetes Configurations" },
  { value: "container", label: "Container Images" },
  { value: "license",   label: "License Issues" },
] as const;

const LANGUAGES = [
  "All Languages", "JavaScript", "TypeScript", "PHP", "Java", "Scala",
  "Go", "Python", "Ruby", ".NET", "Rust", "Dart", "Swift", "Elixir",
  "C/C++", "Clojure", "Kotlin", "Apex", "Visual Basic", "GitHub Actions",
] as const;

const TYPE_BADGE: Record<string, { abbr: string; color: string }> = {
  sca:          { abbr: "SCA",  color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  sast:         { abbr: "SAST", color: "bg-blue-100 text-blue-700 border-blue-300" },
  iac:          { abbr: "IaC",  color: "bg-amber-100 text-amber-700 border-amber-300" },
  secrets:      { abbr: "SEC",  color: "bg-red-100 text-red-700 border-red-300" },
  dast:         { abbr: "DAST", color: "bg-purple-100 text-purple-700 border-purple-300" },
  pentest:      { abbr: "PT",   color: "bg-sky-100 text-sky-700 border-sky-300" },
  code_quality: { abbr: "CQ",   color: "bg-slate-100 text-slate-700 border-slate-300" },
  cloud:        { abbr: "CLD",  color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  k8s:          { abbr: "K8s",  color: "bg-violet-100 text-violet-700 border-violet-300" },
  container:    { abbr: "CTR",  color: "bg-teal-100 text-teal-700 border-teal-300" },
  license:      { abbr: "LIC",  color: "bg-pink-100 text-pink-700 border-pink-300" },
};

// ── Helper: estimate fix time ─────────────────────────────────────────────────
function estimateFixTime(severity: string): string {
  switch (severity) {
    case "critical": return "~15m";
    case "high": return "~30m";
    case "medium": return "~1h";
    case "low": return "~2h";
    default: return "—";
  }
}

// ── Helper: format status ─────────────────────────────────────────────────────
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

// ── Dropdown Component ────────────────────────────────────────────────────────
function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700"
      >
        {selected?.label || label}
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-40 bg-white border border-gray-200 shadow-lg rounded-lg py-1 min-w-[200px] max-h-64 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  opt.value === value ? "text-sky-600 font-medium bg-sky-50" : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { activeWorkspace } = useWorkspace();

  // Data state
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);

  // Filter state
  const [search, setSearch] = useState("");
  const [feedMode, setFeedMode] = useState<"all" | "refined">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("All Languages");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [stackFilter, setStackFilter] = useState<"all" | "frontend" | "backend">("all");

  // ── Fetch user name ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {};
      const name = meta.full_name || meta.name || data?.user?.email?.split("@")[0] || "there";
      setUserName(name.split(" ")[0]);
    });
  }, []);

  // ── Fetch issues data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeWorkspace) return;
    const load = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: allIssues }, { data: newIssues }, { data: fixedIssues }, { data: ignoredData }] = await Promise.all([
        supabase
          .from("issues")
          .select("id, title, description, severity, status, scan_type, language, is_false_positive, auto_ignore_reason, ignore_method, ignore_reason, snoozed_until, hours_saved, file_path, found_at, created_at, repository_id, pentest_id, repositories(full_name), pentests(name)")
          .eq("organization_id", activeWorkspace.id)
          .in("status", ["open", "in_progress"])
          .order("found_at", { ascending: false })
          .limit(200),
        supabase
          .from("issues")
          .select("id")
          .eq("organization_id", activeWorkspace.id)
          .gte("found_at", weekAgo),
        supabase
          .from("issues")
          .select("id")
          .eq("organization_id", activeWorkspace.id)
          .eq("status", "fixed")
          .gte("found_at", weekAgo),
        supabase
          .from("issues")
          .select("id, hours_saved")
          .eq("organization_id", activeWorkspace.id)
          .eq("is_false_positive", true),
      ]);

      const totalHours = (ignoredData || []).reduce((sum, r) => sum + (r.hours_saved || 0), 0);

      setIssues((allIssues as Issue[]) || []);
      setNewCount(newIssues?.length || 0);
      setFixedCount(fixedIssues?.length || 0);
      setIgnoredCount((ignoredData || []).length);
      setHoursSaved(Math.round(totalHours * 10) / 10);
      setLoading(false);
    };
    load();
  }, [activeWorkspace]);

  // ── Severity counts ─────────────────────────────────────────────────────────
  const critical = issues.filter(i => i.severity === "critical").length;
  const high = issues.filter(i => i.severity === "high").length;
  const medium = issues.filter(i => i.severity === "medium").length;
  const low = issues.filter(i => i.severity === "low").length;

  // ── Frontend / Backend language classification ──────────────────────────────
  const FRONTEND_LANGS = ["JavaScript", "TypeScript", "Dart", "Swift"];
  const BACKEND_LANGS = ["Python", "Go", "Java", "Ruby", ".NET", "Rust", "Scala", "Elixir", "C/C++", "Clojure", "Kotlin"];

  // ── Filtered issues ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return issues.filter(issue => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = issue.title?.toLowerCase().includes(q);
        const matchFile = issue.file_path?.toLowerCase().includes(q);
        const matchRepo = (issue.repositories as any)?.full_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchFile && !matchRepo) return false;
      }

      // Feed mode: "refined" = auto-ignored false positives excluded (they already are since we query open/in_progress)
      // but we also hide low severity if refined
      if (feedMode === "refined" && issue.severity === "low") return false;

      // Type filter
      if (typeFilter !== "all" && issue.scan_type !== typeFilter) return false;

      // Severity filter
      if (sevFilter !== "all" && issue.severity !== sevFilter) return false;

      // Language filter
      if (langFilter !== "All Languages" && issue.language !== langFilter) return false;

      // Stack filter
      if (stackFilter === "frontend" && !FRONTEND_LANGS.includes(issue.language || "")) return false;
      if (stackFilter === "backend" && !BACKEND_LANGS.includes(issue.language || "")) return false;

      // Quick filters
      if (quickFilter === "sla_due_soon") {
        // SLA due soon = critical open > 1 day, high open > 3 days
        const age = (Date.now() - new Date(issue.found_at).getTime()) / (1000 * 60 * 60 * 24);
        if (issue.severity === "critical" && age < 1) return false;
        if (issue.severity === "high" && age < 3) return false;
        if (issue.severity === "medium" && age < 7) return false;
        if (issue.severity === "low") return false;
      }
      if (quickFilter === "out_of_sla") {
        const age = (Date.now() - new Date(issue.found_at).getTime()) / (1000 * 60 * 60 * 24);
        if (issue.severity === "critical" && age < 3) return false;
        if (issue.severity === "high" && age < 7) return false;
        if (issue.severity === "medium" && age < 14) return false;
        if (issue.severity === "low" && age < 30) return false;
      }
      if (quickFilter === "recently_discovered") {
        const age = (Date.now() - new Date(issue.found_at).getTime()) / (1000 * 60 * 60 * 24);
        if (age > 3) return false;
      }

      return true;
    });
  }, [issues, search, feedMode, typeFilter, sevFilter, langFilter, stackFilter, quickFilter]);

  const isEmpty = !loading && issues.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Top Section: Greeting ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl text-gray-600">
            Hello, <span className="text-gray-900 font-semibold">{userName}</span>!
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Search">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            <Link
              href="https://docs.zentinel.dev"
              target="_blank"
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : isEmpty ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-5">
              <ShieldAlert className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No open issues</h2>
            <p className="text-gray-600 max-w-sm mb-8">
              Run a pentest or connect a repository to start finding vulnerabilities in your codebase.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/pentests/new"
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Shield className="h-4 w-4" /> Run Pentest
              </Link>
              <Link
                href="/dashboard/integrations"
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <GitPullRequest className="h-4 w-4" /> Connect Repo
              </Link>
            </div>
          </div>
        ) : (
          <>

            {/* ── KPI Cards (2x2 grid) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Open Issues */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-2">Open Issues</p>
                <p className="text-3xl font-bold text-gray-900 mb-3">{issues.length}</p>
                <div className="flex items-center gap-2 text-xs font-medium">
                  {critical > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {critical}
                    </span>
                  )}
                  {high > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      {high}
                    </span>
                  )}
                  {medium > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {medium}
                    </span>
                  )}
                  {low > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      {low}
                    </span>
                  )}
                </div>
              </div>

              {/* Auto Ignored */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-2">Auto Ignored</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{ignoredCount}</p>
                <p className="text-sm text-gray-500">{hoursSaved} hours saved</p>
              </div>

              {/* New (last 7 days) */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-2">New</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{newCount}</p>
                <p className="text-sm text-gray-500">in last 7 days</p>
              </div>

              {/* Solved (last 7 days) */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-2">Solved</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{fixedCount}</p>
                <p className="text-sm text-gray-500">in last 7 days</p>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-0 rounded-b-none border-b-0">
              <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* Feed mode toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setFeedMode("all")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      feedMode === "all"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All findings
                  </button>
                  <button
                    onClick={() => setFeedMode("refined")}
                    className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                      feedMode === "refined"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Zentinel refined
                  </button>
                </div>

                {/* All types dropdown */}
                <Dropdown
                  label="All types"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { value: "all", label: "All types" },
                    ...SCAN_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })),
                  ]}
                />

                {/* Filter button */}
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                    showFilterPanel
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>

                {/* Actions dropdown (right) */}
                <div className="ml-auto">
                  <Dropdown
                    label="Actions"
                    value=""
                    onChange={() => {}}
                    options={[
                      { value: "export_csv", label: "Export CSV" },
                      { value: "bulk_ignore", label: "Bulk Ignore" },
                      { value: "bulk_snooze", label: "Bulk Snooze" },
                      { value: "assign", label: "Assign to team" },
                    ]}
                  />
                </div>
              </div>

              {/* ── Filter Panel (expanded) ── */}
              {showFilterPanel && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                  <div className="flex items-center flex-wrap gap-3">
                    {/* Quick Filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Quick:</span>
                      {[
                        { value: "sla_due_soon", label: "SLA Due Soon" },
                        { value: "out_of_sla", label: "Out of SLA" },
                        { value: "recently_discovered", label: "Recently Discovered" },
                      ].map(qf => (
                        <button
                          key={qf.value}
                          onClick={() => setQuickFilter(quickFilter === qf.value ? null : qf.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            quickFilter === qf.value
                              ? "bg-sky-50 border-sky-300 text-sky-700"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {qf.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-6 bg-gray-200" />

                    {/* Frontend / Backend toggles */}
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setStackFilter("all")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          stackFilter === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStackFilter("frontend")}
                        className={`px-3 py-1.5 text-xs font-medium border-l border-gray-300 transition-colors ${
                          stackFilter === "frontend" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Frontend
                      </button>
                      <button
                        onClick={() => setStackFilter("backend")}
                        className={`px-3 py-1.5 text-xs font-medium border-l border-gray-300 transition-colors ${
                          stackFilter === "backend" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Backend
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200" />

                    {/* Language dropdown */}
                    <Dropdown
                      label="All Languages"
                      value={langFilter}
                      onChange={setLangFilter}
                      options={LANGUAGES.map(l => ({ value: l, label: l }))}
                    />

                    {/* Severity dropdown */}
                    <Dropdown
                      label="All Severities"
                      value={sevFilter}
                      onChange={setSevFilter}
                      options={[
                        { value: "all", label: "All Severities" },
                        { value: "critical", label: "Critical" },
                        { value: "high", label: "High" },
                        { value: "medium", label: "Medium" },
                        { value: "low", label: "Low" },
                      ]}
                    />

                    {/* Clear filters */}
                    {(quickFilter || stackFilter !== "all" || langFilter !== "All Languages" || sevFilter !== "all") && (
                      <button
                        onClick={() => {
                          setQuickFilter(null);
                          setStackFilter("all");
                          setLangFilter("All Languages");
                          setSevFilter("all");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Issue Table ── */}
            <div className="bg-white border border-gray-200 rounded-xl rounded-t-none shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="border-b border-gray-200">
                <div className="grid grid-cols-[60px_1fr_100px_180px_80px_100px] gap-3 px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fix time</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</div>
                </div>
              </div>

              {/* Table Body */}
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No issues match your filters</p>
                  <p className="text-sm text-gray-500">Try adjusting the filters above</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(issue => {
                    const sev = SEV_CONFIG[issue.severity as SevKey] || SEV_CONFIG.low;
                    const badge = TYPE_BADGE[issue.scan_type] || { abbr: "?", color: "bg-gray-100 text-gray-700 border-gray-300" };
                    const location = issue.file_path
                      || (issue.repositories as any)?.full_name
                      || (issue.pentests as any)?.name
                      || "—";
                    const statusInfo = formatStatus(issue.status);

                    return (
                      <Link
                        key={issue.id}
                        href={`/dashboard/issues/${issue.id}`}
                        className="grid grid-cols-[60px_1fr_100px_180px_80px_100px] gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer items-center group"
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
                          <p className="text-sm text-gray-600 truncate">{location}</p>
                        </div>

                        {/* Fix time */}
                        <div className="text-sm text-gray-500">
                          {estimateFixTime(issue.severity)}
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
