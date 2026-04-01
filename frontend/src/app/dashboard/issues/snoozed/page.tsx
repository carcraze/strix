"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, BellOff, ChevronRight, RefreshCw, Filter, ChevronDown,
  Package, Code2, Server, KeyRound, Globe, Zap, Cloud, Cpu, Box,
  Smartphone, AlertTriangle, Clock, Lock, FileText, Folder,
  AlertCircle, History,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues } from "@/lib/queries";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/* ─── Constants ─────────────────────────────────────────────── */

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500",    label: "Critical" },
  high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High"     },
  medium:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500",   label: "Medium"   },
  low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Low"      },
};

const ISSUE_TYPES = [
  { key: "dependencies",   label: "Open-source Dependencies",  Icon: Package       },
  { key: "sast",           label: "SAST",                       Icon: Code2         },
  { key: "iac",            label: "Infrastructure As Code",     Icon: Server        },
  { key: "secrets",        label: "Exposed Secrets",            Icon: KeyRound      },
  { key: "dast",           label: "DAST/Surface Monitoring",    Icon: Globe         },
  { key: "pentest",        label: "AI Pentest Issues",          Icon: Zap           },
  { key: "cloud",          label: "Cloud Configurations",       Icon: Cloud         },
  { key: "kubernetes",     label: "Kubernetes Configurations",  Icon: Cpu           },
  { key: "containers",     label: "Container Images",           Icon: Box           },
  { key: "mobile",         label: "Mobile Issues",              Icon: Smartphone    },
  { key: "malware",        label: "Malware Issues",             Icon: AlertTriangle },
  { key: "eol",            label: "End-of-life Runtimes",       Icon: Clock         },
  { key: "access",         label: "Access Controls",            Icon: Lock          },
  { key: "license",        label: "License Issues",             Icon: FileText      },
];

const LANGUAGES = [
  "All Languages","JavaScript","TypeScript","PHP","Java","Scala","Go",
  "Python","Ruby",".NET","Rust","Dart","Swift","Elixir","C/C++","Clojure",
  "Kotlin","Apex","Visual Basic",
];

const SEVERITIES = ["All Severities","Critical","High","Medium","Low"];

/* ─── Helpers ───────────────────────────────────────────────── */

function getTypeBadge(issue: any): string {
  const fp = (issue.file_path || issue.title || "").toLowerCase();
  if (fp.includes(".ts") || fp.includes(".tsx")) return "TS";
  if (fp.includes(".js") || fp.includes(".jsx")) return "JS";
  if (fp.includes(".py"))  return "PY";
  if (fp.includes(".go"))  return "GO";
  if (fp.includes(".rb"))  return "RB";
  if (fp.includes(".java")) return "JV";
  if (fp.includes("http") || issue.pentest_id) return "HTTP";
  return "TS";
}

function detectLanguage(issue: any): string {
  const fp = (issue.file_path || "").toLowerCase();
  if (fp.includes(".ts") || fp.includes(".tsx")) return "TypeScript";
  if (fp.includes(".js") || fp.includes(".jsx")) return "JavaScript";
  if (fp.includes(".py"))   return "Python";
  if (fp.includes(".go"))   return "Go";
  if (fp.includes(".rb"))   return "Ruby";
  if (fp.includes(".java")) return "Java";
  if (fp.includes(".php"))  return "PHP";
  if (fp.includes(".rs"))   return "Rust";
  if (fp.includes(".kt"))   return "Kotlin";
  if (fp.includes(".swift")) return "Swift";
  if (fp.includes(".dart")) return "Dart";
  if (fp.includes(".cs"))   return ".NET";
  if (fp.includes(".c") || fp.includes(".cpp") || fp.includes(".h")) return "C/C++";
  return "All Languages";
}

