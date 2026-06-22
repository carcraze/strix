"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, Filter, Package, Scale, Braces, Code, Server,
  Container, Smartphone, ChevronRight, MoreVertical, ToggleLeft, ToggleRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type Repository = {
  id: string;
  organization_id: string;
  provider: string;
  provider_repo_id: string;
  full_name: string;
  default_branch: string;
  auto_review_enabled: boolean;
  schedule_enabled: boolean;
  block_merge_on_critical: boolean;
  created_at: string;
};

type PrReview = {
  id: string;
  organization_id: string;
  repository_id: string;
  pr_number: number;
  pr_title: string;
  status: string;
  issues_found: number;
  created_at: string;
  provider: string;
  trigger_source: string;
  repo_full_name?: string;
};

type CheckRule = {
  id: string;
  organization_id: string;
  rule_type: string;
  language: string;
  description: string;
  auto_fix: boolean;
  score: string;
  is_default: boolean;
  is_enabled: boolean;
  custom_context: string | null;
  created_at: string;
};

type Tab = "repositories" | "pull-requests" | "checks";
type CheckSubView = null | "sast" | "iac" | "mobile";

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: string }) {
  const s = score?.toLowerCase() || "";
  if (s === "critical") return <span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</span>;
  if (s === "high") return <span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-orange-500" />High</span>;
  if (s === "medium") return <span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-blue-500" />Medium</span>;
  if (s === "low") return <span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-500" />Low</span>;
  return <span className="text-xs text-gray-400">{score}</span>;
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  if (s === "completed" || s === "passed") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Passed</span>;
  if (s === "failed") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Failed</span>;
  if (s === "pending") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>;
  if (s === "running") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Running</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>;
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function RepositoriesPage() {
  const { activeWorkspace } = useWorkspace();
  const orgId = activeWorkspace?.id;

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("repositories");

  // Data
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [prReviews, setPrReviews] = useState<PrReview[]>([]);
  const [checkRules, setCheckRules] = useState<CheckRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters — Repositories tab
  const [repoSearch, setRepoSearch] = useState("");

  // Filters — Pull Requests tab
  const [prSearch, setPrSearch] = useState("");
  const [prRepoFilter, setPrRepoFilter] = useState("all");
  const [prStateFilter, setPrStateFilter] = useState("all");

  // Checks tab sub-view
  const [checkSubView, setCheckSubView] = useState<CheckSubView>(null);
  const [ruleLanguageFilter, setRuleLanguageFilter] = useState("");
  const [ruleTypeFilter, setRuleTypeFilter] = useState("all");
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // ─── Fetch data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!orgId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [repoRes, prRes, rulesRes] = await Promise.all([
          supabase.from("repositories").select("*").eq("organization_id", orgId),
          supabase.from("pr_reviews").select("*, repositories(full_name)").eq("organization_id", orgId).order("created_at", { ascending: false }),
          supabase.from("check_rules").select("*").or(`organization_id.eq.${orgId},is_default.eq.true`),
        ]);
        setRepositories((repoRes.data as unknown as Repository[]) || []);
        const prs = ((prRes.data as unknown as any[]) || []).map((pr) => ({
          ...pr,
          repo_full_name: pr.repositories?.full_name || "",
        }));
        setPrReviews(prs as PrReview[]);
        setCheckRules((rulesRes.data as unknown as CheckRule[]) || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [orgId]);

  // ─── Filtered data ───────────────────────────────────────────────────────────

  const filteredRepos = useMemo(() => {
    if (!repoSearch.trim()) return repositories;
    return repositories.filter((r) =>
      r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
    );
  }, [repositories, repoSearch]);

  const filteredPRs = useMemo(() => {
    let result = prReviews;
    if (prSearch.trim()) {
      result = result.filter(
        (pr) =>
          pr.pr_title.toLowerCase().includes(prSearch.toLowerCase()) ||
          pr.repo_full_name?.toLowerCase().includes(prSearch.toLowerCase())
      );
    }
    if (prRepoFilter !== "all") {
      result = result.filter((pr) => pr.repository_id === prRepoFilter);
    }
    if (prStateFilter !== "all") {
      result = result.filter((pr) => pr.status?.toLowerCase() === prStateFilter);
    }
    return result;
  }, [prReviews, prSearch, prRepoFilter, prStateFilter]);

  const filteredRules = useMemo(() => {
    if (!checkSubView) return [];
    let result = checkRules.filter((r) => r.rule_type === checkSubView);
    if (ruleLanguageFilter) {
      result = result.filter((r) => r.language?.toLowerCase() === ruleLanguageFilter.toLowerCase());
    }
    if (ruleTypeFilter === "autofix") {
      result = result.filter((r) => r.auto_fix);
    }
    return result;
  }, [checkRules, checkSubView, ruleLanguageFilter, ruleTypeFilter]);

  const ruleLanguages = useMemo(() => {
    if (!checkSubView) return [];
    const langs = new Set(checkRules.filter((r) => r.rule_type === checkSubView).map((r) => r.language).filter(Boolean));
    return Array.from(langs).sort();
  }, [checkRules, checkSubView]);

  // ─── Helper: last scan date for a repo ───────────────────────────────────────

  const getLastScan = (repoId: string) => {
    const pr = prReviews.find((p) => p.repository_id === repoId);
    if (!pr) return "Never";
    return new Date(pr.created_at).toLocaleDateString();
  };

  const getIssueCount = (repoId: string) => {
    return prReviews.filter((p) => p.repository_id === repoId).reduce((sum, p) => sum + (p.issues_found || 0), 0);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
              {repositories.length} active repos
            </span>
          </div>
          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
          >
            Connect Repository
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {([
              { key: "repositories", label: "Repositories" },
              { key: "pull-requests", label: "Pull Requests" },
              { key: "checks", label: "Checks" },
            ] as { key: Tab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCheckSubView(null); }}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "text-sky-600 border-sky-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "repositories" && (
          <RepositoriesTab
            repos={filteredRepos}
            loading={loading}
            search={repoSearch}
            onSearchChange={setRepoSearch}
            getLastScan={getLastScan}
            getIssueCount={getIssueCount}
          />
        )}
        {activeTab === "pull-requests" && (
          <PullRequestsTab
            prs={filteredPRs}
            repos={repositories}
            loading={loading}
            search={prSearch}
            onSearchChange={setPrSearch}
            repoFilter={prRepoFilter}
            onRepoFilterChange={setPrRepoFilter}
            stateFilter={prStateFilter}
            onStateFilterChange={setPrStateFilter}
          />
        )}
        {activeTab === "checks" && (
          <ChecksTab
            checkSubView={checkSubView}
            setCheckSubView={setCheckSubView}
            filteredRules={filteredRules}
            ruleLanguages={ruleLanguages}
            ruleLanguageFilter={ruleLanguageFilter}
            setRuleLanguageFilter={setRuleLanguageFilter}
            ruleTypeFilter={ruleTypeFilter}
            setRuleTypeFilter={setRuleTypeFilter}
            showMoreInfo={showMoreInfo}
            setShowMoreInfo={setShowMoreInfo}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Repositories
// ═══════════════════════════════════════════════════════════════════════════════

function RepositoriesTab({
  repos,
  loading,
  search,
  onSearchChange,
  getLastScan,
  getIssueCount,
}: {
  repos: Repository[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  getLastScan: (id: string) => string;
  getIssueCount: (id: string) => number;
}) {
  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
          />
        </div>
        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
          <Filter className="h-4 w-4 text-gray-500" />
        </button>
        <Link
          href="/dashboard/integrations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          Connect Repository
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Repo name</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Language</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Issues</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ignored</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last scan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Loading repositories...
                </td>
              </tr>
            ) : repos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-500">Connect your first repository to start scanning</p>
                </td>
              </tr>
            ) : (
              repos.map((repo) => (
                <tr key={repo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{repo.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">—</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getIssueCount(repo.id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">0</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getLastScan(repo.id)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Pull Requests
// ═══════════════════════════════════════════════════════════════════════════════

function PullRequestsTab({
  prs,
  repos,
  loading,
  search,
  onSearchChange,
  repoFilter,
  onRepoFilterChange,
  stateFilter,
  onStateFilterChange,
}: {
  prs: PrReview[];
  repos: Repository[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  repoFilter: string;
  onRepoFilterChange: (v: string) => void;
  stateFilter: string;
  onStateFilterChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Repositories</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 font-medium">Pull Requests</span>
      </div>

      {/* Filter row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pull requests..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
          />
        </div>

        <select
          value={repoFilter}
          onChange={(e) => onRepoFilterChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        >
          <option value="all">All Repositories</option>
          {repos.map((r) => (
            <option key={r.id} value={r.id}>{r.full_name}</option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => onStateFilterChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        >
          <option value="all">All States</option>
          <option value="completed">Gate Passed</option>
          <option value="failed">Gate Failed</option>
          <option value="timed_out">Timed Out</option>
          <option value="pending">Pending</option>
        </select>
        <button className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
          Manage PR Checks
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">PR Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Repository</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Scan Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  Loading pull requests...
                </td>
              </tr>
            ) : prs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="space-y-3">
                    <p className="text-base font-medium text-gray-900">No PR Scan History Yet</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Setup PR Gating and stop newly introduced issues from being merged.
                    </p>
                    <button className="mt-2 inline-flex items-center px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors">
                      Configure PR Gating
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{pr.pr_number} {pr.pr_title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pr.repo_full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(pr.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={pr.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Checks
// ═══════════════════════════════════════════════════════════════════════════════

type CheckAction = { label: string; type: "button" | "link" | "green-pill"; subView?: CheckSubView };

const CHECK_CATEGORIES: {
  id: string;
  icon: any;
  title: string;
  description: string;
  link?: { label: string; href: string };
  actions?: CheckAction[];
}[] = [
  {
    id: "dependency",
    icon: Package,
    title: "Open source dependency monitoring",
    description: "We monitor 3rd party package dependencies you are using in your app for any known vulnerabilities.",
    link: { label: "View monitored lockfiles", href: "#" },
  },
  {
    id: "license",
    icon: Scale,
    title: "License management",
    description: "Zentinel checks the licenses of all your dependencies to make sure you are legally permitted to make use of them.",
    link: { label: "View all licenses", href: "#" },
  },
  {
    id: "sast",
    icon: Braces,
    title: "SAST",
    description: "Static application security testing.",
    actions: [
      { label: "Create custom rule", type: "button" },
      { label: "View SAST rules", type: "link", subView: "sast" },
    ],
  },
  {
    id: "ai",
    icon: Code,
    title: "AI Code Audit",
    description: "Run a one-off AI code audit. Credits are required.",
    actions: [
      { label: "Try now", type: "green-pill" },
      { label: "View AI Code Audits", type: "link" },
    ],
  },
  {
    id: "iac",
    icon: Server,
    title: "IaC",
    description: "Infrastructure as Code testing. Check which files we can monitor in your application.",
    actions: [
      { label: "View IaC rules", type: "link", subView: "iac" },
    ],
  },
  {
    id: "container",
    icon: Container,
    title: "Container Images",
    description: "Zentinel checks container images for vulnerabilities.",
    actions: [
      { label: "View container rules", type: "link" },
    ],
  },
  {
    id: "mobile",
    icon: Smartphone,
    title: "Mobile issues",
    description: "Mobile manifest file monitoring.",
    actions: [
      { label: "View mobile rules", type: "link", subView: "mobile" },
    ],
  },
];

function ChecksTab({
  checkSubView,
  setCheckSubView,
  filteredRules,
  ruleLanguages,
  ruleLanguageFilter,
  setRuleLanguageFilter,
  ruleTypeFilter,
  setRuleTypeFilter,
  showMoreInfo,
  setShowMoreInfo,
}: {
  checkSubView: CheckSubView;
  setCheckSubView: (v: CheckSubView) => void;
  filteredRules: CheckRule[];
  ruleLanguages: string[];
  ruleLanguageFilter: string;
  setRuleLanguageFilter: (v: string) => void;
  ruleTypeFilter: string;
  setRuleTypeFilter: (v: string) => void;
  showMoreInfo: boolean;
  setShowMoreInfo: (v: boolean) => void;
}) {
  // Sub-view: Rules table
  if (checkSubView) {
    const iacLanguages = ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Ansible", "Pulumi"];
    const mobileLanguages = ["All platforms", "Android", "iOS"];

    let languageOptions: string[] = [];
    if (checkSubView === "iac") languageOptions = iacLanguages;
    else if (checkSubView === "mobile") languageOptions = mobileLanguages;
    else languageOptions = ruleLanguages;

    const subViewTitle = checkSubView === "sast" ? "SAST Rules" : checkSubView === "iac" ? "IaC Rules" : "Mobile Rules";

    return (
      <div className="space-y-4">
        {/* Back navigation */}
        <button
          onClick={() => { setCheckSubView(null); setRuleLanguageFilter(""); setRuleTypeFilter("all"); }}
          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to Checks
        </button>

        <h2 className="text-lg font-semibold text-gray-900">{subViewTitle}</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={ruleLanguageFilter}
            onChange={(e) => setRuleLanguageFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="">
              {checkSubView === "mobile" ? "All platforms" : "Select..."}
            </option>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <select
            value={ruleTypeFilter}
            onChange={(e) => setRuleTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="all">All types</option>
            <option value="autofix">AutoFix supported rules</option>
          </select>
          <button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showMoreInfo ? <ToggleRight className="h-4 w-4 text-sky-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
            Show More Info
          </button>
        </div>

        {/* Rules Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">AutoFix</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No rules found for current filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.language}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      {showMoreInfo ? rule.description : rule.description?.substring(0, 80) + (rule.description?.length > 80 ? "..." : "")}
                    </td>
                    <td className="px-6 py-4">
                      {rule.auto_fix ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Yes</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={rule.score} />
                    </td>
                    <td className="px-6 py-4">
                      <RuleMenu ruleId={rule.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Main Checks view — categories table
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-12">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Checks</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CHECK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Icon className="h-5 w-5 text-gray-500" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-900">{cat.title}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {"link" in cat && cat.link && (
                          <a href={cat.link.href} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                            {cat.link.label}
                          </a>
                        )}
                        {"actions" in cat && cat.actions && cat.actions.map((action, idx) => {
                          if (action.type === "button") {
                            return (
                              <button key={idx} className="text-xs px-2.5 py-1 bg-sky-500 text-white rounded font-medium hover:bg-sky-600 transition-colors">
                                {action.label}
                              </button>
                            );
                          }
                          if (action.type === "green-pill") {
                            return (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                                {action.label}
                              </span>
                            );
                          }
                          if (action.type === "link") {
                            return (
                              <button
                                key={idx}
                                onClick={() => action.subView ? setCheckSubView(action.subView) : undefined}
                                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                              >
                                {action.label}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">{cat.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rule Row Menu ───────────────────────────────────────────────────────────

function RuleMenu({ ruleId }: { ruleId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
            <button
              onClick={() => { setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add Custom Context
            </button>
          </div>
        </>
      )}
    </div>
  );
}
