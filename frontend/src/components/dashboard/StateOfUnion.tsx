"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface Stats {
    openIssues: number;
    resolvedIssues: number;
    activeScans: number;
    completedScans: number;
}

export function StateOfUnion() {
    const { activeWorkspace } = useWorkspace();
    const [stats, setStats] = useState<Stats>({ openIssues: 0, resolvedIssues: 0, activeScans: 0, completedScans: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeWorkspace) return;
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [issues, pentests] = await Promise.all([
                    supabase.from("issues").select("status").eq("organization_id", activeWorkspace.id),
                    supabase.from("pentests").select("status").eq("organization_id", activeWorkspace.id),
                ]);

                const issueData = issues.data || [];
                const pentestData = pentests.data || [];

                setStats({
                    openIssues: issueData.filter(i => i.status === "open").length,
                    resolvedIssues: issueData.filter(i => i.status === "resolved").length,
                    activeScans: pentestData.filter(p => p.status === "running" || p.status === "pending").length,
                    completedScans: pentestData.filter(p => p.status === "completed").length,
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [activeWorkspace]);

    const metrics = [
        { label: "Open Issues", value: stats.openIssues, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10" },
        { label: "Resolved", value: stats.resolvedIssues, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Active Scans", value: stats.activeScans, icon: Clock, color: "text-[var(--color-cyan)]", bg: "bg-[var(--color-cyan)]/10" },
        { label: "Completed", value: stats.completedScans, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
                <div key={m.label} className="glass-card p-5 rounded-2xl border border-[var(--color-border)] flex flex-col gap-3">
                    <div className={`h-9 w-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div>
                        <div className={`text-2xl font-syne font-bold ${loading ? "animate-pulse text-[var(--color-border)]" : "text-white"}`}>
                            {loading ? "—" : m.value}
                        </div>
                        <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{m.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
