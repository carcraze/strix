"use client";

import { Card } from "@/components/ui/zentinel-card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const frameworks = [
    {
        id: "SOC 2 Type II",
        progress: 87,
        status: "passing", // or failing/warning
        failingControls: [
            { id: "CC6.1", desc: "Logical access security software", severity: "high" },
            { id: "CC7.1", desc: "Configuration monitoring", severity: "medium" },
        ]
    },
    {
        id: "ISO 27001:2022",
        progress: 64,
        status: "warning",
        failingControls: [
            { id: "A.8.12", desc: "Data leakage prevention", severity: "high" },
            { id: "A.5.15", desc: "Access control", severity: "high" },
            { id: "A.8.8", desc: "Management of technical vulns", severity: "medium" },
        ]
    },
    {
        id: "HIPAA",
        progress: 100,
        status: "passing",
        failingControls: []
    },
    {
        id: "PCI DSS v4.0",
        progress: 32,
        status: "failing",
        failingControls: [
            { id: "Req 3", desc: "Protect Account Data", severity: "critical" },
            { id: "Req 6", desc: "Develop Secure Systems", severity: "high" },
            { id: "Req 10", desc: "Log and Monitor Access", severity: "high" },
            { id: "Req 11", desc: "Test Security Regularly", severity: "high" },
        ]
    }
];

export default function CompliancePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold tracking-tight">Compliance</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1 font-mono text-sm">Continuous control monitoring across industry frameworks.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-[var(--color-border)] hover:bg-white/5">
                        <FileText className="h-4 w-4 mr-2" /> Framework Settings
                    </Button>
                    <Button className="bg-[var(--color-cyan)] text-[var(--background)] hover:bg-[var(--color-cyan)]/90 font-bold">
                        <Download className="h-4 w-4 mr-2 stroke-[3px]" /> Generate Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {frameworks.map((fw) => (
                    <Card key={fw.id} className="p-6 flex flex-col h-full" glow={fw.status === "failing" ? "red" : fw.progress === 100 ? "green" : "none"}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-syne font-bold text-xl text-[var(--color-textPrimary)]">{fw.id}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={cn(
                                        "text-3xl font-bold font-syne tracking-tight",
                                        fw.status === "passing" ? "text-[var(--color-green)]" :
                                            fw.status === "failing" ? "text-[var(--color-red)]" : "text-[var(--color-amber)]"
                                    )}>
                                        {fw.progress}%
                                    </span>
                                    <span className="text-sm font-mono text-[var(--color-textSecondary)]">Ready</span>
                                </div>
                            </div>

                            {/* Radial Progress Ring (CSS based) */}
                            <div className="relative h-16 w-16">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path
                                        className="fill-none stroke-[var(--color-border)] stroke-[3]"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className={cn(
                                            "fill-none stroke-[3] transition-all duration-1000",
                                            fw.status === "passing" ? "stroke-[var(--color-green)]" :
                                                fw.status === "failing" ? "stroke-[var(--color-red)]" : "stroke-[var(--color-amber)]"
                                        )}
                                        strokeDasharray={`${fw.progress}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-[var(--color-textMuted)] mb-3">
                                {fw.failingControls.length > 0 ? "Failing Controls" : "All Controls Passing"}
                            </h4>

                            {fw.failingControls.length > 0 ? (
                                <div className="space-y-2">
                                    {fw.failingControls.map((control) => (
                                        <div key={control.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--color-border)]">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className={cn(
                                                    "h-4 w-4",
                                                    control.severity === "critical" ? "text-[var(--color-red)]" :
                                                        control.severity === "high" ? "text-[var(--color-amber)]" : "text-[var(--color-yellow)]"
                                                )} />
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-[var(--color-textPrimary)]">{control.id}</span>
                                                    <span className="text-sm text-[var(--color-textSecondary)] ml-2">{control.desc}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-[var(--color-cyan)]/10 hover:text-[var(--color-cyan)]">View Issues</Button>
                                        </div>
                                    ))}
                                    {fw.failingControls.length > 0 && fw.progress < 50 && (
                                        <div className="text-center pt-2">
                                            <span className="text-xs text-[var(--color-textMuted)] font-mono">+ {Math.floor((100 - fw.progress) / 10)} more failing controls...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[var(--color-green)]/30 rounded-lg bg-[var(--color-green)]/5">
                                    <CheckCircle2 className="h-8 w-8 text-[var(--color-green)] mb-2 opacity-80" />
                                    <span className="text-sm font-medium text-[var(--color-green)]">100% Compliant</span>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
