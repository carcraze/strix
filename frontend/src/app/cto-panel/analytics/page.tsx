"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, Loader2, Crosshair, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function AnalyticsPage() {
    const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, avgDuration: 0, totalFindings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data: projects } = await supabase.from("cto_projects").select("status");
            const { data: reports } = await supabase.from("cto_scan_reports").select("status, duration_seconds, findings_summary");

            const total = projects?.length || 0;
            const completed = projects?.filter(p => p.status === "completed").length || 0;
            const active = projects?.filter(p => p.status === "active" || p.status === "scanning").length || 0;

            const completedReports = reports?.filter(r => r.status === "completed" && r.duration_seconds) || [];
            const avgDuration = completedReports.length > 0
                ? Math.round(completedReports.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / completedReports.length / 60)
                : 0;

            const totalFindings = reports?.reduce((sum, r) => {
                const s = r.findings_summary || {};
                return sum + (s.critical || 0) + (s.high || 0) + (s.medium || 0) + (s.low || 0);
            }, 0) || 0;

            setStats({ total, completed, active, avgDuration, totalFindings });
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Pentest engagement metrics and performance.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Projects", value: stats.total, icon: Crosshair, color: "text-indigo-400" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
                    { label: "Active", value: stats.active, icon: Crosshair, color: "text-amber-400" },
                    { label: "Avg Duration", value: `${stats.avgDuration}m`, icon: Clock, color: "text-blue-400" },
                    { label: "Total Findings", value: stats.totalFindings, icon: AlertTriangle, color: "text-red-400" },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-5 text-center">
                        <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-[10px] text-gray-600 uppercase mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-8 text-center">
                <BarChart3 className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Detailed charts coming soon. Metrics above refresh in real-time.</p>
            </div>
        </div>
    );
}
