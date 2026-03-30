"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Shield, ShieldAlert, ShieldCheck, AlertTriangle,
    Clock, GitBranch, Calendar, Hash, FileCode, Wrench,
    Loader2, ChevronDown, ChevronUp, ExternalLink, Link2,
    Check, Printer, Copy
} from "lucide-react";

// ─── Severity config — screen (dark) ─────────────────────────────────────────
const SEV: Record<string, { label: string; bg: string; text: string; border: string; dot: string; printBg: string; printText: string }> = {
    critical: { label: "CRITICAL", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-500",    printBg: "#fef2f2", printText: "#b91c1c" },
    high:     { label: "HIGH",     bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500", printBg: "#fff7ed", printText: "#c2410c" },
    medium:   { label: "MEDIUM",   bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500", printBg: "#fefce8", printText: "#a16207" },
    low:      { label: "LOW",      bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400",   printBg: "#eff6ff", printText: "#1d4ed8" },
    info:     { label: "INFO",     bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400",  printBg: "#f8fafc", printText: "#475569" },
};

interface ParsedFinding {
    index: number; severity: string; title: string;
    file: string; vulnerability: string; proof: string; fix: string;
}

// ─── Parse FINDING_N blocks from markdown ─────────────────────────────────────
function parseFindings(markdown: string): ParsedFinding[] {
    if (!markdown) return [];
    const findings: ParsedFinding[] = [];
    const blocks = markdown.split(/\n(?=\*{0,2}FINDING_\d+)/i);
    for (const block of blocks) {
        const idxMatch = block.match(/FINDING_(\d+)/i);
        if (!idxMatch) continue;
        const sev  = block.match(/\*?\*?Severity\*?\*?[:\s]+(\w+)/i);
        const file = block.match(/\*?\*?File\*?\*?[:\s]+([^\n*]+)/i);
        const vuln = block.match(/\*?\*?Vulnerability\*?\*?[:\s]+([^\n*]+)/i);
        const ttl  = block.match(/FINDING_\d+[:\s]+\*?\*?([^\n*]+)/i);
        const proof = block.match(/\*?\*?Proof\*?\*?[:\s]+([\s\S]*?)(?=\n\s*[-*]\s*\*?\*?Fix|\n\s*\*?\*?Fix|$)/i);
        const fix   = block.match(/\*?\*?Fix\*?\*?[:\s]+([\s\S]*?)(?=\n\s*\*{0,2}FINDING_|$)/i);
        findings.push({
            index: parseInt(idxMatch[1]) - 1,
            severity: (sev?.[1] || "info").toLowerCase().trim(),
            title: ttl?.[1]?.replace(/\*+/g, "").trim() || vuln?.[1]?.trim() || "Security Finding",
            file: file?.[1]?.replace(/\*+/g, "").trim() || "",
            vulnerability: vuln?.[1]?.replace(/\*+/g, "").trim() || "",
            proof: proof?.[1]?.trim() || "",
            fix: fix?.[1]?.trim() || "",
        });
    }
    return findings;
}

// ─── Markdown renderer (screen) ───────────────────────────────────────────────
function MarkdownBlock({ text }: { text: string }) {
    if (!text) return null;
    const lines = text.split("\n");
    const els: React.ReactNode[] = [];
    let inCode = false, codeLines: string[] = [], key = 0;
    const flush = () => {
        if (codeLines.length) {
            els.push(<pre key={`c${key++}`} className="text-xs text-emerald-300/90 bg-black/50 rounded-lg p-3 my-2 overflow-x-auto font-mono whitespace-pre leading-relaxed border border-white/5 print:text-gray-700 print:bg-gray-50 print:border-gray-200">{codeLines.join("\n")}</pre>);
            codeLines = [];
        }
    };
    lines.forEach((line, i) => {
        if (line.startsWith("```")) { inCode ? (flush(), inCode = false) : (inCode = true); return; }
        if (inCode) { codeLines.push(line); return; }
        if (line.startsWith("# "))       els.push(<h1 key={i} className="text-xl font-bold text-white mt-5 mb-2 border-b border-white/10 pb-2 print:text-gray-900 print:border-gray-200">{line.slice(2)}</h1>);
        else if (line.startsWith("## ")) els.push(<h2 key={i} className="text-base font-bold text-white mt-4 mb-1 print:text-gray-800">{line.slice(3)}</h2>);
        else if (line.startsWith("### "))els.push(<h3 key={i} className="text-sm font-semibold text-blue-300 mt-3 mb-1 print:text-blue-700">{line.slice(4)}</h3>);
        else if (/^[-*] /.test(line))    els.push(<li key={i} className="text-sm text-white/70 ml-4 list-disc leading-relaxed mb-0.5 print:text-gray-700" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code class='font-mono text-xs bg-black/30 px-1 rounded print:bg-gray-100'>$1</code>") }} />);
        else if (line.trim() === "")     els.push(<div key={i} className="h-1.5" />);
        else els.push(<p key={i} className="text-sm text-white/70 leading-relaxed print:text-gray-700" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code class='font-mono text-xs bg-black/30 px-1 rounded print:bg-gray-100'>$1</code>") }} />);
    });
    flush();
    return <div className="space-y-0.5">{els}</div>;
}

// ─── Finding Card (screen interactive + print static) ────────────────────────
function FindingCard({ finding, printMode }: { finding: ParsedFinding; printMode?: boolean }) {
    const [expanded, setExpanded] = useState(printMode || false);
    const [copied, setCopied] = useState(false);
    const anchorId = `finding-${finding.index + 1}`;

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === `#${anchorId}`) {
            setExpanded(true);
            setTimeout(() => document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
        }
    }, [anchorId]);

    const copyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${anchorId}`)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    const cfg = SEV[finding.severity] || SEV.info;

    return (
        <div id={anchorId} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden scroll-mt-24 print:break-inside-avoid print:border print:rounded-none print:bg-white print:mb-4`}
            style={{ ['--sev-print-bg' as any]: cfg.printBg }}>

            {/* Header row */}
            <button
                onClick={() => !printMode && setExpanded(!expanded)}
                className={`w-full flex items-start gap-4 p-4 text-left ${!printMode ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'} transition-colors print:bg-gray-50 print:border-b print:border-gray-200`}
            >
                <div className="shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center print:bg-gray-100 print:rounded">
                    <span className="text-xs font-bold font-mono text-white/60 print:text-gray-600">{finding.index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${cfg.bg} ${cfg.text} border ${cfg.border} print:text-white print:rounded`}
                            style={{ ['WebkitPrintColorAdjust' as any]: 'exact', printColorAdjust: 'exact' }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} print:hidden`} />
                            {cfg.label}
                        </span>
                        <span className="font-semibold text-white text-sm print:text-gray-900">{finding.title}</span>
                    </div>
                    {finding.file && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <FileCode className="h-3.5 w-3.5 text-white/30 shrink-0 print:text-gray-400" />
                            <code className="text-xs text-blue-300/80 font-mono truncate print:text-gray-600">{finding.file}</code>
                        </div>
                    )}
                </div>
                {!printMode && (
                    <div className="flex items-center gap-2 shrink-0 ml-2 no-print">
                        <button onClick={copyLink} title="Copy link" className="p-1.5 rounded-md hover:bg-white/10 transition-colors group">
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Link2 className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60" />}
                        </button>
                        {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                    </div>
                )}
            </button>

            {/* Expanded body */}
            {(expanded || printMode) && (
                <div className="border-t border-white/8 px-5 py-4 space-y-4 print:border-gray-200 print:bg-white">
                    {finding.vulnerability && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2 print:text-gray-400">Description</div>
                            <p className="text-sm text-white/70 leading-relaxed print:text-gray-700">{finding.vulnerability}</p>
                        </div>
                    )}
                    {finding.proof && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2 print:text-gray-400">Proof of Concept</div>
                            <pre className="text-xs text-emerald-300/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-white/5 print:text-gray-700 print:bg-gray-50 print:border-gray-200 print:rounded">{finding.proof}</pre>
                        </div>
                    )}
                    {finding.fix && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="h-3.5 w-3.5 text-green-400/60 print:text-green-700" />
                                <div className="text-xs font-semibold uppercase tracking-widest text-white/40 print:text-gray-400">Remediation</div>
                            </div>
                            <pre className="text-xs text-emerald-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-white/5 print:text-green-800 print:bg-green-50 print:border-green-100 print:rounded">{finding.fix}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Report Page ─────────────────────────────────────────────────────────
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

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#060A0F] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <p className="text-white/40 text-sm font-mono">Loading report…</p>
            </div>
        </div>
    );

    if (notFound || !review) return (
        <div className="min-h-screen bg-[#060A0F] flex items-center justify-center">
            <div className="text-center">
                <ShieldAlert className="h-12 w-12 text-red-400/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg font-semibold">Report not found</p>
                <p className="text-white/30 text-sm mt-2">This report may have been removed or the link is incorrect.</p>
            </div>
        </div>
    );

    // ── Data — trust DB counts first, then fall back to parsed markdown ────────
    const parsedFindings = parseFindings(review.final_report || "");

    // DB counts are authoritative (set by Celery after real scan completion)
    const critCount  = review.critical_count  ?? parsedFindings.filter(f => f.severity === "critical").length;
    const highCount  = review.high_count      ?? parsedFindings.filter(f => f.severity === "high").length;
    const medCount   = review.medium_count    ?? parsedFindings.filter(f => f.severity === "medium").length;
    const totalCount = review.issues_found    ?? parsedFindings.length;

    // PASSED only when the scan explicitly completed AND the DB says 0 issues
    const isClean = review.status === "completed" && totalCount === 0;

    const getRisk = () => {
        if (critCount > 0) return { label: "CRITICAL RISK", cls: "bg-red-500/10 border-red-500/30 text-red-400",        icon: <ShieldAlert className="h-4 w-4" />, printColor: "#b91c1c" };
        if (highCount > 0) return { label: "HIGH RISK",     cls: "bg-orange-500/10 border-orange-500/30 text-orange-400", icon: <ShieldAlert className="h-4 w-4" />, printColor: "#c2410c" };
        if (medCount  > 0) return { label: "MEDIUM RISK",   cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", icon: <AlertTriangle className="h-4 w-4" />, printColor: "#a16207" };
        if (isClean)       return { label: "PASSED",         cls: "bg-green-500/10 border-green-500/30 text-green-400",   icon: <ShieldCheck className="h-4 w-4" />, printColor: "#15803d" };
        return                    { label: "REVIEWED",       cls: "bg-slate-500/10 border-slate-500/30 text-slate-400",   icon: <Shield className="h-4 w-4" />, printColor: "#475569" };
    };
    const risk = getRisk();

    const repoName  = review._repoName || review.repo_full_name || "Security Report";
    const scanDate  = review.completed_at || review.created_at
        ? new Date(review.completed_at || review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";
    const durationMin = review.strix_duration_seconds ? Math.ceil(review.strix_duration_seconds / 60) : null;
    const scanLabel = review.trigger_source === "webhook" && review.pr_title
        ? `PR #${review.pr_number}: ${review.pr_title}`
        : `Full Repository Scan${review.branch_name ? ` · ${review.branch_name}` : ""}`;

    return (
        <>
            {/* ── Print / PDF styles ────────────────────────────────────────── */}
            <style>{`
                @media print {
                    /* Page setup */
                    @page { margin: 18mm 15mm; size: A4; }
                    @page :first { margin-top: 10mm; }

                    /* Hide interactive chrome */
                    .no-print { display: none !important; }

                    /* Clean white canvas */
                    html, body {
                        background: #ffffff !important;
                        color: #111827 !important;
                        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
                    }

                    /* Reset all dark backgrounds */
                    * {
                        background-color: transparent !important;
                        border-color: #e5e7eb !important;
                        color: inherit !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Cover block */
                    .print-cover {
                        border: 2px solid #1e40af !important;
                        border-radius: 8px !important;
                        background: #f0f4ff !important;
                        padding: 28px 32px !important;
                        margin-bottom: 24px !important;
                    }
                    .print-cover-title { color: #111827 !important; font-size: 22px !important; font-weight: 800 !important; }
                    .print-cover-sub   { color: #4b5563 !important; font-size: 13px !important; }
                    .print-risk-badge  {
                        display: inline-flex !important;
                        align-items: center !important;
                        padding: 6px 14px !important;
                        border-radius: 6px !important;
                        font-size: 13px !important;
                        font-weight: 700 !important;
                        border-width: 1.5px !important;
                    }

                    /* Section cards */
                    .print-card {
                        border: 1px solid #d1d5db !important;
                        border-radius: 8px !important;
                        margin-bottom: 20px !important;
                        break-inside: avoid !important;
                    }
                    .print-card-header {
                        border-bottom: 1px solid #d1d5db !important;
                        padding: 12px 20px !important;
                        background: #f9fafb !important;
                    }

                    /* Stats row */
                    .print-stat {
                        border: 1px solid #d1d5db !important;
                        border-radius: 8px !important;
                        padding: 14px !important;
                        text-align: center !important;
                    }
                    .print-stat-num  { font-size: 28px !important; font-weight: 800 !important; }
                    .print-stat-label{ font-size: 11px !important; color: #6b7280 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; }

                    /* Finding cards */
                    .print-finding {
                        border: 1px solid #d1d5db !important;
                        border-radius: 6px !important;
                        margin-bottom: 14px !important;
                        break-inside: avoid !important;
                        overflow: hidden !important;
                    }
                    .print-finding-header {
                        background: #f9fafb !important;
                        padding: 10px 16px !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    }
                    pre, code {
                        background: #f3f4f6 !important;
                        color: #1f2937 !important;
                        border: 1px solid #e5e7eb !important;
                        font-size: 11px !important;
                    }

                    /* Severity badge colors — force print */
                    .sev-critical { background: #fef2f2 !important; color: #b91c1c !important; border-color: #fca5a5 !important; }
                    .sev-high     { background: #fff7ed !important; color: #c2410c !important; border-color: #fdba74 !important; }
                    .sev-medium   { background: #fefce8 !important; color: #a16207 !important; border-color: #fde047 !important; }
                    .sev-low      { background: #eff6ff !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }

                    /* Footer */
                    .print-footer {
                        border-top: 1px solid #e5e7eb !important;
                        margin-top: 24px !important;
                        padding-top: 12px !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        color: #6b7280 !important;
                        font-size: 11px !important;
                    }

                    /* Page numbers via CSS */
                    .print-footer::after {
                        content: "Zentinel · Secure everything. Compromise nothing. · zentinel.dev";
                        color: #9ca3af !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-[#060A0F] font-sans">

                {/* ── Sticky nav bar (screen only) ──────────────────────────── */}
                <div className="no-print sticky top-0 z-50 bg-[#060A0F]/95 backdrop-blur border-b border-white/8 px-6 py-3">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <a href="https://zentinel.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                            <img src="/logo.png" alt="Zentinel" className="h-8 w-auto" />
                        </a>

                        <div className="flex items-center gap-2">
                            <button onClick={copyLink}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all">
                                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? "Copied!" : "Share"}
                            </button>
                            <button onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-semibold transition-colors">
                                <Printer className="h-3.5 w-3.5" />
                                Export PDF
                            </button>
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

                <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

                    {/* ── Cover ─────────────────────────────────────────────── */}
                    <div className="print-cover rounded-2xl overflow-hidden border border-[#0052FF]/30">
                        {/* Top gradient band */}
                        <div className="bg-gradient-to-r from-[#0A1628] via-[#0A1628] to-[#0a0d1f] px-8 py-8 border-b border-[#0052FF]/20">
                            <div className="flex items-start justify-between gap-6 flex-wrap">
                                <div>
                                    <img src="/logo.png" alt="Zentinel" className="h-8 w-auto mb-4" />
                                    <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] mb-2">
                                        Security Assessment Report
                                    </div>
                                    <h1 className="print-cover-title text-2xl font-bold text-white leading-tight">{repoName}</h1>
                                    <p className="print-cover-sub text-white/50 text-sm mt-1 font-mono">{scanLabel}</p>
                                </div>
                                <div className={`print-risk-badge inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${risk.cls}`}
                                    style={{ ['WebkitPrintColorAdjust' as any]: 'exact', printColorAdjust: 'exact' }}>
                                    {risk.icon}
                                    {risk.label}
                                </div>
                            </div>
                        </div>

                        {/* Meta grid */}
                        <div className="bg-[#0A0D12] px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {[
                                { icon: Hash,      label: "Scan ID",  value: `#${id?.slice(0, 8).toUpperCase()}` },
                                { icon: GitBranch, label: "Branch",   value: review.branch_name || (review.pr_number ? `PR #${review.pr_number}` : "main") },
                                { icon: Calendar,  label: "Date",     value: scanDate },
                                { icon: Clock,     label: "Duration", value: durationMin ? `${durationMin} min` : "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon className="h-4 w-4 text-[#0052FF] mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{label}</div>
                                        <div className="text-sm text-white font-semibold mt-0.5 truncate max-w-[140px]">{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Executive Summary ─────────────────────────────────── */}
                    <div className="print-card rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                        <div className="print-card-header px-6 py-4 border-b border-white/8 flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-[#0052FF]" />
                            <h2 className="font-bold text-white">Executive Summary</h2>
                        </div>
                        <div className="p-6">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: "Total",    value: totalCount, color: "text-white",       printCls: "" },
                                    { label: "Critical", value: critCount,  color: "text-red-400",     printCls: "text-red-700" },
                                    { label: "High",     value: highCount,  color: "text-orange-400",  printCls: "text-orange-700" },
                                    { label: "Medium",   value: medCount,   color: "text-yellow-400",  printCls: "text-yellow-700" },
                                ].map(({ label, value, color, printCls }) => (
                                    <div key={label} className="print-stat bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                                        <div className={`print-stat-num text-3xl font-bold font-mono ${color} print:${printCls}`}>{value}</div>
                                        <div className="print-stat-label text-xs text-white/40 mt-1 uppercase tracking-wide">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Status message */}
                            {isClean ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                                    <ShieldCheck className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-green-400 font-semibold print:text-green-800">No vulnerabilities detected</div>
                                        <div className="text-green-400/70 text-sm mt-1 print:text-green-700">
                                            Zentinel performed a comprehensive security analysis of <strong>{repoName}</strong> and found no security issues.
                                        </div>
                                    </div>
                                </div>
                            ) : totalCount > 0 ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                                    <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-red-400 font-semibold print:text-red-800">
                                            {totalCount} security {totalCount === 1 ? "issue" : "issues"} identified
                                        </div>
                                        <div className="text-red-400/70 text-sm mt-1 print:text-red-700">
                                            Zentinel identified vulnerabilities in <strong>{repoName}</strong>.
                                            {critCount > 0 && ` ${critCount} critical ${critCount > 1 ? "issues require" : "issue requires"} immediate remediation.`}
                                            {" "}Review findings below and apply the recommended fixes.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-white/50 print:text-gray-500">Full report available below.</p>
                            )}
                        </div>
                    </div>

                    {/* ── Structured Findings ───────────────────────────────── */}
                    {parsedFindings.length > 0 && (
                        <div className="print-card rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="print-card-header px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full bg-red-500" />
                                <h2 className="font-bold text-white">
                                    Findings <span className="text-white/40 font-normal">({parsedFindings.length})</span>
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {parsedFindings.map(f => <FindingCard key={f.index} finding={f} />)}
                            </div>
                        </div>
                    )}

                    {/* ── Full Report (raw markdown) ────────────────────────── */}
                    {review.final_report && parsedFindings.length === 0 && (
                        <div className="print-card rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden">
                            <div className="print-card-header px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full bg-blue-500" />
                                <h2 className="font-bold text-white">Full Report</h2>
                            </div>
                            <div className="p-6">
                                <MarkdownBlock text={review.final_report} />
                            </div>
                        </div>
                    )}

                    {/* ── Footer ────────────────────────────────────────────── */}
                    <div className="print-footer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-4 border-t border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-[#0052FF] flex items-center justify-center">
                                <Shield className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <img src="/logo.png" alt="Zentinel" className="h-6 w-auto mb-1" />
                                <div className="text-white/40 text-xs italic print:text-gray-500">Secure everything. Compromise nothing.</div>
                            </div>
                        </div>
                        <a href="https://zentinel.dev" target="_blank" rel="noopener noreferrer"
                            className="no-print flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-semibold transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Get Zentinel for your team
                        </a>
                    </div>

                </div>
            </div>
        </>
    );
}
