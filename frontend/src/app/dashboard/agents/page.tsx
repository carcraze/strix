"use client";

import { Card } from "@/components/ui/zentinel-card";
import { AgentDot } from "@/components/ui/agent-dot";
import { CodeBlock } from "@/components/ui/code-block";
import { Activity, ShieldAlert, Cpu, Wrench } from "lucide-react";

export default function AgentIntelPage() {
    const agentLog = `[14:32:01] [Fix-δ] Submitted PR #142 for JWT Token Expiry patch on backend repo.
[14:31:05] [Validate-γ] Completed PoC validation for IDOR on /api/v1/users/:id/billing.
[14:30:42] [Validate-γ] Confirmed SQLi vulnerability on /api/reports via blind boolean injection. PoC generated.
[14:28:15] [Exploit-β] Attempting payload generation for suspected SQLi on /api/reports parameter 'sort'.
[14:25:33] [Recon-α] Discovered 14 new endpoints on staging.api.zentinel.dev. Mapping parameters...
[14:18:20] [Recon-α] Port scan completed on 10.0.0.51. Found open ports: 80, 443, 5432.
[14:10:00] [Recon-α] Initiated surface scan on newly deployed container tagged 'v1.4.2'.
[14:05:45] [Fix-δ] Merged PR #139: Update vulnerable dependency 'urllib3'.
[13:50:12] [Exploit-β] Fuzzing input fields on /login for potential NoSQLi...
[13:45:00] [Validate-γ] Validating reported XSS on /search. Payload successful across Chrome and Firefox engines.`;

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-48px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-syne font-bold tracking-tight">Agent Intel</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1 font-mono text-sm">Monitor Strix autonomous agents and view raw execution logs.</p>
                </div>
            </div>

            {/* 4 Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">

                {/* Recon-α */}
                <Card className="p-5 flex flex-col justify-between" glow="cyan">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <AgentDot type="recon" animate={true} />
                            <h3 className="font-syne font-bold text-[var(--color-textPrimary)]">Recon-α</h3>
                        </div>
                        <Activity className="h-4 w-4 text-[var(--color-cyan)] opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold font-mono text-[var(--color-cyan)]">8,421</div>
                        <p className="text-xs text-[var(--color-textSecondary)]">Endpoints Discovered</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between text-xs font-mono">
                        <span className="text-[var(--color-textMuted)]">Status</span>
                        <span className="text-[var(--color-cyan)]">HUNTING</span>
                    </div>
                </Card>

                {/* Exploit-β */}
                <Card className="p-5 flex flex-col justify-between" glow="none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <AgentDot type="exploit" animate={false} />
                            <h3 className="font-syne font-bold text-[var(--color-textPrimary)]">Exploit-β</h3>
                        </div>
                        <ShieldAlert className="h-4 w-4 text-[var(--color-red)] opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold font-mono text-[var(--color-textPrimary)]">14,204</div>
                        <p className="text-xs text-[var(--color-textSecondary)]">Payloads Delivered</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between text-xs font-mono">
                        <span className="text-[var(--color-textMuted)]">Status</span>
                        <span className="text-[var(--color-textSecondary)]">IDLE</span>
                    </div>
                </Card>

                {/* Validate-γ */}
                <Card className="p-5 flex flex-col justify-between" glow="amber">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <AgentDot type="validate" animate={true} />
                            <h3 className="font-syne font-bold text-[var(--color-textPrimary)]">Validate-γ</h3>
                        </div>
                        <Cpu className="h-4 w-4 text-[var(--color-amber)] opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold font-mono text-[var(--color-amber)]">42</div>
                        <p className="text-xs text-[var(--color-textSecondary)]">Confirmed Vulnerabilities</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between text-xs font-mono">
                        <span className="text-[var(--color-textMuted)]">Status</span>
                        <span className="text-[var(--color-amber)]">POC_GEN</span>
                    </div>
                </Card>

                {/* Fix-δ */}
                <Card className="p-5 flex flex-col justify-between" glow="green">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <AgentDot type="fix" animate={true} />
                            <h3 className="font-syne font-bold text-[var(--color-textPrimary)]">Fix-δ</h3>
                        </div>
                        <Wrench className="h-4 w-4 text-[var(--color-green)] opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold font-mono text-[var(--color-green)]">18</div>
                        <p className="text-xs text-[var(--color-textSecondary)]">Pull Requests Generated</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between text-xs font-mono">
                        <span className="text-[var(--color-textMuted)]">Status</span>
                        <span className="text-[var(--color-green)]">CODING</span>
                    </div>
                </Card>

            </div>

            {/* Full Width Terminal Log */}
            <Card className="flex-1 flex flex-col overflow-hidden relative">
                <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[#151b2b] flex items-center gap-3 shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <span className="font-mono text-xs text-[#7A9BB5]">strix-core-swarm-tty1</span>

                    <div className="ml-auto flex gap-4 text-xs font-mono text-[#7A9BB5]">
                        <span className="flex items-center gap-1"><AgentDot type="recon" animate={false} className="w-1.5 h-1.5" /> Recon</span>
                        <span className="flex items-center gap-1"><AgentDot type="exploit" animate={false} className="w-1.5 h-1.5" /> Exploit</span>
                        <span className="flex items-center gap-1"><AgentDot type="validate" animate={false} className="w-1.5 h-1.5" /> Validate</span>
                        <span className="flex items-center gap-1"><AgentDot type="fix" animate={false} className="w-1.5 h-1.5" /> Fix</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#0e131f] p-0">
                    <CodeBlock
                        code={agentLog}
                        language="bash"
                        className="border-0 bg-transparent h-full h-full rounded-none"
                        showLineNumbers={true}
                    />
                </div>
            </Card>

        </div>
    );
}
