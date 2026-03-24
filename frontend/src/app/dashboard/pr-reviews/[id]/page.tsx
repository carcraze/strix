"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Download, Shield, ShieldAlert, ShieldCheck,
    Clock, GitBranch, Calendar, Hash, AlertTriangle,
    ChevronDown, ChevronUp, FileCode, Wrench, Loader2,
    Terminal, ScrollText, ChevronRight, Link2, Check,
    Play
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Severity config ────────────────────────────────────────────────────────
const SEV_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    critical: { label: "CRITICAL", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-500" },
    high:     { label: "HIGH",     bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
    medium:   { label: "MEDIUM",   bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500" },
    low:      { label: "LOW",      bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400" },
    info:     { label: "INFO",     bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400" },
};

// ─── Parse Strix markdown findings ──────────────────────────────────────────
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

    // Match FINDING_N blocks – works for both "**FINDING_1:**" and "FINDING_1:"
    const findingBlocks = markdown.split(/\n(?=\*{0,2}FINDING_\d+)/i);

    for (const block of findingBlocks) {
        const idxMatch = block.match(/FINDING_(\d+)/i);
        if (!idxMatch) continue;

        const sevMatch  = block.match(/\*?\*?Severity\*?\*?[:\s]+(\w+)/i);
        const fileMatch = block.match(/\*?\*?File\*?\*?[:\s]+([^\n*]+)/i);
        const vulnMatch = block.match(/\*?\*?Vulnerability\*?\*?[:\s]+([^\n*]+)/i);
        const titleMatch = block.match(/FINDING_\d+[:\s]+\*?\*?([^\n*]+)/i);

        // Extract proof (everything between "Proof:" and "Fix:")
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

function countsBySeverity(findings: ParsedFinding[]) {
    let critical = 0, high = 0, medium = 0, low = 0;
    for (const f of findings) {
        const s = f.severity;
        if (s === "critical") critical++;
        else if (s === "high") high++;
        else if (s === "medium") medium++;
        else if (s === "low") low++;
    }
    return { critical, high, medium, low, total: findings.length };
}

// ─── Render markdown as simple HTML ─────────────────────────────────────────
function MarkdownBlock({ text }: { text: string }) {
    if (!text) return null;
    // Very lightweight markdown renderer for the Strix report
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeLines: string[] = [];
    let codeKey = 0;

    const flush = () => {
        if (codeLines.length) {
            elements.push(
                <pre key={`code-${codeKey++}`} className="text-xs text-green-400/80 bg-black/40 rounded-lg p-3 my-2 overflow-x-auto font-mono whitespace-pre leading-relaxed">
                    {codeLines.join("\n")}
                </pre>
            );
            codeLines = [];
        }
    };

    lines.forEach((raw, i) => {
        const line = raw;

        if (line.startsWith("```")) {
            if (inCode) { flush(); inCode = false; }
            else { inCode = true; }
            return;
        }
        if (inCode) { codeLines.push(line); return; }

        if (line.startsWith("# ")) {
            elements.push(<h1 key={i} className="text-xl font-bold text-white mt-6 mb-2 border-b border-white/10 pb-2">{line.slice(2)}</h1>);
        } else if (line.startsWith("## ")) {
            elements.push(<h2 key={i} className="text-base font-bold text-white mt-5 mb-1">{line.slice(3)}</h2>);
        } else if (line.startsWith("### ")) {
            elements.push(<h3 key={i} className="text-sm font-semibold text-cyan-400 mt-4 mb-1">{line.slice(4)}</h3>);
        } else if (/^\*\*FINDING_\d+/.test(line)) {
            elements.push(<h3 key={i} className="text-sm font-bold text-orange-400 mt-5 mb-1">{line.replace(/\*\*/g, "")}</h3>);
        } else if (/^[-*] /.test(line)) {
            const content = line.replace(/^[-*] /, "").replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>");
            elements.push(<li key={i} className="text-sm text-white/70 ml-4 list-disc leading-relaxed mb-0.5" dangerouslySetInnerHTML={{ __html: content }} />);
        } else if (/^\d+\. /.test(line)) {
            const content = line.replace(/^\d+\. /, "").replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>");
            elements.push(<li key={i} className="text-sm text-white/70 ml-4 list-decimal leading-relaxed mb-0.5" dangerouslySetInnerHTML={{ __html: content }} />);
        } else if (line.trim() === "") {
            elements.push(<div key={i} className="h-2" />);
        } else {
            const content = line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`([^`]+)`/g, "<code class='text-cyan-300 font-mono text-xs bg-white/8 px-1 rounded'>$1</code>");
            elements.push(<p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />);
        }
    });
    flush();
    return <div className="space-y-0.5">{elements}</div>;
}

// ─── Finding Card ────────────────────────────────────────────────────────────
function FindingCard({ finding }: { finding: ParsedFinding }) {
    const anchorId = `finding-${finding.index + 1}`;
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    // Auto-expand if this finding is linked directly via URL hash
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === `#${anchorId}`) {
            setExpanded(true);
            setTimeout(() => {
                document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 200);
        }
    }, [anchorId]);

    const copyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const sev = finding.severity;
    const cfg = SEV_CONFIG[sev] || SEV_CONFIG.info;
    return (
        <div id={anchorId} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all scroll-mt-20`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/5 transition-colors"
            >
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
                    {/* Copy shareable link */}
                    <button
                        onClick={copyLink}
                        title="Copy link to this finding"
                        className="no-print p-1.5 rounded-md hover:bg-white/10 transition-colors group"
                    >
                        {copied
                            ? <Check className="h-3.5 w-3.5 text-green-400" />
                            : <Link2 className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60" />}
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
                            <pre className="text-xs text-green-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{finding.proof}</pre>
                        </div>
                    )}
                    {finding.fix && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="h-3.5 w-3.5 text-green-400/60" />
                                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Remediation</div>
                            </div>
                            <pre className="text-xs text-emerald-400/80 bg-black/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{finding.fix}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Scan Logs ───────────────────────────────────────────────────────────────
function ScanLogs({ logs }: { logs: string }) {
    const [expanded, setExpanded] = useState(false);
    if (!logs) return null;
    const lines = logs.split("\n").filter(Boolean);
    const preview = lines.slice(0, 8);
    const shown = expanded ? lines : preview;

    const classify = (line: string) => {
        if (/error|failed|exception/i.test(line)) return "text-red-400";
        if (/warn/i.test(line)) return "text-yellow-400";
        if (/✅|success|completed|ready/i.test(line)) return "text-green-400";
        if (/\[ZENTINEL\]|INFO/i.test(line)) return "text-cyan-400";
        return "text-white/50";
    };

    return (
        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden no-print">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded bg-slate-500" />
                    <Terminal className="h-4 w-4 text-slate-400" />
                    <h2 className="font-bold text-white">Scan Logs</h2>
                    <span className="text-xs text-white/30 font-mono ml-1">{lines.length} lines</span>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                    {expanded ? "Collapse" : "Show all"}
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </button>
            </div>
            <div className="p-4 bg-black/60">
                <pre className="text-xs font-mono space-y-0.5 overflow-x-auto">
                    {shown.map((line, i) => (
                        <div key={i} className={`leading-relaxed ${classify(line)}`}>{line}</div>
                    ))}
                </pre>
                {!expanded && lines.length > 8 && (
                    <button onClick={() => setExpanded(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        + {lines.length - 8} more lines
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Live Scan Logs (Streaming) ──────────────────────────────────────────────
function LiveScanLogs({ prReviewId }: { prReviewId: string }) {
    const [logs, setLogs] = useState<{ id: string; timestamp: string; type: string; message: string; }[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    useEffect(() => {
        let reconnectTimer: NodeJS.Timeout;

        const connectSSE = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch(`/api/pr-reviews/${prReviewId}/logs`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (!response.body) return;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const payload = JSON.parse(line.slice(6));
                                if (payload.type === "log") {
                                    setLogs(prev => [...prev, {
                                        id: Math.random().toString(36).substring(7),
                                        timestamp: payload.data.timestamp || new Date().toISOString(),
                                        type: payload.data.type || "info",
                                        message: payload.data.message
                                    }].slice(-200));
                                }
                            } catch (e) { }
                        }
                    }
                }
            } catch (error) {
                console.error("Stream read error:", error);
                reconnectTimer = setTimeout(connectSSE, 5000);
            }
        };

        connectSSE();

        return () => {
            clearTimeout(reconnectTimer);
        };
    }, [prReviewId]);

    return (
        <div className="rounded-xl border border-[#0052FF]/30 bg-[#0A0D12] overflow-hidden no-print shadow-[0_0_15px_rgba(0,82,255,0.1)]">
            <div className="px-6 py-4 border-b border-[#0052FF]/20 bg-[#0052FF]/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0052FF]"></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-[#0052FF]" />
                        <h2 className="font-bold text-white tracking-tight">Live Scan Activity</h2>
                    </div>
                </div>
                <div className="text-xs font-mono text-[#0052FF] opacity-80">Streaming agent operations...</div>
            </div>
            <div className="p-5 bg-black/80 max-h-[400px] overflow-y-auto custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mb-3" />
                        <div className="text-xs text-white uppercase tracking-widest font-mono">Initializing Strix Engine...</div>
                    </div>
                ) : (
                    <div className="space-y-1 font-mono text-[11px] md:text-xs">
                        {logs.map(log => {
                            let typeColor = "text-white/50";
                            if (log.type === "thought") typeColor = "text-purple-400/60";
                            else if (log.type === "action") typeColor = "text-cyan-400/80";
                            else if (log.type === "finding") typeColor = "text-orange-400 font-bold bg-orange-400/10 px-1 rounded";
                            else if (log.type === "error") typeColor = "text-red-400 font-bold";

                            return (
                                <div key={log.id} className={`leading-relaxed flex items-start gap-3 hover:bg-white/5 px-2 py-1 -mx-2 rounded transition-colors ${typeColor}`}>
                                    <span className="text-white/30 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span className="shrink-0 w-20 text-right uppercase tracking-wider font-bold opacity-70 select-none">{log.type}</span>
                                    <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                                </div>
                            );
                        })}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ScanReportPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
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

            // Fetch repo name separately
            if (rev?.repository_id) {
                const { data: repo } = await supabase
                    .from("repositories")
                    .select("full_name, name")
                    .eq("id", rev.repository_id)
                    .single();
                if (repo) {
                    rev._repoName = repo.full_name || repo.name;
                }
            }

            setReview(rev);
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

    // ── Derive counts from parsed markdown ──────────────────────────────────
    const parsedFindings = parseFindings(review.final_report || "");
    const parsed = countsBySeverity(parsedFindings);

    // Prefer DB counts if non-zero, else use parsed
    const critCount  = review.critical_count  || parsed.critical;
    const highCount  = review.high_count      || parsed.high;
    const medCount   = review.medium_count    || parsed.medium;
    const totalFindings = review.issues_found || parsed.total;

    const repoName = review._repoName || "Unknown Repo";
    const durationMin = review.strix_duration_seconds ? Math.ceil(review.strix_duration_seconds / 60) : null;
    const isClean = review.status === "completed" && totalFindings === 0 && parsedFindings.length === 0;
    const scanDate = review.completed_at
        ? new Date(review.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const getRiskLabel = () => {
        if (isClean) return { label: "PASSED", cls: "bg-green-500/10 border-green-500/30 text-green-400", icon: <ShieldCheck className="h-4 w-4" /> };
        if (critCount > 0) return { label: "CRITICAL RISK", cls: "bg-red-500/10 border-red-500/30 text-red-400", icon: <ShieldAlert className="h-4 w-4" /> };
        if (highCount > 0) return { label: "HIGH RISK", cls: "bg-orange-500/10 border-orange-500/30 text-orange-400", icon: <ShieldAlert className="h-4 w-4" /> };
        if (medCount > 0) return { label: "MEDIUM RISK", cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", icon: <AlertTriangle className="h-4 w-4" /> };
        return { label: "PASSED", cls: "bg-green-500/10 border-green-500/30 text-green-400", icon: <ShieldCheck className="h-4 w-4" /> };
    };
    const risk = getRiskLabel();

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
                    .print-card {
                        background: white !important;
                        border-color: #e5e7eb !important;
                        break-inside: avoid;
                        overflow: visible !important;
                    }
                    .print-text { color: black !important; }
                    pre, code { background: #f3f4f6 !important; color: #1f2937 !important; }
                    @page { margin: 1cm; }
                }
            `}</style>

            <div className="min-h-screen bg-[#060A0F] font-sans">
                {/* Top bar — hidden on print */}
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
                            onClick={() => {
                                const url = `${window.location.origin}/report/${id}`;
                                navigator.clipboard.writeText(url).then(() => alert('Public link copied to clipboard!'));
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-colors"
                            title="Copy public report link"
                        >
                            <Link2 className="h-4 w-4" />
                            Share Public Link
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-[#0052FF]/80 text-white text-sm font-semibold transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download / Print PDF
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div ref={reportRef} className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                    {/* ── Header / Cover ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/10 print-card">
                        <div className="bg-gradient-to-r from-[#0A1628] to-[#0A0D12] border-b border-[#0052FF]/30 px-8 py-7">
                            <div className="flex items-start justify-between gap-6">
                                <div>
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
                                    <p className="text-white/50 text-sm mt-1 font-mono">
                                        {review.trigger_source === "manual" ? "Manual scan" : review.pr_title ? `PR: ${review.pr_title}` : "Automated scan"}
                                        {review.branch_name ? ` — branch ${review.branch_name}` : ""}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${risk.cls}`}>
                                        {risk.icon}
                                        {risk.label}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata grid */}
                        <div className="bg-[#0A0D12] px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {[
                                { icon: Hash,      label: "Scan ID",  value: `pr_${id.slice(0, 8)}…` },
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
                    <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden print-card">
                        <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                            <div className="w-1 h-5 rounded bg-[#0052FF]" />
                            <h2 className="font-bold text-white">Executive Summary</h2>
                        </div>
                        <div className="p-6">
                            {/* Stats — use parsed counts */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: "Total",    value: parsedFindings.length || totalFindings, color: "text-white" },
                                    { label: "Critical", value: critCount,  color: "text-red-400" },
                                    { label: "High",     value: highCount,  color: "text-orange-400" },
                                    { label: "Medium",   value: medCount,   color: "text-yellow-400" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                                        <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
                                        <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {isClean ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                                    <ShieldCheck className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-green-400 font-semibold">No vulnerabilities detected</div>
                                        <div className="text-green-400/70 text-sm mt-1">
                                            Zentinel performed a comprehensive security analysis of <strong className="text-green-400">{repoName}</strong> across
                                            all analysis phases including SAST, secret detection, dependency audit, and deep verification.
                                            No security issues were identified.
                                        </div>
                                    </div>
                                </div>
                            ) : parsedFindings.length > 0 ? (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                                    <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-red-400 font-semibold">
                                            {parsedFindings.length} security {parsedFindings.length === 1 ? "issue" : "issues"} found
                                        </div>
                                        <div className="text-red-400/70 text-sm mt-1">
                                            Zentinel identified vulnerabilities in <strong className="text-red-400">{repoName}</strong>.
                                            {critCount > 0 && ` ${critCount} critical issue${critCount > 1 ? "s" : ""} require immediate attention.`}
                                            {" "}Review all findings below and apply recommended remediations.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-500/8 border border-slate-500/20">
                                    <ScrollText className="h-6 w-6 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-slate-400 text-sm">Scan report available below.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Parsed Findings (structured) ── */}
                    {parsedFindings.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden print-card">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-[#0052FF]" />
                                <h2 className="font-bold text-white">Findings ({parsedFindings.length})</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {parsedFindings.map((f) => (
                                    <FindingCard key={f.index} finding={f} />
                                ))}
                            </div>
                        </div>
                    )}

                    {review.final_report && (
                        <div className="rounded-xl border border-white/10 bg-[#0A0D12] overflow-hidden print-card">
                            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
                                <div className="w-1 h-5 rounded bg-cyan-500" />
                                <ScrollText className="h-4 w-4 text-cyan-400" />
                                <h2 className="font-bold text-white">Full Strix Report</h2>
                            </div>
                            <div className="p-6">
                                <MarkdownBlock text={review.final_report} />
                            </div>
                        </div>
                    )}

                    {/* ── Scan Logs (Live if running, otherwise static if available) ── */}
                    {review.status === "running" ? (
                        <LiveScanLogs prReviewId={id} />
                    ) : (
                        review.raw_logs && <ScanLogs logs={review.raw_logs} />
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
                            Generated {scanDate} · Confidential
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
