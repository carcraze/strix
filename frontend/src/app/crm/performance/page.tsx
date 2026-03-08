"use client";

import { useEffect, useState } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Trophy,
    Flame,
    Zap,
    ChevronRight,
    Search,
    Calendar,
    Filter,
    MessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function PerformancePage() {
    const [scorecard, setScorecard] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('weekly');

    const WEEKLY_TARGETS = {
        outreach: 100,
        signups: 10
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch daily scorecard data
            const { data: rawData, error: scError } = await supabase
                .from('crm_daily_scorecard')
                .select('*, crm_staff(unique_name)');

            if (scError) throw scError;

            // Fetch staff list for comprehensive view even if no logs
            const { data: staffData } = await supabase.from('crm_staff').select('*').eq('is_active', true);

            // Group by staff and calculate weekly (total) stats
            const aggregated = staffData?.map(staff => {
                const staffLogs = rawData?.filter(d => d.staff_id === staff.id) || [];
                const totals = staffLogs.reduce((acc, curr) => ({
                    outreach: acc.outreach + (Number(curr.messages_sent) || 0),
                    replies: acc.replies + (Number(curr.replies_received) || 0),
                    signups: acc.signups + (Number(curr.signups_generated) || 0)
                }), { outreach: 0, replies: 0, signups: 0 });

                return {
                    id: staff.id,
                    name: staff.unique_name,
                    ...totals,
                    outreachProgress: Math.min(100, (totals.outreach / WEEKLY_TARGETS.outreach) * 100),
                    signupProgress: Math.min(100, (totals.signups / WEEKLY_TARGETS.signups) * 100)
                };
            }).sort((a, b) => b.outreach - a.outreach) || [];

            setScorecard(aggregated);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching performance data:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                <BarChart3 className="h-8 w-8 text-[#444]" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#444]">Computing Alpha_Metrics...</p>
        </div>
    );

    const totalOutreach = scorecard.reduce((sum, s) => sum + s.outreach, 0);
    const totalSignups = scorecard.reduce((sum, s) => sum + s.signups, 0);
    const avgResponseRate = totalOutreach > 0 ? (scorecard.reduce((sum, s) => sum + s.replies, 0) / totalOutreach) * 100 : 0;

    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[var(--color-cyan)]">
                        <Trophy className="h-5 w-5" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.4em] font-bold">Elite Performance Hub</span>
                    </div>
                    <h1 className="text-5xl font-syne font-bold text-white tracking-tight leading-none italic">
                        Weekly Scorecard<span className="text-[var(--color-cyan)]">.</span>
                    </h1>
                    <p className="text-[#555] font-mono text-xs uppercase tracking-widest max-w-xl">
                        Real-time synchronization of SDR output against mission-critical growth targets.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                    {['weekly', 'monthly', 'all-time'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all",
                                timeRange === r ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold" : "text-[#555] hover:text-white"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Metrics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Fleet Outreach", val: totalOutreach, target: WEEKLY_TARGETS.outreach * scorecard.length, icon: Flame, color: "text-orange-500" },
                    { label: "Conversion Alpha", val: totalSignups, target: WEEKLY_TARGETS.signups * scorecard.length, icon: Zap, color: "text-yellow-400" },
                    { label: "Engagement Rate", val: `${avgResponseRate.toFixed(1)}%`, target: "15%", icon: TrendingUp, color: "text-[var(--color-cyan)]" }
                ].map((m, i) => (
                    <Card key={i} className="p-8 border-white/5 bg-[#050505] group hover:border-white/10 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <m.icon className="h-24 w-24 -mr-8 -mt-8" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <span className="text-[10px] font-mono text-[#444] uppercase tracking-[0.3em]">{m.label}</span>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-syne font-bold text-white leading-none">{m.val}</span>
                                <span className="text-[10px] font-mono text-[#333] mb-1 uppercase">/ {m.target}</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out", m.color.replace('text-', 'bg-'))}
                                    style={{ width: `${Math.min(100, (typeof m.val === 'number' ? (m.val / Number(m.target)) * 100 : 80))}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Individual Performance Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 pl-4 border-l-2 border-[var(--color-cyan)]">
                    <Users className="h-5 w-5 text-[var(--color-cyan)]" />
                    <h2 className="text-2xl font-syne font-bold text-white uppercase tracking-tight italic">SDR Leaderboard</h2>
                </div>

                <div className="space-y-4">
                    {scorecard.map((s, i) => (
                        <Card key={s.id} className="p-10 border-white/5 bg-[#050505] hover:bg-white/[0.01] transition-all group">
                            <div className="grid grid-cols-1 lg:grid-cols-4 items-center gap-12">
                                {/* Rank & Profile */}
                                <div className="flex items-center gap-8 col-span-1">
                                    <div className="text-3xl font-syne font-bold text-[#222] italic group-hover:text-[var(--color-cyan)]/20 transition-colors">
                                        0{i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-syne font-bold text-white">{s.name}</h3>
                                        <p className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Active Operative</p>
                                    </div>
                                </div>

                                {/* Outreach Metric */}
                                <div className="space-y-4 col-span-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-mono text-[#555] uppercase tracking-tighter">Mission: Outreach</span>
                                        <span className="text-xl font-syne font-bold text-white">{s.outreach} <span className="text-[10px] text-[#333] tracking-tighter italic">UNIT_PUSHED</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white/40 group-hover:bg-white transition-all duration-1000"
                                            style={{ width: `${s.outreachProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-[#333]">
                                        <span>Quota Status</span>
                                        <span>{s.outreachProgress.toFixed(0)}% Complete</span>
                                    </div>
                                </div>

                                {/* Conversion Metric */}
                                <div className="space-y-4 col-span-1 border-x border-white/5 px-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-mono text-[#555] uppercase tracking-tighter">Mission: Signups</span>
                                        <span className="text-xl font-syne font-bold text-[var(--color-cyan)]">{s.signups} <span className="text-[10px] text-[var(--color-cyan)]/20 tracking-tighter italic">ALPHA_GEN</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-cyan)] shadow-[0_0_15px_rgba(33,219,255,0.4)] transition-all duration-1000"
                                            style={{ width: `${s.signupProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-[#333]">
                                        <span>Alpha Quota</span>
                                        <span>{s.signupProgress.toFixed(0)}% Complete</span>
                                    </div>
                                </div>

                                {/* Quick Stats & Actions */}
                                <div className="flex items-center justify-between col-span-1 pl-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-3 w-3 text-[#333]" />
                                            <span className="text-[10px] font-mono text-[#666] tracking-tighter break-all">{s.replies} Replies Logged</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-3 w-3 text-[var(--color-cyan)]" />
                                            <span className="text-[10px] font-mono text-[var(--color-cyan)]/60 tracking-tighter uppercase font-bold">Responded: {s.outreach > 0 ? ((s.replies / s.outreach) * 100).toFixed(1) : 0}%</span>
                                        </div>
                                    </div>
                                    <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#444] hover:text-white hover:border-white/20 transition-all">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Target Configuration Alert */}
            <div className="p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <div className="h-16 w-16 rounded-3xl bg-[var(--color-cyan)]/10 flex items-center justify-center border border-[var(--color-cyan)]/20">
                        <Target className="h-8 w-8 text-[var(--color-cyan)]" />
                    </div>
                    <div>
                        <h4 className="text-xl font-syne font-bold text-white uppercase tracking-tight">Mission Objective Alpha</h4>
                        <p className="text-xs font-mono text-[#444] uppercase tracking-widest mt-1">Global Target: 100 Outreaches / 10 Signups per Operational Unit (Weekly)</p>
                    </div>
                </div>
                <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-all text-xs uppercase tracking-widest font-syne">
                    Optimize Targets
                </button>
            </div>
        </div>
    );
}
