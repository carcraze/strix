"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Loader2,
  ChevronDown,
  Shield,
  Zap,
  Bot,
  Code,
  Share2,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = {
  id: string;
  organization_id: string;
  domain: string;
  type: string;
  scan_type: string;
  context: string | null;
  verified: boolean;
  verification_token: string | null;
  verification_method: string | null;
  verified_at: string | null;
  linked_repository_id: string | null;
  linked_asset_type: string;
  last_scan_at: string | null;
  issues_count: number;
  ignored_count: number;
  created_at: string;
};

type Repository = {
  id: string;
  organization_id: string;
  full_name: string;
};

type ScanType = "quick" | "attack_surface" | "agentic" | "rest_api" | "graphql";
type AssetLink = "none" | "repository" | "container";
type FilterType = "all" | "web_application" | "api" | "attack_surface";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scanTypeLabel(t: string): string {
  const labels: Record<string, string> = {
    quick: "Quick Scan",
    attack_surface: "Attack Surface",
    agentic: "Agentic Scan",
    rest_api: "REST API",
    graphql: "GraphQL",
  };
  return labels[t] || t;
}

function domainTypeLabel(t: string): string {
  const labels: Record<string, string> = {
    web_application: "Web Application",
    rest_api: "REST API",
    graphql: "GraphQL",
    attack_surface: "Attack Surface",
  };
  return labels[t] || t;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DomainsPage() {
  const { activeWorkspace } = useWorkspace();

  // Data
  const [domains, setDomains] = useState<Domain[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [selectedScanType, setSelectedScanType] = useState<ScanType>("quick");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [linkedAssetType, setLinkedAssetType] = useState<AssetLink>("none");
  const [linkedRepoId, setLinkedRepoId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verification
  const [showVerification, setShowVerification] = useState(false);
  const [verifyDomain, setVerifyDomain] = useState<{
    domain: string;
    token: string;
    id: string;
  } | null>(null);
  const [verifyTab, setVerifyTab] = useState<"dns" | "file" | "meta">("dns");
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // ─── Fetch Data ───────────────────────────────────────────────────────────

  const fetchDomains = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .eq("organization_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDomains((data as unknown as Domain[]) || []);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    if (!activeWorkspace) return;
    try {
      const { data, error } = await supabase
        .from("repositories")
        .select("id, organization_id, full_name")
        .eq("organization_id", activeWorkspace.id)
        .order("full_name", { ascending: true });

      if (error) throw error;
      setRepositories((data as unknown as Repository[]) || []);
    } catch (err) {
      console.error("Failed to fetch repositories:", err);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchRepositories();
  }, [activeWorkspace]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setAddStep(1);
    setSelectedScanType("quick");
    setShowAdvanced(false);
    setDomainInput("");
    setLinkedAssetType("none");
    setLinkedRepoId(null);
    setShowAddModal(true);
  };

  const handleFinishAdd = async () => {
    if (!activeWorkspace || !domainInput.trim()) return;
    setIsSaving(true);
    try {
      const token = generateToken();
      const domainType =
        selectedScanType === "rest_api" || selectedScanType === "graphql"
          ? selectedScanType
          : selectedScanType === "attack_surface"
          ? "attack_surface"
          : "web_application";

      const { data, error } = await supabase
        .from("domains")
        .insert({
          organization_id: activeWorkspace.id,
          domain: domainInput.trim(),
          type: domainType,
          scan_type: selectedScanType,
          verified: false,
          verification_token: token,
          verification_method: "dns_txt",
          linked_repository_id:
            linkedAssetType === "repository" ? linkedRepoId : null,
          linked_asset_type: linkedAssetType,
        })
        .select()
        .single();

      if (error) throw error;

      setShowAddModal(false);
      setVerifyDomain({ domain: data.domain, token, id: data.id });
      setShowVerification(true);
      setVerifyTab("dns");
      setVerifyError(null);
      fetchDomains();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to add domain.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyDomain) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: verifyDomain.id,
          domain: verifyDomain.domain,
          token: verifyDomain.token,
          method: verifyTab,
        }),
      });
      const result = await res.json();
      if (result.verified) {
        setShowVerification(false);
        setVerifyDomain(null);
        fetchDomains();
      } else {
        setVerifyError(
          "Verification not detected. Ensure your DNS record, file, or meta tag is configured and try again."
        );
      }
    } catch {
      setVerifyError("Verification request failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredDomains = domains.filter((d) => {
    const matchesSearch = d.domain
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "all") return true;
    if (filterType === "web_application") return d.type === "web_application";
    if (filterType === "api")
      return d.type === "rest_api" || d.type === "graphql";
    if (filterType === "attack_surface") return d.type === "attack_surface";
    return true;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 w-full bg-gray-50 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Domains &amp; APIs
            </h1>
            <p className="text-gray-500 mt-1">
              Manage verified attack surfaces and web applications.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Domain
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="all">All Domains</option>
              <option value="web_application">Front-End Apps</option>
              <option value="api">Rest / GraphQL API</option>
              <option value="attack_surface">Attack Surface</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Loading domains...</p>
          </div>
        ) : filteredDomains.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No domains configured
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Add your first domain to scan for internet-facing vulnerabilities
              and misconfigurations.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Connect Domain
            </button>
          </div>
        ) : (
          /* Table */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Domain Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Issues
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Ignored
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Last Scan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDomains.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-900">
                          {d.domain}
                        </span>
                        {d.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            NOT VERIFIED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {domainTypeLabel(d.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {d.issues_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {d.ignored_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(d.last_scan_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Add Domain Modal ──────────────────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-gray-200">
              {/* Step 1: Choose Scan Type */}
              {addStep === 1 && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Choose Scan Type
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Quick Scan */}
                    <label
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedScanType === "quick"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scanType"
                        value="quick"
                        checked={selectedScanType === "quick"}
                        onChange={() => setSelectedScanType("quick")}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedScanType === "quick"
                            ? "border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedScanType === "quick" && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-semibold text-gray-900">
                            Quick Scan
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Fast, non-intrusive check for security best practices:
                          CSP headers, cookies, JWT issues and more.
                        </p>
                      </div>
                    </label>

                    {/* Attack Surface Scan */}
                    <label
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedScanType === "attack_surface"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scanType"
                        value="attack_surface"
                        checked={selectedScanType === "attack_surface"}
                        onChange={() => setSelectedScanType("attack_surface")}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedScanType === "attack_surface"
                            ? "border-purple-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedScanType === "attack_surface" && (
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-semibold text-gray-900">
                            Attack Surface Scan
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Extensive attack surface scan that finds all
                          subdomains, leaked credentials, exposed servers, SSL
                          configuration and more.
                        </p>
                      </div>
                    </label>

                    {/* Agentic Scan */}
                    <label
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedScanType === "agentic"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scanType"
                        value="agentic"
                        checked={selectedScanType === "agentic"}
                        onChange={() => setSelectedScanType("agentic")}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedScanType === "agentic"
                            ? "border-purple-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedScanType === "agentic" && (
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-semibold text-gray-900">
                            Agentic Scan
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          AI agents that simulate real attacks on APIs and web
                          apps. Covers OWASP risks like classical SQL injection,
                          but also logic flaws, cross-tenant data leaks and
                          more.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Advanced section */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          showAdvanced ? "rotate-180" : ""
                        }`}
                      />
                      Advanced
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 space-y-3">
                        {/* REST API */}
                        <label
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedScanType === "rest_api"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="scanType"
                            value="rest_api"
                            checked={selectedScanType === "rest_api"}
                            onChange={() => setSelectedScanType("rest_api")}
                            className="hidden"
                          />
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedScanType === "rest_api"
                                ? "border-purple-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedScanType === "rest_api" && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Code className="h-4 w-4 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-900">
                                REST APIs &amp; Web Apps
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Fuzz your REST APIs and web apps against SQLi,
                              SSRF, BOLA and other attacks. Requires an openAPI
                              spec to get started.
                            </p>
                          </div>
                        </label>

                        {/* GraphQL */}
                        <label
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedScanType === "graphql"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="scanType"
                            value="graphql"
                            checked={selectedScanType === "graphql"}
                            onChange={() => setSelectedScanType("graphql")}
                            className="hidden"
                          />
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedScanType === "graphql"
                                ? "border-purple-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedScanType === "graphql" && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Share2 className="h-4 w-4 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-900">
                                GraphQL
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Test your GraphQL API against misconfigurations and
                              other attacks.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Step 1 buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStep(2)}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Add Domain Details */}
              {addStep === 2 && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Domain Details
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Configure your settings to finetune scanning and issue
                    scoring.
                  </p>

                  {/* Domain input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Domain Name
                    </label>
                    <input
                      type="text"
                      placeholder="Domain name"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Link to asset */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link domain to an asset
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Link the domain to a code repository or cloud image so
                      that we can group the issues accordingly.
                    </p>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {(["none", "repository", "container"] as AssetLink[]).map(
                        (opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setLinkedAssetType(opt);
                              if (opt !== "repository") setLinkedRepoId(null);
                            }}
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${
                              linkedAssetType === opt
                                ? "bg-purple-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {opt === "none"
                              ? "None"
                              : opt === "repository"
                              ? "Repository"
                              : "Container"}
                          </button>
                        )
                      )}
                    </div>

                    {/* Repository dropdown */}
                    {linkedAssetType === "repository" && (
                      <div className="mt-3">
                        <select
                          value={linkedRepoId || ""}
                          onChange={(e) =>
                            setLinkedRepoId(e.target.value || null)
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                          <option value="">Select a repository...</option>
                          {repositories.map((repo) => (
                            <option key={repo.id} value={repo.id}>
                              {repo.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Step 2 buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAddStep(1)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishAdd}
                      disabled={isSaving || !domainInput.trim()}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Finish"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Verification Modal ────────────────────────────────────────────── */}
        {showVerification && verifyDomain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Verify Domain Ownership
                </h2>
                <button
                  onClick={() => {
                    setShowVerification(false);
                    setVerifyDomain(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Verify <span className="font-semibold text-gray-900">{verifyDomain.domain}</span> using one of the methods below.
              </p>

              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                {(["dns", "file", "meta"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setVerifyTab(tab)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      verifyTab === tab
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "dns"
                      ? "DNS Record"
                      : tab === "file"
                      ? "File Upload"
                      : "Meta Tag"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mb-6">
                {verifyTab === "dns" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Add a DNS <span className="font-semibold text-gray-900">TXT</span> record:
                    </p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Record name</p>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                        <code className="text-sm text-gray-900 font-mono break-all">
                          _zentinel-verification.{verifyDomain.domain}
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(
                              `_zentinel-verification.${verifyDomain.domain}`
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Record value</p>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                        <code className="text-sm text-gray-900 font-mono break-all">
                          {verifyDomain.token}
                        </code>
                        <button
                          onClick={() => handleCopy(verifyDomain.token)}
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      DNS propagation might take 2–10 minutes.
                    </p>
                  </div>
                )}

                {verifyTab === "file" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Upload a file to your domain&apos;s{" "}
                      <code className="font-mono text-gray-900">.well-known</code>{" "}
                      directory:
                    </p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">File path</p>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                        <code className="text-sm text-gray-900 font-mono break-all">
                          /.well-known/zentinel-verify.txt
                        </code>
                        <button
                          onClick={() =>
                            handleCopy("/.well-known/zentinel-verify.txt")
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">File content</p>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                        <code className="text-sm text-gray-900 font-mono break-all">
                          {verifyDomain.token}
                        </code>
                        <button
                          onClick={() => handleCopy(verifyDomain.token)}
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {verifyTab === "meta" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Add a{" "}
                      <span className="font-semibold text-gray-900">
                        meta tag
                      </span>{" "}
                      to your homepage&apos;s{" "}
                      <code className="font-mono text-gray-900">&lt;head&gt;</code>:
                    </p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Meta tag</p>
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                        <code className="text-sm text-gray-900 font-mono break-all">
                          &lt;meta name=&quot;zentinel-verification&quot;
                          content=&quot;{verifyDomain.token}&quot;&gt;
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(
                              `<meta name="zentinel-verification" content="${verifyDomain.token}">`
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Place this tag in the &lt;head&gt; section of your homepage
                      at{" "}
                      <span className="font-semibold text-gray-700">
                        {verifyDomain.domain}
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Error / status */}
              {verifyError && (
                <p className="text-sm text-red-600 mb-4">{verifyError}</p>
              )}
              {isVerifying && (
                <p className="text-sm text-gray-500 mb-4 animate-pulse">
                  Checking verification...
                </p>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerification(false);
                    setVerifyDomain(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
