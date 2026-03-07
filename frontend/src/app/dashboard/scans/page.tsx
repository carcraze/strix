"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/zentinel-card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AgentDot } from "@/components/ui/agent-dot";
import { Search, Plus, ChevronDown, ChevronUp, Play, Square, Download, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const mockScans = [
    {
        id: "SCN-8932",
        status: "running",
        target: "api.zentinel.dev/v1/auth",
        type: "API",
        vuln: "Checking JWT validation...",
        severity: "info",
        created: "12 mins ago",
        agent: "exploit",
        trace: [
            { agent: "recon", action: "Discovered /v1/auth endpoint requires Bearer token.", time: "12m ago" },
            { agent: "recon", action: "Identified JWT signature algorithm: RS256.", time: "11m ago" },
            { agent: "exploit", action: "Attempting 'None' algorithm attack (CVE-2015-9256).", time: "10m ago" },
            { agent: "exploit", action: "Server rejected 'None' algorithm. Attempting weak key brute force...", time: "2m ago", active: true }
        ]
    },
    {
        id: "SCN-8931",
        status: "completed",
        target: "github.com/usestrix/core",
        type: "CODE",
        vuln: "Hardcoded API Key",
        severity: "critical",
        created: "2 hours ago",
        agent: "fix",
        trace: [
            { agent: "recon", action: "Cloned repository. Scanning commit history 30 days deep.", time: "2h 30m ago" },
            { agent: "validate", action: "Found potential AWS Secret Access Key in tests/fixtures.py.", time: "2h 25m ago" },
            { agent: "validate", action: "Pinged AWS STS GetCallerIdentity. Key is active! (PoC confirmed).", time: "2h 20m ago" },
            { agent: "fix", action: "Revoked key via AWS API. Opened PR #442 to replace with ENV var.", time: "2h 00m ago" }
        ]
    },
    {
        id: "SCN-8930",
        status: "stopped",
        target: "staging-db.zentinel.internal",
        type: "INFRA",
        vuln: "N/A",
        severity: "info",
        created: "1 day ago",
        agent: "idle",
        trace: [
            { agent: "recon", action: "Port scan initiated on 10.0.0.51.", time: "1d ago" },
            { agent: "recon", action: "Discovered open Port 5432 (PostgreSQL).", time: "1d ago" },
            { agent: "recon", action: "Scan manually aborted by user.", time: "1d ago" }
        ]
    }
];

export default function AuditTrailPage() {
    const [activeTab, setActiveTab] = useState<"active" | "history">("active");
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredScans = mockScans.filter(scan =>
        activeTab === "active" ? scan.status === "running" : scan.status !== "running"
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold tracking-tight">Audit Trail</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1 font-mono text-sm">Agent scan execution logs and reasoning traces.</p>
                </div>
                <Button className="bg-[var(--color-cyan)] text-[var(--background)] hover:bg-[var(--color-cyan)]/90 font-bold">
                    <Plus className="h-4 w-4 mr-2 stroke-[3px]" /> New Scan
                </Button>
            </div>

            <Card className="p-0 overflow-hidden">
                {/* Header / Tabs */}
                <div className="border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center bg-[var(--background)]">
                    <div className="flex w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={cn(
                                "px-6 py-4 text-sm font-semibold transition-colors relative",
                                activeTab === "active" ? "text-[var(--color-cyan)]" : "text-[var(--color-textSecondary)] hover:text-[var(--color-textPrimary)]"
                            )}
                        >
                            Active Scans (1)
                            {activeTab === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-cyan)] shadow-[0_0_8px_var(--color-cyan)]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={cn(
                                "px-6 py-4 text-sm font-semibold transition-colors relative",
                                activeTab === "history" ? "text-[var(--color-textPrimary)]" : "text-[var(--color-textSecondary)] hover:text-[var(--color-textPrimary)]"
                            )}
                        >
                            Scan History (242)
                            {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-border)]" />}
                        </button>
                    </div>
                    <div className="p-4 sm:p-0 sm:pr-4 w-full sm:w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="w-full bg-[var(--background)] border border-[var(--color-border)] rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-[var(--color-cyan)] text-[var(--color-textPrimary)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-[var(--background)]">
                                <th className="w-8 px-4"></th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Status</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Target / Endpoint</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Type</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Finding</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Severity</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Started</th>
                                <th className="px-4 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredScans.map((scan) => (
                                <React.Fragment key={scan.id}>
                                    <tr
                                        className={cn(
                                            "hover:bg-white/5 transition-colors group cursor-pointer",
                                            expandedRows[scan.id] && "bg-white/5"
                                        )}
                                        onClick={() => toggleRow(scan.id)}
                                    >
                                        <td className="px-4 py-4 text-[var(--color-textMuted)]">
                                            {expandedRows[scan.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {scan.status === "running" && <Tag color="cyan" className="animate-pulse flex items-center gap-2"><AgentDot type={scan.agent as any} className="mr-1" /> RUNNING</Tag>}
                                            {scan.status === "completed" && <Tag color="green">COMPLETED</Tag>}
                                            {scan.status === "stopped" && <Tag color="default">STOPPED</Tag>}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[var(--color-textPrimary)]">{scan.id}</span>
                                                <span className="font-mono text-xs text-[var(--color-textSecondary)]">{scan.target}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="text-xs font-mono text-[var(--color-textSecondary)] px-1.5 py-0.5 rounded-sm bg-[var(--color-border)] border border-[var(--color-textMuted)]/30">
                                                {scan.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn("text-sm transition-colors", scan.status === "running" ? "text-[var(--color-cyan)] animate-pulse" : "text-[var(--color-textPrimary)]")}>
                                                {scan.vuln}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {scan.severity !== "info" ? <SeverityBadge severity={scan.severity as any} /> : <span className="text-xs text-[var(--color-textMuted)]">—</span>}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-textSecondary)]">
                                            {scan.created}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                {scan.status === "running" ? (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-red)] hover:bg-[var(--color-red)]/10">
                                                        <Square className="h-4 w-4 fill-current" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-textSecondary)] hover:text-white hover:bg-white/10">
                                                        <Play className="h-4 w-4 fill-current" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-textSecondary)] hover:text-white hover:bg-white/10">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-textSecondary)] hover:text-white hover:bg-white/10">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Reasoning Trace */}
                                    {expandedRows[scan.id] && (
                                        <tr className="bg-[#05060A]">
                                            <td colSpan={8} className="p-0">
                                                <div className="border-l-2 border-[var(--color-cyan)] m-4 ml-6 p-4 rounded-r-xl bg-[var(--color-card)]/50">
                                                    <h4 className="font-syne font-bold text-sm mb-4 text-[var(--color-textPrimary)]">Agent Reasoning Trace</h4>
                                                    <div className="space-y-4">
                                                        {scan.trace.map((step, idx) => (
                                                            <div key={idx} className="flex gap-4 relative">
                                                                {/* Connector Line */}
                                                                {idx !== scan.trace.length - 1 && (
                                                                    <div className="absolute top-6 left-3.5 bottom-[-16px] w-[1px] bg-[var(--color-border)]" />
                                                                )}

                                                                <div className="mt-1 bg-[var(--background)] p-1 rounded-full border border-[var(--color-border)] z-10 w-8 h-8 flex items-center justify-center">
                                                                    <AgentDot type={step.agent as any} animate={step.active} />
                                                                </div>

                                                                <div className="flex-1 pb-4">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-textMuted)]">
                                                                                Agent::{step.agent}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs text-[var(--color-textSecondary)] font-mono">{step.time}</span>
                                                                    </div>
                                                                    <p className={cn("text-sm", step.active ? "text-[var(--color-textPrimary)]" : "text-[var(--color-textSecondary)]")}>
                                                                        {step.action}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}

                            {filteredScans.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-[var(--color-textMuted)] font-mono">
                                        No {activeTab} scans found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
