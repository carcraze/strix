"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, TerminalSquare, CheckCircle2, AlertTriangle, EyeOff, RefreshCw, Activity, Code2 } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { getIssueDetails, updateIssueStatus } from "@/lib/queries";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    critical: { color: "text-[var(--color-red)]", bg: "bg-[var(--color-red)]/10", label: "Critical" },
    high: { color: "text-[var(--color-amber)]", bg: "bg-[var(--color-amber)]/10", label: "High" },
    medium: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Medium" },
    low: { color: "text-[var(--color-green)]", bg: "bg-[var(--color-green)]/10", label: "Low" },
    info: { color: "text-[var(--color-textSecondary)]", bg: "bg-white/5", label: "Info" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "text-[var(--color-amber)]" },
    in_progress: { label: "In Progress", color: "text-blue-400" },
    fixed: { label: "Fixed", color: "text-[var(--color-green)]" },
    ignored: { label: "Ignored", color: "text-[var(--color-textMuted)]" },
};

export default function IssueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchIssue = async () => {
            setLoading(true);
            try {
                const data = await getIssueDetails(id);
                setIssue(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssue();
    }, [id]);

    const handleStatusUpdate = async (newStatus: "open" | "in_progress" | "fixed" | "ignored") => {
        if (!issue || updating) return;
        setUpdating(true);
        try {
            const updated = await updateIssueStatus(id, newStatus);
            setIssue({ ...issue, status: updated.status });
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/5 rounded w-32" />
                    <div className="h-8 bg-white/5 rounded w-2/3" />
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                </div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
                <ShieldAlert className="h-12 w-12 text-[var(--color-red)] mb-4" />
                <h1 className="text-2xl font-syne font-bold text-white mb-2">Issue Not Found</h1>
                <p className="text-[var(--color-textSecondary)] mb-6">This vulnerability does not exist or you do not have access to it.</p>
                <button onClick={() => router.push("/dashboard/issues")} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                    Back to Issues
                </button>
            </div>
        );
    }

    const conf = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
    const currentStatus = issue.status || "open";
    const statusConf = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.open;

    // Target name — repo takes priority, then domain, then pentest
    const targetName = issue.repositories?.full_name
        || issue.repositories?.name
        || issue.domains?.domain
        || issue.pentests?.name
        || "Unknown Target";

    const foundDate = issue.found_at || issue.created_at;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">

            {/* Back */}
            <button
                onClick={() => router.push("/dashboard/issues")}
                className="flex items-center text-sm text-[var(--color-textMuted)] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Issues
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                            {conf.label}
                        </span>
                        <span className={`text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 ${statusConf.color}`}>
                            {statusConf.label}
                        </span>
                        <span className="text-sm text-[var(--color-textMuted)] flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" /> Discovered by Strix Engine
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-syne font-bold text-white tracking-tight leading-tight">
                        {issue.title}
                    </h1>

                    <p className="text-[var(--color-textSecondary)] mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-textMuted)]" />
                            <span className="text-white">{targetName}</span>
                        </span>
                        {foundDate && (
                            <span className="text-[var(--color-textMuted)]">
                                Found {new Date(foundDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        )}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {currentStatus !== "in_progress" && currentStatus !== "fixed" && currentStatus !== "ignored" && (
                        <button
                            onClick={() => handleStatusUpdate("in_progress")}
                            disabled={updating}
                            className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" />
                            In Progress
                        </button>
                    )}
                    {currentStatus !== "ignored" && (
                        <button
                            onClick={() => handleStatusUpdate("ignored")}
                            disabled={updating}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--color-textSecondary)] hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <EyeOff className="h-3.5 w-3.5 inline mr-1.5" />
                            Ignore
                        </button>
                    )}
                    {currentStatus !== "fixed" ? (
                        <button
                            onClick={() => handleStatusUpdate("fixed")}
                            disabled={updating}
                            className="px-4 py-2 rounded-lg bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold transition-colors text-sm disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />
                            Mark Fixed
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStatusUpdate("open")}
                            disabled={updating}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--color-textSecondary)] transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Reopen
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)] mb-8 overflow-x-auto gap-0">
                {[
                    { id: "overview", label: "Overview", icon: null },
                    { id: "proof", label: "Proof of Concept", icon: <TerminalSquare className="h-4 w-4" /> },
                    { id: "fix", label: "Fix Guidance", icon: <Code2 className="h-4 w-4" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                            activeTab === tab.id
                                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                                : "border-transparent text-[var(--color-textSecondary)] hover:text-white"
                        }`}
                    >
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-200">

                {/* ── Overview ── */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-base font-syne font-bold text-white mb-3">Description</h3>
                                    <div className="text-[var(--color-textSecondary)] leading-relaxed bg-black/20 p-4 rounded-lg border border-[var(--color-border)] whitespace-pre-wrap text-sm">
                                        {issue.description || "No description available."}
                                    </div>
                                </div>

                                {issue.reproduction_steps && issue.reproduction_steps.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-syne font-bold text-white mb-3">Reproduction Steps</h3>
                                        <ol className="space-y-2 text-sm text-[var(--color-textSecondary)]">
                                            {issue.reproduction_steps.map((step: string, i: number) => (
                                                <li key={i} className="flex gap-3">
                                                    <span className="text-[var(--color-cyan)] font-mono font-bold shrink-0">{i + 1}.</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <Card className="p-5 space-y-5">
                                <div>
                                    <h4 className="text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider mb-3">Details</h4>
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-[var(--color-textMuted)]">Severity</dt>
                                            <dd className={`font-semibold capitalize ${conf.color}`}>{issue.severity}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-[var(--color-textMuted)]">Status</dt>
                                            <dd className={`font-semibold capitalize ${statusConf.color}`}>{statusConf.label}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-[var(--color-textMuted)]">Target</dt>
                                            <dd className="text-white text-right truncate max-w-[150px]" title={targetName}>{targetName}</dd>
                                        </div>
                                        {foundDate && (
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-[var(--color-textMuted)]">Found</dt>
                                                <dd className="text-white">{new Date(foundDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd>
                                            </div>
                                        )}
                                        {issue.auto_fix_available && (
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-[var(--color-textMuted)]">Auto-Fix</dt>
                                                <dd className="text-[var(--color-green)] font-semibold">Available</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div className="border-t border-[var(--color-border)] pt-4">
                                    <h4 className="text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider mb-3">Update Status</h4>
                                    <div className="flex flex-col gap-2">
                                        {(["open", "in_progress", "fixed", "ignored"] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusUpdate(s)}
                                                disabled={updating || currentStatus === s}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize border ${
                                                    currentStatus === s
                                                        ? "bg-white/10 border-white/20 text-white font-semibold cursor-default"
                                                        : "border-[var(--color-border)] text-[var(--color-textSecondary)] hover:bg-white/5 hover:text-white disabled:opacity-40"
                                                }`}
                                            >
                                                {currentStatus === s && <CheckCircle2 className="h-3.5 w-3.5 inline mr-2 text-[var(--color-cyan)]" />}
                                                {s.replace("_", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ── Proof of Concept ── */}
                {activeTab === "proof" && (
                    <Card className="p-0 overflow-hidden border border-[var(--color-border)]">
                        <div className="p-4 border-b border-[var(--color-border)] bg-black/40 flex items-center gap-2">
                            <TerminalSquare className="h-5 w-5 text-[var(--color-cyan)]" />
                            <h3 className="font-syne font-bold text-white">Proof of Concept</h3>
                        </div>
                        {issue.poc_request || issue.poc_response ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
                                <div className="bg-[#0D1117] p-5 font-mono text-sm">
                                    <h4 className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
                                        Exploit / Context
                                    </h4>
                                    <pre className="text-[var(--color-cyan)] overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">
                                        {issue.poc_request || "No exploit payload recorded."}
                                    </pre>
                                </div>
                                <div className="bg-[#0D1117] p-5 font-mono text-sm">
                                    <h4 className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
                                        Evidence / Response
                                    </h4>
                                    <pre className="text-[var(--color-amber)] overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">
                                        {issue.poc_response || "No response evidence recorded."}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <TerminalSquare className="h-10 w-10 text-[var(--color-textMuted)] mb-3" />
                                <p className="text-[var(--color-textSecondary)] text-sm">No proof of concept data available for this issue.</p>
                            </div>
                        )}
                    </Card>
                )}

                {/* ── Fix Guidance ── */}
                {activeTab === "fix" && (
                    <Card className="p-6 space-y-6">
                        <div>
                            <h3 className="text-base font-syne font-bold text-white mb-3 flex items-center gap-2">
                                <Code2 className="h-5 w-5 text-[var(--color-cyan)]" /> Remediation Guidance
                            </h3>
                            {issue.fix_description ? (
                                <div className="text-[var(--color-textSecondary)] leading-relaxed bg-black/20 p-4 rounded-lg border border-[var(--color-border)] whitespace-pre-wrap text-sm">
                                    {issue.fix_description}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] bg-black/20 text-[var(--color-textMuted)] text-sm">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    No fix guidance was recorded for this issue.
                                </div>
                            )}
                        </div>

                        {issue.fix_diff && (
                            <div>
                                <h3 className="text-base font-syne font-bold text-white mb-3">Suggested Diff</h3>
                                <pre className="bg-black/40 border border-[var(--color-border)] rounded-lg p-4 text-xs font-mono text-[var(--color-green)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {issue.fix_diff}
                                </pre>
                            </div>
                        )}

                        {issue.external_issue_url && (
                            <div>
                                <h3 className="text-base font-syne font-bold text-white mb-3">External Tracker</h3>
                                <a
                                    href={issue.external_issue_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[var(--color-cyan)] hover:underline text-sm"
                                >
                                    {issue.external_issue_url}
                                </a>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