function detectLayer(issue: any): "frontend" | "backend" | null {
  const fp = (issue.file_path || "").toLowerCase();
  if (/frontend|client|ui|component|react|vue/.test(fp)) return "frontend";
  if (/backend|server|api|controller|service|database/.test(fp)) return "backend";
  return null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Sub-components ────────────────────────────────────────── */

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    TS:   "bg-blue-100 text-blue-700 border-blue-300",
    JS:   "bg-yellow-100 text-yellow-700 border-yellow-300",
    HTTP: "bg-blue-100 text-blue-700 border-blue-300",
    PY:   "bg-green-100 text-green-700 border-green-300",
    GO:   "bg-cyan-100 text-cyan-700 border-cyan-300",
    RB:   "bg-red-100 text-red-700 border-red-300",
    JV:   "bg-orange-100 text-orange-700 border-orange-300",
  };
  const color = colors[type] ?? "bg-gray-100 text-gray-700 border-gray-300";
  return (
    <div className={cn("h-7 w-10 rounded border flex items-center justify-center text-[10px] font-bold font-mono", color)}>
      {type}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function SnoozedPage() {
  const { activeWorkspace }           = useWorkspace();
  const [loading, setLoading]         = useState(true);
  const [allIssues, setAllIssues]     = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarId, setSidebarId]     = useState<string | null>(null);

  // Type filter
  const [typeDropOpen, setTypeDropOpen]       = useState(false);
  const [selectedTypes, setSelectedTypes]     = useState<Set<string>>(new Set());
  const typeRef = useRef<HTMLDivElement>(null);

  // Quick filters
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [quickFilters, setQuickFilters]       = useState<Set<string>>(new Set());
  const [language, setLanguage]               = useState("All Languages");
  const [severity, setSeverity]               = useState("All Severities");
  const filterRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    getIssues(activeWorkspace.id)
      .then(data => { setAllIssues(data || []); setLoading(false); })
      .catch(err  => { console.error(err);       setLoading(false); });
  }, [activeWorkspace]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeDropOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPanelOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredIssues = useMemo(() => {
    const now = new Date();
    return allIssues.filter(issue => {
      // Must be snoozed
      const isSnoozed = issue.status === "snoozed" ||
        (issue.snoozed_until && new Date(issue.snoozed_until) > now);
      if (!isSnoozed) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!issue.title?.toLowerCase().includes(q) &&
            !issue.description?.toLowerCase().includes(q) &&
            !issue.file_path?.toLowerCase().includes(q)) return false;
      }

      // Type filter
      if (selectedTypes.size > 0) {
        const badge = getTypeBadge(issue).toLowerCase();
        if (!selectedTypes.has(badge)) return false;
      }

      // Severity filter
      if (severity !== "All Severities") {
        if ((issue.severity || "").toLowerCase() !== severity.toLowerCase()) return false;
      }

      // Language filter
      if (language !== "All Languages") {
        if (detectLanguage(issue) !== language) return false;
      }

      // Quick filters
      if (quickFilters.has("frontend") && detectLayer(issue) !== "frontend") return false;
      if (quickFilters.has("backend")  && detectLayer(issue) !== "backend")  return false;
      if (quickFilters.has("sla_soon")) {
        const due = issue.sla_due_date ? new Date(issue.sla_due_date) : null;
        if (!due || (due.getTime() - now.getTime()) > 7 * 86400 * 1000) return false;
      }
      if (quickFilters.has("out_of_sla")) {
        const due = issue.sla_due_date ? new Date(issue.sla_due_date) : null;
        if (!due || due > now) return false;
      }
      if (quickFilters.has("recent")) {
        const created = issue.created_at ? new Date(issue.created_at) : null;
        if (!created || (now.getTime() - created.getTime()) > 3 * 86400 * 1000) return false;
      }

      return true;
    });
  }, [allIssues, searchQuery, selectedTypes, severity, language, quickFilters]);

  function toggleType(key: string) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleQuickFilter(key: string) {
    setQuickFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function refresh() {
    if (!activeWorkspace) return;
    setLoading(true);
    getIssues(activeWorkspace.id)
      .then(data => { setAllIssues(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  const typeLabel = selectedTypes.size === 0
    ? "All types"
    : `${selectedTypes.size} type${selectedTypes.size > 1 ? "s" : ""}`;

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

      {/* ── Top header bar ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-3 flex items-center gap-2">
        <button className="bg-gray-100 text-gray-700 text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
          All Teams <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <ChevronRight className="text-gray-400 h-3.5 w-3.5" />
        <span className="text-sm text-gray-400">All issues</span>
        <ChevronRight className="text-gray-400 h-3.5 w-3.5" />
        <span className="text-sm text-gray-600 font-medium">Snoozed issues</span>

        <div className="ml-auto flex items-center gap-3">
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
            <Search className="h-4 w-4" />
          </button>
          <button className="text-sm text-gray-500 hover:text-gray-700 px-2">Docs</button>
          <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            JK
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Snoozed issues</h1>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full inline-block mb-6">
          {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""}
        </span>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Type picker */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => setTypeDropOpen(o => !o)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              {typeLabel} <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {typeDropOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Show issue type</span>
                  <button
                    onClick={() => setSelectedTypes(new Set())}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Select all
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {ISSUE_TYPES.map(({ key, label, Icon }) => (
                    <label key={key} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(key)}
                        onChange={() => toggleType(key)}
                        className="rounded text-blue-600"
                      />
                      <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter panel button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterPanelOpen(o => !o)}
              className={cn(
                "rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50 transition-colors",
                filterPanelOpen && "bg-gray-100"
              )}
            >
              <Filter className="h-4 w-4 text-gray-600" />
            </button>

            {filterPanelOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-3">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Quick Filters</span>
                  <button
                    onClick={() => { setQuickFilters(new Set()); setLanguage("All Languages"); setSeverity("All Severities"); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>

                <div className="px-4 pt-2 space-y-1">
                  {[
                    { key: "sla_soon", Icon: Clock,        label: "SLA Due Soon"       },
                    { key: "out_of_sla", Icon: AlertCircle, label: "Out of SLA"        },
                    { key: "recent",   Icon: History,       label: "Recently Discovered"},
                  ].map(({ key, Icon, label }) => (
                    <label key={key} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-lg px-1">
                      <input
                        type="checkbox"
                        checked={quickFilters.has(key)}
                        onChange={() => toggleQuickFilter(key)}
                        className="rounded text-blue-600"
                      />
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="mx-4 my-2 border-t border-gray-100" />

                <div className="px-4 space-y-1">
                  {[
                    { key: "frontend", Icon: Code2,  label: "Frontend" },
                    { key: "backend",  Icon: Server, label: "Backend"  },
                  ].map(({ key, Icon, label }) => (
                    <label key={key} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-lg px-1">
                      <input
                        type="checkbox"
                        checked={quickFilters.has(key)}
                        onChange={() => toggleQuickFilter(key)}
                        className="rounded text-blue-600"
                      />
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="mx-4 my-2 border-t border-gray-100" />

                <div className="px-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Language</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Severity</label>
                    <select
                      value={severity}
                      onChange={e => setSeverity(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            className="ml-auto rounded-full border border-gray-200 bg-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-gray-500", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────── */}
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Type","Name","Severity","Location","Fix time","Snoozed Until"].map((h, i, arr) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200",
                      i === arr.length - 1 && "border-r-0"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-sm text-gray-400">Loading…</td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                        <BellOff className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="font-semibold text-gray-700">No snoozed issues yet.</p>
                      <p className="text-sm text-gray-500 max-w-sm text-center mt-1">
                        Snoozed issues will show up here, taking a brief timeout from your main feed.
                        Choose a custom wake-up date for each issue to manage your focus effectively.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIssues.map(issue => {
                  const conf = SEVERITY_CONFIG[issue.severity?.toLowerCase()] ?? SEVERITY_CONFIG.low;
                  const badge = getTypeBadge(issue);

                  let locationName = "Unknown";
                  if (issue.repositories?.full_name) locationName = issue.repositories.full_name;
                  else if (issue.domains?.domain)    locationName = issue.domains.domain;
                  else if (issue.pentests?.name)      locationName = issue.pentests.name;

                  const filePath = issue.file_path || issue.title?.split(" ")[0] || "file.ts";
                  const until = formatDate(issue.snoozed_until);

                  return (
                    <tr
                      key={issue.id}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSidebarId(issue.id)}
                    >
                      <td className="px-4 py-3.5 border-r border-gray-200">
                        <TypeBadge type={badge} />
                      </td>
                      <td className="px-4 py-3.5 border-r border-gray-200 max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{issue.title}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{filePath}</div>
                      </td>
                      <td className="px-4 py-3.5 border-r border-gray-200 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", conf.bg, conf.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", conf.dot)} />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-r border-gray-200">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Folder className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{locationName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-r border-gray-200 text-sm text-gray-600 whitespace-nowrap">
                        {fixTime(issue.severity)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200 whitespace-nowrap">
                          <BellOff className="h-3.5 w-3.5" />
                          {until}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
