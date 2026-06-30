"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, ChevronRight,
  Globe, Download, FileText, Loader2, MapPin, Info, Lock, Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type FrameworkPosture = {
  framework_id: string;
  framework_name: string;
  short_name: string;
  region: string;
  authority: string;
  score: number;
  passing: number;
  failing: number;
  warning: number;
  total_controls: number;
  auto_checkable: number;
  status: "passing" | "warning" | "failing";
};

type CompliancePosture = {
  overall_score: number;
  kenya_score: number;
  uk_score: number;
  total_open_issues: number;
  frameworks: FrameworkPosture[];
};

type ControlDetail = {
  control_id: string;
  title: string;
  description: string;
  category: string;
  scan_types: string[];
  auto_checkable: boolean;
  status: "passing" | "failing" | "warning" | "manual";
  issues: { id: string; title: string; severity: string }[];
};

type FrameworkDetail = {
  framework: {
    id: string;
    name: string;
    short_name: string;
    region: string;
    description: string;
    authority: string;
    penalty_info: string;
  };
  score: number;
  passing: number;
  failing: number;
  warning: number;
  total_controls: number;
  controls: ControlDetail[];
};

// ── Constants ─────────────────────────────────────────────────────
const REGION_FLAGS: Record<string, string> = { KE: "🇰🇪", UK: "🇬🇧" };
const REGION_LABELS: Record<string, string> = { KE: "Kenya", UK: "United Kingdom" };

const STATUS_STYLES = {
  passing: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: CheckCircle2 },
  warning: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: AlertTriangle },
  failing: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle },
  manual: { bg: "bg-gray-50 border-gray-200", text: "text-gray-500", icon: Info },
};

const BACKEND_URL = process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "https://zentinel-api-666780032513.us-central1.run.app";

// ── Main Page ─────────────────────────────────────────────────────
export default function CompliancePage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [posture, setPosture] = useState<CompliancePosture | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [frameworkDetail, setFrameworkDetail] = useState<FrameworkDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regionFilter, setRegionFilter] = useState<"ALL" | "KE" | "UK">("ALL");

  // Fetch compliance posture
  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchPosture = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${BACKEND_URL}/api/compliance/posture?org_id=${activeWorkspace.id}`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPosture(data);
        }
      } catch (e) {
        console.error("Failed to fetch compliance posture:", e);
      }
      setLoading(false);
    };
    fetchPosture();
  }, [activeWorkspace]);

  // Fetch framework detail
  useEffect(() => {
    if (!selectedFramework || !activeWorkspace) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${BACKEND_URL}/api/compliance/framework/${selectedFramework}?org_id=${activeWorkspace.id}`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) {
          setFrameworkDetail(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch framework detail:", e);
      }
      setDetailLoading(false);
    };
    fetchDetail();
  }, [selectedFramework, activeWorkspace]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
      </div>
    );
  }

  const filteredFrameworks = posture?.frameworks.filter(
    fw => regionFilter === "ALL" || fw.region === regionFilter
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Posture</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time regulatory compliance across Kenya & UK frameworks — mapped from your scan findings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(["ALL", "KE", "UK"] as const).map(r => (
              <button
                key={r}
                onClick={() => { setRegionFilter(r); setSelectedFramework(null); }}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  regionFilter === r
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-l border-gray-200 first:border-l-0"
                )}
              >
                {r === "ALL" ? "All" : `${REGION_FLAGS[r]} ${REGION_LABELS[r]}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Cards */}
      {posture && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ScoreCard
            label="Overall Score"
            score={posture.overall_score}
            icon={<Shield className="h-5 w-5" />}
          />
          <ScoreCard
            label="🇰🇪 Kenya"
            score={posture.kenya_score}
            icon={<MapPin className="h-5 w-5" />}
          />
          <ScoreCard
            label="🇬🇧 United Kingdom"
            score={posture.uk_score}
            icon={<Globe className="h-5 w-5" />}
          />
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-600">Open Issues</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{posture.total_open_issues}</p>
            <p className="text-xs text-gray-500 mt-1">Impacting compliance</p>
          </div>
        </div>
      )}

      {/* Framework Grid + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Framework List */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            Frameworks ({filteredFrameworks.length})
          </p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredFrameworks.map(fw => (
              <button
                key={fw.framework_id}
                onClick={() => setSelectedFramework(fw.framework_id)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  selectedFramework === fw.framework_id
                    ? "border-sky-300 bg-sky-50/50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{REGION_FLAGS[fw.region]}</span>
                    <span className="text-sm font-semibold text-gray-900">{fw.short_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-lg font-bold",
                      fw.status === "passing" ? "text-green-600" :
                      fw.status === "warning" ? "text-amber-600" : "text-red-600"
                    )}>
                      {fw.score}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{fw.framework_name}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-green-600">{fw.passing} pass</span>
                  {fw.warning > 0 && <span className="text-amber-600">{fw.warning} warn</span>}
                  {fw.failing > 0 && <span className="text-red-600">{fw.failing} fail</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Framework Detail */}
        <div className="lg:col-span-2">
          {selectedFramework && frameworkDetail ? (
            <FrameworkDetailView detail={frameworkDetail} loading={detailLoading} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <Scale className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Select a framework to view control-level compliance status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Score Card ────────────────────────────────────────────────────
function ScoreCard({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const ringColor = score >= 80 ? "stroke-green-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500">{icon}</span>
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>
          <p className={cn("text-3xl font-bold", color)}>{score}%</p>
        </div>
        <div className="h-14 w-14">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-gray-100" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              className={ringColor}
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Framework Detail View ─────────────────────────────────────────
function FrameworkDetailView({ detail, loading }: { detail: FrameworkDetail; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
      </div>
    );
  }

  const { framework: fw, controls, score, passing, failing, warning } = detail;

  // Group controls by category
  const categories = controls.reduce((acc, ctrl) => {
    if (!acc[ctrl.category]) acc[ctrl.category] = [];
    acc[ctrl.category].push(ctrl);
    return acc;
  }, {} as Record<string, ControlDetail[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{REGION_FLAGS[fw.region]}</span>
              <h2 className="text-lg font-bold text-gray-900">{fw.name}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">{fw.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {fw.authority}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-3xl font-bold",
              score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600"
            )}>
              {score}%
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-600">{passing}✓</span>
              <span className="text-amber-600">{warning}⚠</span>
              <span className="text-red-600">{failing}✗</span>
            </div>
          </div>
        </div>
        {fw.penalty_info && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-700"><strong>Penalties:</strong> {fw.penalty_info}</p>
          </div>
        )}
      </div>

      {/* Controls by Category */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {Object.entries(categories).map(([category, ctrls]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{category}</p>
            <div className="space-y-1.5">
              {ctrls.map(ctrl => {
                const style = STATUS_STYLES[ctrl.status];
                const Icon = style.icon;
                return (
                  <div key={ctrl.control_id} className={cn("rounded-lg border p-3", style.bg)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", style.text)} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-800">{ctrl.control_id}</span>
                            <span className="text-sm font-medium text-gray-900">{ctrl.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ctrl.description}</p>
                          {ctrl.issues && ctrl.issues.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {ctrl.issues.map(issue => (
                                <div key={issue.id} className="flex items-center gap-2 text-xs">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    issue.severity === "critical" ? "bg-red-500" :
                                    issue.severity === "high" ? "bg-orange-500" :
                                    issue.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                                  )} />
                                  <span className="text-gray-700 truncate max-w-[300px]">{issue.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", style.bg, style.text)}>
                        {ctrl.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
