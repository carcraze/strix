"use client";

import { Card } from "@/components/ui/zentinel-card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Tag } from "@/components/ui/tag";
import {
    Bell,
    Mail,
    MessageSquare,
    AlertTriangle,
    Zap,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Webhook,
    Activity
} from "lucide-react";

const mockPulseFeed = [
    {
        id: 1,
        type: "vuln",
        title: "Critical Vulnerability Discovered",
        desc: "Blind SQL Injection detected on api.zentinel.dev/v1/reports",
        time: "2 hours ago",
        severity: "critical",
        icon: ShieldAlert,
        iconColor: "text-[var(--color-red)]",
        bgPath: "bg-[var(--color-red)]/5",
    },
    {
        id: 2,
        type: "fix",
        title: "Auto-Fix PR Generated",
        desc: "Fix-δ created PR #442 for Exposed AWS Access Key",
        time: "2 hours ago",
        severity: "info",
        icon: Zap,
        iconColor: "text-[var(--color-green)]",
        bgPath: "bg-[var(--background)]",
    },
    {
        id: 3,
        type: "system",
        title: "Scan Completed",
        desc: "Scheduled surface scan on github.com/usestrix/core finished (2m 14s).",
        time: "3 hours ago",
        severity: "info",
        icon: CheckCircle2,
        iconColor: "text-[var(--color-cyan)]",
        bgPath: "bg-[var(--background)]",
    },
    {
        id: 4,
        type: "agent",
        title: "Agent Started",
        desc: "Exploit-β instantiated for deep-dive on staging environment.",
        time: "5 hours ago",
        severity: "info",
        icon: Activity,
        iconColor: "text-[var(--color-textSecondary)]",
        bgPath: "bg-[var(--background)]",
    }
];

export default function AlertsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold tracking-tight">Alerts & Pulse</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1 font-mono text-sm">System event feed and external notification routing.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Pulse Feed (Left 2/3) */}
                <Card className="xl:col-span-2 p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--background)]">
                        <h3 className="font-syne font-bold text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[var(--color-cyan)]" /> Pulse Feed
                        </h3>
                        <div className="flex gap-2">
                            <Tag color="cyan" className="cursor-pointer hover:bg-[var(--color-cyan)]/20">All</Tag>
                            <Tag color="default" className="cursor-pointer hover:bg-white/10">Vulnerabilities</Tag>
                            <Tag color="default" className="cursor-pointer hover:bg-white/10">System</Tag>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        <div className="divide-y divide-[var(--color-border)]">
                            {mockPulseFeed.map((event) => (
                                <div key={event.id} className={`p-4 sm:p-6 flex gap-4 transition-colors hover:bg-white/5 ${event.bgPath}`}>
                                    <div className="shrink-0 mt-1">
                                        <event.icon className={`h-5 w-5 ${event.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                                            <h4 className="font-bold text-[var(--color-textPrimary)]">{event.title}</h4>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {event.severity === "critical" && <SeverityBadge severity="critical" />}
                                                <span className="flex items-center text-xs text-[var(--color-textMuted)] font-mono">
                                                    <Clock className="h-3 w-3 mr-1" /> {event.time}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--color-textSecondary)]">{event.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Routing Configurations (Right 1/3) */}
                <div className="space-y-6 flex flex-col">

                    <Card className="p-6">
                        <h3 className="font-syne font-bold text-lg mb-4 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[var(--color-textSecondary)]" /> Email Digest
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-textPrimary)]">Daily Summary</p>
                                    <p className="text-xs text-[var(--color-textMuted)]">Sent at 08:00 UTC</p>
                                </div>
                                {/* Toggle Mock */}
                                <div className="w-10 h-5 bg-[var(--color-cyan)] rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-textPrimary)]">Critical Alerts</p>
                                    <p className="text-xs text-[var(--color-textMuted)]">Sent immediately</p>
                                </div>
                                <div className="w-10 h-5 bg-[var(--color-cyan)] rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-syne font-bold text-lg mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-[#4A154B]" /> Slack Integration
                        </h3>
                        <p className="text-xs text-[var(--color-textSecondary)] mb-4">Route Agent Intel and Vulnerability alerts to a unified Slack channel.</p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-mono text-[var(--color-textMuted)] uppercase mb-1 block">Webhook URL</label>
                                <input
                                    type="password"
                                    value="https://hooks.slack.com/services/your-webhook-token-here"
                                    readOnly
                                    className="w-full bg-[var(--background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-textMuted)] cursor-not-allowed"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 border-[var(--color-border)] hover:bg-white/5">Test</Button>
                                <Button variant="outline" size="sm" className="flex-1 text-[var(--color-red)] border-[var(--color-red)]/20 hover:bg-[var(--color-red)]/10">Remove</Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 flex-1 border-dashed border-[var(--color-border)] bg-transparent flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <AlertTriangle className="h-6 w-6 text-[var(--color-green)]" />
                        </div>
                        <h4 className="font-bold text-[var(--color-textPrimary)] mb-1">PagerDuty</h4>
                        <p className="text-xs text-[var(--color-textSecondary)] mb-4 max-w-[200px]">Send high severity alerts directly to your on-call team.</p>
                        <Button size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold">
                            <Webhook className="h-3 w-3 mr-2" /> Connect
                        </Button>
                    </Card>

                </div>
            </div>
        </div>
    );
}
