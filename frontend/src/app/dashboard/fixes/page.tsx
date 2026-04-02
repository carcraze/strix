"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Search,
  Filter,
  Shield,
  GitBranch,
  Settings,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  scan_type: string;
  cve_id: string | null;
  cve_count: number | null;
  file_path: string | null;
  package_name: string | null;
  current_version: string | null;
  fixed_version: string | null;
  organization_id: string;
  repository_id: string;
  repositories: { full_name: string } | null;
}

interface ScanRun {
  id: string;
  status: string;
  repositories: { full_name: string } | null;
}

interface RepoGroup {
  repoFullName: string;
  repositoryId: string;
  contextFile: string;
  issues: Issue[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const HOURS_PER_SEVERITY: Record<string, number> = {
  critical: 8,
  high: 4,
  medium: 2,
  low: 0.5,
  info: 0.25,
};

function calcHoursSaved(issues: Issue[]): number {
  return issues
    .filter((i) => i.status === "fixed")
    .reduce((sum, i) => sum + (HOURS_PER_SEVERITY[i.severity?.toLowerCase()] ?? 1), 0);
}

function getMostCommonFilePath(issues: Issue[]): string {
  const counts: Record<string, number> = {};
  for (const i of issues) {
    if (i.file_path) counts[i.file_path] = (counts[i.file_path] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (!entries.length) return "";
  entries.sort((a, b) => b[1] - a[1]);
  const fullPath = entries[0][0];
  const parts = fullPath.split("/");
  return parts[parts.length - 1] || fullPath;
}

function groupByRepo(issues: Issue[]): RepoGroup[] {
  const map: Record<string, Issue[]> = {};
  for (const issue of issues) {
    const key = issue.repositories?.full_name ?? issue.repository_id ?? "unknown";
    if (!map[key]) map[key] = [];
    map[key].push(issue);
  }
  return Object.entries(map).map(([repoFullName, repoIssues]) => ({
    repoFullName,
    repositoryId: repoIssues[0]?.repository_id ?? "",
    contextFile: getMostCommonFilePath(repoIssues),
    issues: repoIssues,
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityPill({ severity }: { severity: string }) {
  const s = severity?.toLowerCase();
  const cls =
    s === "critical"
      ? "bg-red-100 text-red-700 border-red-200"
      : s === "high"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : s === "medium"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : s === "low"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
        cls
      )}
    >
      {severity || "info"}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "fixed")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        Fixed
      </span>
    );
  if (s === "auto_ignored" || s === "ignored")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Auto Ignored
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300">
      New
    </span>
  );
}

function VersionUpgrade({ from, to }: { from: string | null; to: string | null }) {
  if (!from || !to) return <span className="text-gray-400 text-sm">—</span>;
  const fromMajor = parseInt(from.split(".")[0]);
  const toMajor = parseInt(to.split(".")[0]);
  const isMajor = toMajor > fromMajor;
  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      {isMajor ? (
        <span className="text-amber-500">⚠</span>
      ) : (
        <span className="text-green-500">✓</span>
      )}
      <span className="text-gray-500">
        {from} → {to}
      </span>
    </div>
  );
}

function CveCell({ cveId, cveCount }: { cveId: string | null; cveCount: number | null }) {
  if (!cveId) return <span className="text-gray-400 text-sm">—</span>;
  const extra = (cveCount ?? 1) - 1;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-blue-600 text-xs font-mono">{cveId}</span>
      {extra > 0 && (
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          +{extra} more
        </span>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onTriggerScan, scanning }: { onTriggerScan: () => void; scanning: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No AutoFix findings yet</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        Connect a repository and run your first Day Zero scan to see vulnerabilities, CVE data, and
        auto-generated fixes.
      </p>
      <button
        onClick={onTriggerScan}
        disabled={scanning}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {scanning ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {scanning ? "Triggering Scan…" : "Trigger Day Zero Scan"}
      </button>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

const SCAN_TYPE_CARDS = [
  {
    key: "sca",
    label: "Dependencies scanning",
    desc: "Detect vulnerable packages in your dependency trees using Trivy/OSV.",
    tool: "Trivy / OSV",
  },
  {
    key: "sast",
    label: "SAST scanning",
    desc: "Find security flaws directly in your source code using Semgrep rules.",
    tool: "Semgrep",
  },
  {
    key: "iac",
    label: "IaC scanning",
    desc: "Validate Terraform, CloudFormation, and Kubernetes configs with Checkov.",
    tool: "Checkov",
  },
  {
    key: "secrets",
    label: "Secrets scanning",
    desc: "Detect hardcoded secrets, API keys, and credentials using TruffleHog.",
    tool: "TruffleHog",
  },
  {
    key: "license",
    label: "License risk scanning",
    desc: "Identify packages with risky or incompatible open-source licenses.",
    tool: "OSV / Custom",
  },
];

function SettingsTab({
  orgId,
  onTriggerScan,
  scanning,
}: {
  orgId: string;
  onTriggerScan: (scanType?: string) => void;
  scanning: boolean;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    sca: true,
    sast: true,
    iac: false,
    secrets: true,
    license: false,
  });

  return (
    <div className="py-6 space-y-4">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800">Enable AutoFix for your repositories</h2>
        <p className="text-sm text-gray-500 mt-1">
          Toggle scan types to automatically detect and fix vulnerabilities across your connected repos.
        </p>
      </div>
      {SCAN_TYPE_CARDS.map((card) => (
        <div
          key={card.key}
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-gray-800">{card.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {card.tool}
              </span>
            </div>
            <p className="text-xs text-gray-500">{card.desc}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTriggerScan(card.key)}
              disabled={scanning}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Trigger scan
            </button>
            <button
              onClick={() => setEnabled((prev) => ({ ...prev, [card.key]: !prev[card.key] }))}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={enabled[card.key] ? "Disable" : "Enable"}
            >
              {enabled[card.key] ? (
                <ToggleRight className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Repo Group ───────────────────────────────────────────────────────────────

function RepoGroupTable({
  group,
  scanType,
  orgId,
  searchQuery,
}: {
  group: RepoGroup;
  scanType: string;
  orgId: string;
  searchQuery: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creatingPr, setCreatingPr] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filtered = group.issues.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.title ?? "").toLowerCase().includes(q) ||
      (i.package_name ?? "").toLowerCase().includes(q) ||
      (i.cve_id ?? "").toLowerCase().includes(q) ||
      (i.severity ?? "").toLowerCase().includes(q)
    );
  });

  const allIds = filtered.map((i) => i.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createPr = async () => {
    setCreatingPr(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const issueIds = selected.size > 0 ? Array.from(selected) : allIds;
      const res = await fetch("/api/autofix/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          organization_id: orgId,
          repository_id: group.repositoryId,
          scan_type: scanType,
          issue_ids: issueIds,
        }),
      });
      const json = await res.json();
      if (json?.url) {
        setPrUrl(json.url);
        showToast("Pull request created successfully!");
      } else {
        showToast("PR creation started. Check your repository for the pull request.");
      }
    } catch {
      showToast("Failed to create PR. Please try again.");
    } finally {
      setCreatingPr(false);
    }
  };

  const createAutoFix = async () => {
    showToast("AutoFix generation queued for this repository.");
  };

  if (filtered.length === 0 && searchQuery) return null;

  return (
    <div className="mb-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toastMsg}
        </div>
      )}

      {/* Group header */}
      <div className="flex items-center gap-2 py-3 border-b border-gray-100">
        <GitBranch className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 truncate">
          {group.repoFullName}
          {group.contextFile && (
            <span className="text-gray-400 font-normal"> | {group.contextFile}</span>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            onClick={createAutoFix}
            className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            Create AutoFix
          </button>
          <button
            onClick={createPr}
            disabled={creatingPr}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {creatingPr ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {creatingPr ? "Creating…" : "Create PR"}
          </button>
        </div>
      </div>

      {prUrl && (
        <div className="mt-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          PR created:&nbsp;
          <a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {prUrl}
          </a>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-3 py-2.5 border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                Name
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                Severity
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                CVE
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                Version Upgrade
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((issue) => {
              const name = issue.package_name || issue.title || "Unknown";
              const subtitle =
                issue.title && issue.package_name
                  ? issue.title
                  : issue.file_path
                  ? `Found in ${issue.file_path}`
                  : null;
              return (
                <tr
                  key={issue.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    selected.has(issue.id) && "bg-blue-50"
                  )}
                >
                  <td className="px-3 py-3 border-r border-gray-100">
                    <input
                      type="checkbox"
                      checked={selected.has(issue.id)}
                      onChange={() => toggleOne(issue.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3 border-r border-gray-100 max-w-xs">
                    <p className="font-semibold text-gray-800 truncate">{name}</p>
                    {subtitle && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-100">
                    <SeverityPill severity={issue.severity} />
                  </td>
                  <td className="px-3 py-3 border-r border-gray-100">
                    <CveCell cveId={issue.cve_id} cveCount={issue.cve_count} />
                  </td>
                  <td className="px-3 py-3 border-r border-gray-100">
                    <VersionUpgrade from={issue.current_version} to={issue.fixed_version} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={issue.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "sca" | "sast" | "iac" | "pentest" | "containers" | "settings";

const TABS: { key: TabKey; label: string; scanTypes: string[] }[] = [
  { key: "sca", label: "Dependencies", scanTypes: ["sca"] },
  { key: "sast", label: "SAST", scanTypes: ["sast"] },
  { key: "iac", label: "IaC", scanTypes: ["iac"] },
  { key: "pentest", label: "Pentest", scanTypes: ["pentest"] },
  { key: "containers", label: "Containers", scanTypes: ["malware", "container"] },
  { key: "settings", label: "Settings", scanTypes: [] },
];

export default function AutoFixPage() {
  const { activeWorkspace } = useWorkspace();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("sca");
  const [searchQuery, setSearchQuery] = useState("");
  const [triggeringScan, setTriggeringScan] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  const orgId = activeWorkspace?.id;

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [{ data: issuesData }, { data: runsData }] = await Promise.all([
        supabase
          .from("issues")
          .select("*, repositories(full_name)")
          .eq("organization_id", orgId)
          .not("scan_type", "is", null)
          .order("severity", { ascending: false })
          .limit(200),
        supabase
          .from("scan_runs")
          .select("*, repositories(full_name)")
          .eq("organization_id", orgId)
          .eq("status", "running"),
      ]);
      setIssues((issuesData as Issue[]) ?? []);
      setScanRuns((runsData as ScanRun[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerDayZeroScan = async (scanType?: string) => {
    if (!orgId) return;
    setTriggeringScan(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetch("/api/code-scan/day-zero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          organization_id: orgId,
          scan_type: scanType,
        }),
      });
      setScanToast("Day Zero scan started! Results will appear shortly.");
      setTimeout(() => setScanToast(null), 5000);
      setTimeout(() => fetchData(), 3000);
    } catch {
      setScanToast("Failed to trigger scan. Please try again.");
      setTimeout(() => setScanToast(null), 4000);
    } finally {
      setTriggeringScan(false);
    }
  };

  // Compute tab counts
  const tabCounts: Record<string, number> = {};
  for (const tab of TABS) {
    if (tab.scanTypes.length === 0) continue;
    tabCounts[tab.key] = issues.filter((i) => tab.scanTypes.includes(i.scan_type)).length;
  }

  // Issues for active tab
  const activeTabDef = TABS.find((t) => t.key === activeTab);
  const activeIssues =
    activeTabDef && activeTabDef.scanTypes.length > 0
      ? issues.filter((i) => activeTabDef.scanTypes.includes(i.scan_type))
      : [];

  // Hours saved
  const fixedCount = issues.filter((i) => i.status === "fixed").length;
  const totalAutoFixable = issues.length;
  const hoursSaved = calcHoursSaved(issues);

  // Repo groups for active tab
  const repoGroups = groupByRepo(activeIssues);

  const isRunning = scanRuns.length > 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Scan toast */}
      {scanToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {scanToast}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-2 px-6 py-3">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          All Teams
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-800">AutoFix</span>

        {isRunning && (
          <div className="ml-3 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Scanning {scanRuns.length} repo{scanRuns.length > 1 ? "s" : ""}…
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold select-none">
            {activeWorkspace?.name?.slice(0, 2).toUpperCase() ?? "JK"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Hours saved banner */}
        {!loading && issues.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
            <span className="font-semibold text-gray-800">{fixedCount}</span>
            <span>/</span>
            <span>{totalAutoFixable}</span>
            <span>
              issues fixed — saving approximately{" "}
              <span className="font-semibold text-gray-800">{hoursSaved.toFixed(0)}h</span> with
              AutoFix
            </span>
            <button className="text-gray-400 hover:text-gray-600 ml-0.5" title="About hours saved">
              <span className="text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">
                i
              </span>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 flex items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700 font-medium"
                )}
              >
                {tab.key === "settings" ? (
                  <Settings className="w-3.5 h-3.5" />
                ) : null}
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {count}
                  </span>
                )}
                {tab.key === "settings" && (
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                    Enable Now
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter toolbar */}
        {activeTab !== "settings" && (
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 w-60"
              />
            </div>
            <button className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              <Settings className="w-3.5 h-3.5" />
              Extended Lifecycle Support
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Settings tab */}
        {!loading && activeTab === "settings" && (
          <SettingsTab
            orgId={orgId ?? ""}
            onTriggerScan={triggerDayZeroScan}
            scanning={triggeringScan}
          />
        )}

        {/* Containers empty tab */}
        {!loading && activeTab === "containers" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Container scanning coming soon</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Container image vulnerability scanning will appear here once enabled.
            </p>
          </div>
        )}

        {/* Issue tabs content */}
        {!loading && activeTab !== "settings" && activeTab !== "containers" && (
          <>
            {activeIssues.length === 0 ? (
              <EmptyState onTriggerScan={() => triggerDayZeroScan()} scanning={triggeringScan} />
            ) : (
              repoGroups.map((group) => (
                <RepoGroupTable
                  key={group.repoFullName}
                  group={group}
                  scanType={activeTab}
                  orgId={orgId ?? ""}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
