"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Download, Shield, ShieldAlert, ShieldCheck,
    Clock, GitBranch, Calendar, Hash, AlertTriangle,
    ChevronDown, ChevronUp, FileCode, Wrench, Loader2,
    ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const SEV_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    critical: { label: "CRITICAL", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-500" },
    high:     { label: "HIGH",     bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
    medium:   { label: "MEDIUM",   bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500" },
    low:      { label: "LOW",      bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400" },
    info:     { label: "INFO",     bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400" },
};

function SeverityBadge({ sev }: { sev: string }) {
    const cfg = SEV_CONFIG[sev?.toLowerCase()] || SEV_CONFIG.info;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function FindingCard({ finding, index }: { finding: any; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const sev = finding.severity?.toLowerCase() || "info";
    const cfg = SEV_CONFIG[sev] || SEV_CONFIG.info;
    return (
        <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono text-white/60">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <SeverityBadge sev={sev} />
                        <span className="font-semibold text-white text-sm">{finding.title || finding.description || "Unnamed Vulnerability"}</span>
                    </div>
                    {finding.file_path && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <FileCode className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                            <code className="text-xs text-cyan-400/80 font-mono truncate">{finding.file_path}</code>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 ml-2">
                    {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-white/8 px-5 py-4 space-y-4">
                    {(finding.description || finding.poc_description) && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Description</div>
                            <p className="text-sm text-white/70 leading-relaxed">{finding.description || finding.poc_description}</p>
                        </div>
                    )}
                    {(finding.poc_description || finding.poc_script_code) && finding.poc_description !== finding.description && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Proof of Concept</div>
                            <pre className="text-xs text-green-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">
                                {finding.poc_description}{finding.poc_script_code ? `\n\n${finding.poc_script_code}` : ""}
                            </pre>
                        </div>
                    )}
                    {finding.remediation_steps && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="h-3.5 w-3.5 text-green-400/60" />
                                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Remediation</div>
                            </div>
                            <p className="text-sm text-green-400/80 leading-relaxed">{finding.remediation_steps}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ScanReportPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [review, setReview] = useState<any>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            // Load the pr_review — plain select(*), NO join, avoids 400 with RLS on related tables
            const { data: rev, error: revErr } = await supabase
                .from("pr_reviews")
                .select("*")
                .eq("id", id)
                .single();

            if (revErr) {
                console.error("[pr-report] Failed to load review:", revErr.message);
                setLoading(false);
                return;
            }
            setReview(rev);

            // Fetch repository name separately
            if (rev?.repository_id) {
                const { data: repo } = await supabase
                    .from("repositories")
                    .select("full_name, name")
                    .eq("id", rev.repository_id)
                    .single();
                if (repo) {
                    setReview((prev: any) => ({ ...prev, _repoName: repo.full_name || repo.name }));
                }
            }

            // Load issues linked to this scan's repository
            if (rev?.repository_id) {
                const { data: iss } = await supabase
                    .from("issues")
                    .select("*")
                    .eq("repository_id", rev.repository_id)
                    .order("found_at", { ascending: false })
                    .limit(100);
                setIssues(iss || []);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060A0F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-white/40 text-sm font-mono">Loading report…</p>
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="min-h-screen bg-[#060A0F] flex items-center justify-center">
                <div className="text-center">
                    <ShieldAlert className="h-12 w-12 text-red-400/40 mx-auto mb-4" />
                    <p className="text-white/60">Scan report not found</p>
                    <button onClick={() => router.back()} className="mt-4 text-cyan-400 hover:underline text-sm">← Go back</button>
                </div>
            </div>
        );
    }

    const repoName = review._repoName || review.pr_title?.split("/")[0] || "Unknown Repo";
    const totalFindings = review.issues_found || 0;
    const critCount = review.critical_count || 0;
    const highCount = review.high_count || 0;
    const medCount = review.medium_count || 0;
    const lowCount = Math.max(0, totalFindings - critCount - highCount - medCount);
    const durationMin = review.strix_duration_seconds ? Math.ceil(review.strix_duration_seconds / 60) : null;
    const isClean = review.status === "completed" && totalFindings === 0;
    const scanDate = review.completed_at
        ? new Date(review.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";

    // Use issues from DB if present, otherwise parse from final_report
    const displayFindings = issues.length > 0 ? issues : [];

    return (
        <>
            {/* Print-specific styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-bg { background: white !important; }
                    body { background: white !important; }
                    .print-break { page-break-before: always; }
                }
            `}</style>

            <div className="min-h-screen bg-[#060A0F] font-sans">
                {/* Top bar — not printed */}
                <div className="no-print sticky top-0 z-50 bg-[#060A0F]/90 backdrop-blur border-b border-white/8 px-6 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to PR Reviews
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-[#0052FF]/80 text-white text-sm font-semibold transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download / Print PDF
                        </button>
                    </div>
                </div>

                {/* Report body */}
                <div ref={reportRef} className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                    {/* ── Header / Cover ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/10">
                        {/* Dark header bar */}
                        <div className="bg-gradient-to-r from-[#0A1628] to-[#0A0D12] border-b border-[#0052FF]/30 px-8 py-7">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    {/* Zentinel logo text */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-lg bg-[#0052FF] flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-lg tracking-tight leading-none">ZENTINEL</div>
                                            <div className="text-[#0052FF] text-xs font-mono mt-0.5">Security Intelligence Platform</div>
                                        </div>
                                    </div>
                                    <h1 className="text-2xl font-bold text-white leading-tight">Security Assessment Report</h1>
                                    <p className="text-white/50 text-sm mt-1 font-mono">{repoName}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                                        critCount > 0 ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                        highCount > 0 ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                        isClean ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                        "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                    }`}>
                                        {isClean ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                        {isClean ? "PASSED" : critCount > 0 ? "CRITICAL RISK" : highCount > 0 ? "HIGH RISK" : "MEDIUM RISK"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata grid */}
                        <div className="bg-[#0A0D12] px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {[
                                { icon: Hash, label: "Scan ID", value: `pr_${id.slice(0, 8)}…` },
                                { icon: GitBranch, label: "Branch", value: review.branch_name || review.pr_number ? `PR #${review.pr_number}` : "main" },
                                { icon: Calendar, label: "Date", value: scanDate },
                                { icon: Clock, label: "Duration", value: durationMin ? `${durationMin}m` : "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon className="h-4 w-4 text-[#0052FF] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="text-xs text-white/40 font-mono uppercase tracking-wider">{label}</div>
                                        <div className="text-sm text-white font-semibold mt-0.5 font-mono truncate max-w-[140px]">{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Executive Summary ── */}
                    <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                            <div className="w-1 h-5 rounded bg-[#0052FF]" />
                            <h2 className="font-bold text-white">Executive Summary</h2>
                        </div>
                        <div className="p-6">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: "Total", value: totalFindings, color: "text-white" },
                                    { label: "Critical", value: critCount, color: "text-red-400" },
                                    { label: "High", value: highCount, color: "text-orange-400" },
                                    { label: "Medium", value: medCount, color: "text-yellow-400" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                                        <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
                                        <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary text */}
                            {isClean ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                                    <ShieldCheck className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-green-400 font-semibold">No vulnerabilities detected</div>
                                        <div className="text-green-400/70 text-sm mt-1">
                                            Zentinel performed a comprehensive security analysis of <strong className="text-green-400">{repoName}</strong> across
                                            all 5 analysis phases including SAST, secret detection, dependency audit, and deep verification.
                                            No security issues were identified.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                                    <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-red-400 font-semibold">
                                            {totalFindings} security {totalFindings === 1 ? "issue" : "issues"} found
                                        </div>
                                        <div className="text-red-400/70 text-sm mt-1">
                                            Zentinel identified vulnerabilities in <strong className="text-red-400">{repoName}</strong>.
                                            {critCount > 0 && ` ${critCount} critical issue${critCount > 1 ? "s" : ""} require immediate attention.`}
                                            {" "}Review all findings below and apply recommended remediations.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Findings ── */}
                    {totalFindings > 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-[#0052FF]" />
                                <h2 className="font-bold text-white">Findings ({totalFindings})</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {displayFindings.length > 0 ? (
                                    displayFindings.map((f: any, i: number) => (
                                        <FindingCard key={f.id || i} finding={f} index={i} />
                                    ))
                                ) : (
                                    /* Fallback: render final_report markdown if no issues in DB */
                                    review.final_report ? (
                                        <div className="bg-black/40 border border-white/8 rounded-xl p-5 max-h-[600px] overflow-y-auto">
                                            <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">
                                                {review.final_report}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-white/30 text-sm">
                                            {review.issues_found} issues recorded — view Issues dashboard for details
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Raw Report (if exists and no parsed findings) ── */}
                    {review.final_report && displayFindings.length === 0 && totalFindings === 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-[#0052FF]" />
                                <h2 className="font-bold text-white">Strix Report</h2>
                            </div>
                            <div className="p-5 max-h-[500px] overflow-y-auto">
                                <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">
                                    {review.final_report}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between pt-4 pb-2 border-t border-white/8">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#0052FF] flex items-center justify-center">
                                <Shield className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs text-white/40 font-mono">Zentinel Security Platform · zentinel.dev</span>
                        </div>
                        <div className="text-xs text-white/30 font-mono">
                            Generated {new Date().toLocaleDateString()} · Confidential
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
