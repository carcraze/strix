"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Shield, ShieldAlert, ShieldCheck, AlertTriangle,
    Clock, GitBranch, Calendar, Hash, FileCode, Wrench,
    Loader2, ChevronDown, ChevronUp, ExternalLink, Link2, Check
} from "lucide-react";

// ─── Severity config ─────────────────────────────────────────────────────────
const SEV_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    critical: { label: "CRITICAL", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-500" },
    high:     { label: "HIGH",     bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
    medium:   { label: "MEDIUM",   bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500" },
    low:      { label: "LOW",      bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400" },
    info:     { label: "INFO",     bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400" },
};

// ─── Parse findings from markdown ────────────────────────────────────────────
interface ParsedFinding {
    index: number;
    severity: string;
    title: string;
    file: string;
    vulnerability: string;
    proof: string;
    fix: string;
}

function parseFindings(markdown: string): ParsedFinding[] {
    if (!markdown) return [];
    const findings: ParsedFinding[] = [];
    const blocks = markdown.split(/\n(?=\*{0,2}FINDING_\d+)/i);
    for (const block of blocks) {
        const idxMatch  = block.match(/FINDING_(\d+)/i);
        if (!idxMatch) continue;
        const sevMatch  = block.match(/\*?\*?Severity\*?\*?[:\s]+(\w+)/i);
        const fileMatch = block.match(/\*?\*?File\*?\*?[:\s]+([^\n*]+)/i);
        const vulnMatch = block.match(/\*?\*?Vulnerability\*?\*?[:\s]+([^\n*]+)/i);
        const titleMatch = block.match(/FINDING_\d+[:\s]+\*?\*?([^\n*]+)/i);
        const proofMatch = block.match(/\*?\*?Proof\*?\*?[:\s]+([\s\S]*?)(?=\n\s*[-*]\s*\*?\*?Fix|\n\s*\*?\*?Fix|$)/i);
        const fixMatch   = block.match(/\*?\*?Fix\*?\*?[:\s]+([\s\S]*?)(?=\n\s*\*{0,2}FINDING_|$)/i);
        findings.push({
            index: parseInt(idxMatch[1]) - 1,
            severity: (sevMatch?.[1] || "info").toLowerCase().trim(),
            title: titleMatch?.[1]?.replace(/\*+/g, "").trim() || vulnMatch?.[1]?.trim() || "Security Finding",
            file: fileMatch?.[1]?.replace(/\*+/g, "").trim() || "",
            vulnerability: vulnMatch?.[1]?.replace(/\*+/g, "").trim() || "",
            proof: proofMatch?.[1]?.trim() || "",
            fix: fixMatch?.[1]?.trim() || "",
        });
    }
    return findings;
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function MarkdownBlock({ text }: { text: string }) {
    if (!text) return null;
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeLines: string[] = [];
    let codeKey = 0;
    const flush = () => {
        if (codeLines.length) {
            elements.push(
                <pre key={`code-${codeKey++}`} className="text-xs text-green-400/90 bg-black/50 rounded-lg p-3 my-2 overflow-x-auto font-mono whitespace-pre leading-relaxed border border-white/5">
                    {codeLines.join("\n")}
                </pre>
            );
            codeLines = [];
        }
    };
    lines.forEach((line, i) => {
        if (line.startsWith("```")) { if (inCode) { flush(); inCode = false; } else { inCode = true; } return; }
        if (inCode) { codeLines.push(line); return; }
        if (line.startsWith("# "))   { elements.push(<h1 key={i} className="text-xl font-bold text-white mt-6 mb-2 border-b border-white/10 pb-2">{line.slice(2)}</h1>); }
        else if (line.startsWith("## "))  { elements.push(<h2 key={i} className="text-base font-bold text-white mt-5 mb-1">{line.slice(3)}</h2>); }
        else if (line.startsWith("### ")) { elements.push(<h3 key={i} className="text-sm font-semibold text-cyan-400 mt-4 mb-1">{line.slice(4)}</h3>); }
        else if (/^\*\*FINDING_\d+/.test(line)) { elements.push(<h3 key={i} className="text-sm font-bold text-orange-400 mt-5 mb-1">{line.replace(/\*\*/g, "")}</h3>); }
        else if (/^[-*] /.test(line)) {
            const html = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`([^`]+)`/g, "<code class='text-cyan-300 font-mono text-xs bg-white/8 px-1 rounded'>$1</code>");
            elements.push(<li key={i} className="text-sm text-white/70 ml-4 list-disc leading-relaxed mb-0.5" dangerouslySetInnerHTML={{ __html: html }} />);
        }
        else if (line.trim() === "") { elements.push(<div key={i} className="h-1.5" />); }
        else {
            const html = line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`([^`]+)`/g, "<code class='text-cyan-300 font-mono text-xs bg-white/8 px-1 rounded'>$1</code>");
            elements.push(<p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />);
        }
    });
    flush();
    return <div className="space-y-0.5">{elements}</div>;
}

// ─── Finding Card ─────────────────────────────────────────────────────────────
function FindingCard({ finding }: { finding: ParsedFinding }) {
    const anchorId = `finding-${finding.index + 1}`;
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === `#${anchorId}`) {
            setExpanded(true);
            setTimeout(() => document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
        }
    }, [anchorId]);

    const copyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
        navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    const sev = finding.severity;
    const cfg = SEV_CONFIG[sev] || SEV_CONFIG.info;

    return (
        <div id={anchorId} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden scroll-mt-24`}>
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/5 transition-colors">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono text-white/60">{finding.index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                        <span className="font-semibold text-white text-sm">{finding.title}</span>
                    </div>
                    {finding.file && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <FileCode className="h-3.5 w-3.5 text-white/30 shrink-0" />
                            <code className="text-xs text-cyan-400/80 font-mono truncate">{finding.file}</code>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button onClick={copyLink} title="Copy link to finding" className="p-1.5 rounded-md hover:bg-white/10 transition-colors group">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Link2 className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60" />}
                    </button>
                    {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-white/8 px-5 py-4 space-y-4">
                    {finding.vulnerability && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Vulnerability</div>
                            <p className="text-sm text-white/70 leading-relaxed">{finding.vulnerability}</p>
                        </div>
                    )}
                    {finding.proof && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Proof of Concept</div>
                            <pre className="text-xs text-green-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-white/5">{finding.proof}</pre>
                        </div>
                    )}
                    {finding.fix && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="h-3.5 w-3.5 text-green-400/60" />
                                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Remediation</div>
                            </div>
                            <pre className="text-xs text-emerald-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-white/5">{finding.fix}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Public Report Page ──────────────────────────────────────────────────
export default function PublicReportPage() {
    const params = useParams();
    const id = params?.id as string;
    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/public-report/${id}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => { setReview(data); setLoading(false); })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id]);

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

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

    if (notFound || !review) {
        return (
            <div className="min-h-screen bg-[#060A0F] flex items-center justify-center">
                <div className="text-center">
                    <ShieldAlert className="h-12 w-12 text-red-400/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg font-semibold">Report not found</p>
                    <p className="text-white/30 text-sm mt-2">This report may have been removed or the link is incorrect.</p>
                </div>
            </div>
        );
    }

    // ── Compute counts ────────────────────────────────────────────────────────
    const parsedFindings = parseFindings(review.final_report || "");
    const critCount  = review.critical_count  || parsedFindings.filter((f: ParsedFinding) => f.severity === "critical").length;
    const highCount  = review.high_count      || parsedFindings.filter((f: ParsedFinding) => f.severity === "high").length;
    const medCount   = review.medium_count    || parsedFindings.filter((f: ParsedFinding) => f.severity === "medium").length;
    const totalFindings = parsedFindings.length || review.issues_found || 0;
    const isClean = review.status === "completed" && totalFindings === 0 && parsedFindings.length === 0;
    const repoName = review._repoName || "Security Report";
    const scanDate = review.completed_at || review.created_at
        ? new Date(review.completed_at || review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";
    const durationMin = review.strix_duration_seconds ? Math.ceil(review.strix_duration_seconds / 60) : null;

    const getRisk = () => {
        if (isClean) return { label: "PASSED", cls: "bg-green-500/10 border-green-500/30 text-green-400", icon: <ShieldCheck className="h-4 w-4" /> };
        if (critCount > 0) return { label: "CRITICAL RISK", cls: "bg-red-500/10 border-red-500/30 text-red-400", icon: <ShieldAlert className="h-4 w-4" /> };
        if (highCount > 0) return { label: "HIGH RISK", cls: "bg-orange-500/10 border-orange-500/30 text-orange-400", icon: <ShieldAlert className="h-4 w-4" /> };
        if (medCount > 0) return { label: "MEDIUM RISK", cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", icon: <AlertTriangle className="h-4 w-4" /> };
        return { label: "PASSED", cls: "bg-green-500/10 border-green-500/30 text-green-400", icon: <ShieldCheck className="h-4 w-4" /> };
    };
    const risk = getRisk();

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    /* Force page white background and ensure full content prints */
                    html, body { 
                        background: white !important; 
                        height: auto !important; 
                        overflow: visible !important; 
                    }
                    * { 
                        color: black !important; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    pre, code { background: #f3f4f6 !important; color: #1f2937 !important; }
                    @page { margin: 1cm; }
                }
            `}</style>

            <div className="min-h-screen bg-[#060A0F] font-sans">
                {/* ── Public header bar ── */}
                <div className="no-print sticky top-0 z-50 bg-[#060A0F]/95 backdrop-blur border-b border-white/8 px-6 py-3">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        {/* Zentinel branding */}
                        <a href="https://zentinel.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center">
                                <Shield className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-white font-bold text-sm tracking-tight leading-none">ZENTINEL</div>
                                <div className="text-[#0052FF]/80 text-[10px] font-mono">Security Intelligence Platform</div>
                            </div>
                        </a>

                        <div className="flex items-center gap-2">
                            {/* Copy share link */}
                            <button
                                onClick={copyShareLink}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Link2 className="h-3.5 w-3.5" />}
                                {copied ? "Copied!" : "Copy link"}
                            </button>
                            {/* Print */}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0052FF]/80 text-white text-xs font-semibold transition-colors"
                            >
                                Save PDF
                            </button>
                            {/* PR link */}
                            {review.pr_url && (
                                <a href={review.pr_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs transition-all">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">View PR</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                    {/* ── Cover / Header ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/10">
                        <div className="bg-linear-to-r from-[#0A1628] to-[#0A0D12] border-b border-[#0052FF]/30 px-8 py-8">
                            <div className="flex items-start justify-between gap-6 flex-wrap">
                                <div>
                                    <div className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">Security Assessment Report</div>
                                    <h1 className="text-2xl font-bold text-white leading-tight">{repoName}</h1>
                                    <p className="text-white/50 text-sm mt-1 font-mono">
                                        {review.trigger_source === "webhook" && review.pr_title
                                            ? `PR: ${review.pr_title}`
                                            : review.trigger_source === "manual"
                                            ? `Manual scan${review.branch_name ? ` — ${review.branch_name}` : ""}`
                                            : review.pr_title || "Full repo scan"}
                                    </p>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${risk.cls}`}>
                                    {risk.icon}
                                    {risk.label}
                                </div>
                            </div>
                        </div>

                        {/* Meta grid */}
                        <div className="bg-[#0A0D12] px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {[
                                { icon: Hash,      label: "Scan ID",  value: `pr_${id?.slice(0, 8)}…` },
                                { icon: GitBranch, label: "Branch",   value: review.branch_name || (review.pr_number ? `PR #${review.pr_number}` : "main") },
                                { icon: Calendar,  label: "Date",     value: scanDate },
                                { icon: Clock,     label: "Duration", value: durationMin ? `${durationMin}m` : "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon className="h-4 w-4 text-[#0052FF] mt-0.5 shrink-0" />
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
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: "Total",    value: totalFindings, color: "text-white" },
                                    { label: "Critical", value: critCount,     color: "text-red-400" },
                                    { label: "High",     value: highCount,     color: "text-orange-400" },
                                    { label: "Medium",   value: medCount,      color: "text-yellow-400" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                                        <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
                                        <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {isClean ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                                    <ShieldCheck className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-green-400 font-semibold">No vulnerabilities detected</div>
                                        <div className="text-green-400/70 text-sm mt-1">
                                            Zentinel performed a comprehensive security analysis of <strong className="text-green-400">{repoName}</strong>. No security issues were identified.
                                        </div>
                                    </div>
                                </div>
                            ) : parsedFindings.length > 0 ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                                    <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-red-400 font-semibold">
                                            {parsedFindings.length} security {parsedFindings.length === 1 ? "issue" : "issues"} identified
                                        </div>
                                        <div className="text-red-400/70 text-sm mt-1">
                                            Zentinel identified vulnerabilities in <strong className="text-red-400">{repoName}</strong>.
                                            {critCount > 0 && ` ${critCount} critical issue${critCount > 1 ? "s" : ""} require immediate remediation.`}
                                            {" "}See findings below and apply the recommended fixes.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-500/8 border border-slate-500/20 text-slate-400 text-sm">
                                    Full report available below.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Structured Findings ── */}
                    {parsedFindings.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-[#0052FF]" />
                                <h2 className="font-bold text-white">Findings ({parsedFindings.length})</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {parsedFindings.map((f: ParsedFinding) => <FindingCard key={f.index} finding={f} />)}
                            </div>
                        </div>
                    )}

                    {/* ── Full Report ── */}
                    {review.final_report && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-cyan-500" />
                                <h2 className="font-bold text-white">Full Report</h2>
                            </div>
                            <div className="p-6">
                                <MarkdownBlock text={review.final_report} />
                            </div>
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-4 border-t border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-[#0052FF] flex items-center justify-center">
                                <Shield className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="text-white/70 font-semibold text-sm">Zentinel Security Platform</div>
                                <div className="text-white/30 text-xs font-mono">AI-powered penetration testing for dev teams</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="https://zentinel.dev" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-[#0052FF]/80 text-white text-xs font-semibold transition-colors">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Get Zentinel for your team
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
