"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft, Terminal, Shield, Loader2, Globe, Code2,
    AlertTriangle, CheckCircle2, Zap, Send, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LogEntry = {
    type: "info" | "action" | "thought" | "finding" | "error" | "phase" | "status";
    message: string;
    timestamp?: number | string;
    phase?: string;
    status?: string;
    summary?: any;
};

const LOG_COLORS: Record<string, string> = {
    info: "text-gray-600",
    action: "text-blue-600",
    thought: "text-purple-600",
    finding: "text-red-600 font-semibold",
    error: "text-red-500",
    phase: "text-indigo-700 font-bold",
    status: "text-green-700 font-bold",
};

const LOG_PREFIXES: Record<string, string> = {
    info: "ℹ️",
    action: "⚡",
    thought: "🧠",
    finding: "🚨",
    error: "❌",
    phase: "📡",
    status: "✅",
};

export default function CTOScanLivePage() {
    const params = useParams();
    const router = useRouter();
    const reportId = params.reportId as string;

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [phase, setPhase] = useState<string>("connecting");
    const [connected, setConnected] = useState(false);
    const [scanDone, setScanDone] = useState(false);
    const [katanaSummary, setKatanaSummary] = useState<any>(null);
    const [contextInput, setContextInput] = useState("");
    const [injecting, setInjecting] = useState(false);
    const [showAllLogs, setShowAllLogs] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    // SSE connection
    useEffect(() => {
        if (!reportId) return;
        let abortController = new AbortController();

        const connectStream = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "https://zentinel-api-666780032513.us-central1.run.app"}/api/cto/scan/${reportId}/logs`,
                    {
                        headers: { "Authorization": `Bearer ${session.access_token}` },
                        signal: abortController.signal,
                    }
                );

                if (!response.body) return;
                setConnected(true);
                setPhase("recon");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const msg = JSON.parse(line.slice(6));
                                const entry: LogEntry = {
                                    type: msg.type || "info",
                                    message: msg.data?.message || msg.message || "",
                                    timestamp: msg.data?.timestamp || Date.now(),
                                    phase: msg.data?.phase,
                                    status: msg.data?.status,
                                    summary: msg.data?.summary,
                                };

                                // Track phase changes
                                if (msg.type === "phase") {
                                    setPhase(msg.data?.phase || "unknown");
                                    if (msg.data?.summary) {
                                        setKatanaSummary(msg.data.summary);
                                    }
                                }

                                if (msg.type === "status") {
                                    if (msg.data?.phase) setPhase(msg.data.phase);
                                    if (msg.data?.status === "completed" || msg.data?.status === "failed") {
                                        setScanDone(true);
                                    }
                                }

                                setLogs(prev => [...prev, entry]);
                            } catch (e) {
                                // skip malformed JSON
                            }
                        }
                    }
                }
            } catch (e: any) {
                if (e.name !== "AbortError") {
                    console.error("SSE error:", e);
                    setLogs(prev => [...prev, { type: "error", message: `Connection error: ${e.message}` }]);
                }
            }
        };

        connectStream();
        return () => { abortController.abort(); };
    }, [reportId]);

    // Inject context
    const handleInjectContext = async () => {
        if (!contextInput.trim()) return;
        setInjecting(true);
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(
            `${process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "https://zentinel-api-666780032513.us-central1.run.app"}/api/cto/inject-context/${reportId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ context: contextInput }),
            }
        );
        setLogs(prev => [...prev, { type: "action", message: `[YOU] Injected: ${contextInput}`, timestamp: Date.now() }]);
        setContextInput("");
        setInjecting(false);
    };

    const filteredLogs = showAllLogs ? logs : logs.filter(l => l.type !== "info");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/cto-panel" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-indigo-600" />
                            Live Scan Terminal
                        </h1>
                        <p className="text-xs text-gray-500">Report: {reportId.slice(0, 8)}...</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Phase indicator */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
                        phase === "recon" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        phase === "pentest" ? "bg-red-50 text-red-700 border-red-200" :
                        scanDone ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-gray-50 text-gray-600 border-gray-200"
                    )}>
                        {!scanDone && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                        {phase === "recon" ? "🕷️ Katana Recon" :
                         phase === "pentest" ? "🗡️ Strix Pentest" :
                         scanDone ? "✅ Complete" : "Connecting..."}
                    </div>
                    {/* Toggle verbosity */}
                    <button
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        {showAllLogs ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {showAllLogs ? "All" : "Key"}
                    </button>
                </div>
            </div>

            {/* Katana Summary (shows after recon completes) */}
            {katanaSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">🕷️ Katana Recon Results</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                            { label: "Endpoints", value: katanaSummary.total_endpoints || 0 },
                            { label: "Subdomains", value: katanaSummary.total_subdomains || 0 },
                            { label: "JS Files", value: katanaSummary.total_js_files || 0 },
                            { label: "Forms", value: katanaSummary.total_forms || 0 },
                            { label: "Technologies", value: katanaSummary.total_technologies || 0 },
                            { label: "Secrets", value: katanaSummary.total_secrets || 0 },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className="text-lg font-bold text-blue-900">{s.value}</p>
                                <p className="text-[10px] text-blue-600 uppercase">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Terminal */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-2">
                        zentinel-cto — {connected ? "connected" : "connecting..."}
                    </span>
                    <span className="ml-auto text-xs text-gray-500 font-mono">
                        {logs.length} events
                    </span>
                </div>

                {/* Log output */}
                <div className="p-4 h-[500px] overflow-y-auto font-mono text-xs space-y-0.5">
                    {filteredLogs.length === 0 && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Waiting for scan to start...</span>
                        </div>
                    )}
                    {filteredLogs.map((log, i) => (
                        <div key={i} className={cn(
                            "leading-relaxed py-0.5",
                            log.type === "finding" ? "text-red-400 font-medium" :
                            log.type === "error" ? "text-red-400" :
                            log.type === "action" ? "text-cyan-400" :
                            log.type === "phase" || log.type === "status" ? "text-green-400 font-medium" :
                            log.type === "thought" ? "text-purple-400" :
                            "text-gray-400"
                        )}>
                            <span className="text-gray-600 mr-2">{LOG_PREFIXES[log.type] || "•"}</span>
                            {log.message}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Context injection */}
            {!scanDone && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Inject Context (tech stack, credentials, focus areas)
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={contextInput}
                            onChange={e => setContextInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleInjectContext()}
                            placeholder="e.g. 'Backend is Django with PostgreSQL, auth uses JWT stored in cookies'"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                            onClick={handleInjectContext}
                            disabled={!contextInput.trim() || injecting}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {injecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Inject
                        </button>
                    </div>
                </div>
            )}

            {/* Done state */}
            {scanDone && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-green-800">Scan complete. Report generated.</p>
                    <Link
                        href="/cto-panel"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Projects
                    </Link>
                </div>
            )}
        </div>
    );
}
