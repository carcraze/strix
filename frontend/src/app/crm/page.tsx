"use client";

import { useEffect, useState } from "react";
import {
    Users,
    MessageSquare,
    TrendingUp,
    ArrowUpRight,
    Clock,
    UserPlus,
    Calendar,
    ArrowRight,
    Search,
    ChevronRight,
    Plus,
    ShieldAlert,
    Target,
    Activity,
    BarChart3
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function CRMDashboard() {
    const [stats, setStats] = useState({
        prospects: 0,
        outreach: 0,
        signups: 0,
        pendingFollowups: 0
    });
    const [pipelineData, setPipelineData] = useState<any[]>([]);
    const [dailyLogs, setDailyLogs] = useState<any[]>([]);
    const [followupQueue, setFollowupQueue] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);

            // 1. Basic Stats
            const { count: pCount } = await supabase.from('prospects').select('*', { count: 'exact', head: true });
            const { count: oCount } = await supabase.from('outreach_logs').select('*', { count: 'exact', head: true });
            const { count: sCount } = await supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('contact_status', 'signed_up');
            const { count: fCount } = await supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            setStats({
                prospects: pCount || 0,
                outreach: oCount || 0,
                signups: sCount || 0,
                pendingFollowups: fCount || 0
            });

            // 2. Pipeline Funnel (from View)
            const { data: pipeline } = await supabase.from('crm_pipeline_overview').select('*');
            setPipelineData(pipeline || []);

            // 3. Daily Scorecard (Last 7 Days)
            const { data: scorecard } = await supabase.from('crm_daily_scorecard').select('*').order('log_date', { ascending: false }).limit(7);
            setDailyLogs(scorecard || []);

            // 4. Follow-up Priority Queue (Today)
            const today = new Date().toISOString().split('T')[0];
            const { data: followups } = await supabase
                .from('follow_ups')
                .select('*, prospects(company_name, founder_name)')
                .eq('status', 'pending')
                .lte('scheduled_date', today)
                .order('scheduled_date', { ascending: true })
                .limit(6);
            setFollowupQueue(followups || []);

            // 5. Recent Activity Feed
            const { data: activities } = await supabase
                .from('outreach_logs')
                .select('*, crm_staff(unique_name), prospects(company_name)')
                .order('created_at', { ascending: false })
                .limit(8);
            setRecentActivity(activities || []);

            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    const metrics = [
        { name: "Global Prospects", value: stats.prospects, icon: UserPlus, color: "var(--color-cyan)" },
        { name: "Execution Depth", value: stats.outreach, icon: MessageSquare, color: "#8B5CF6" },
        { name: "Closed Won", value: stats.signups, icon: TrendingUp, color: "#10B981" },
        { name: "Critical Follow-ups", value: stats.pendingFollowups, icon: Clock, color: "#F59E0B" },
    ];

    if (loading) return <div className="h-screen flex items-center justify-center font-mono text-xs uppercase tracking-[0.5em] text-[#444] animate-pulse">Syncing Tactical Grid...</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header: Command Center Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center border border-[var(--color-cyan)]/20 shadow-[0_0_15px_rgba(33,219,255,0.1)]">
                            <Target className="h-4 w-4 text-[var(--color-cyan)]" />
                        </div>
                        <h1 className="text-4xl font-syne font-bold text-white tracking-tight">CRM Command Center</h1>
                    </div>
                    <p className="text-[#666] max-w-xl font-mono text-xs uppercase tracking-widest leading-relaxed">
                        Tactical sales execution monitoring. Stage 1: Outreach & Conversion.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/crm/prospects/new"
                        className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4" /> New Intake
                    </Link>
                </div>
            </div>

            {/* Metrics: The High Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <Card key={m.name} className="p-8 relative overflow-hidden group hover:border-white/10 transition-all hover:-translate-y-1">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]">{m.name}</p>
                                    <h3 className="text-4xl font-syne font-bold text-white tracking-tighter">{m.value}</h3>
                                </div>
                                <div
                                    className="h-12 w-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner"
                                    style={{ backgroundColor: `${m.color}08`, color: m.color }}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="absolute -right-6 -bottom-6 h-24 w-24 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
                                <Icon className="h-full w-full" style={{ color: m.color }} />
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Center Column: Funnel & Scorecard */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Pipeline Funnel */}
                    <Card className="p-8 border-white/5 bg-[#050505] shadow-2xl">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-4 w-4 text-[var(--color-cyan)]" />
                                <h3 className="text-sm font-mono uppercase tracking-[0.3em] text-white">Pipeline Velocity</h3>
                            </div>
                            <Link href="/crm/prospects" className="text-[10px] font-mono text-[#444] hover:text-white uppercase transition-colors">Audit All Assets <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                        </div>
                        <div className="space-y-6">
                            {pipelineData.length > 0 ? pipelineData.sort((a, b) => {
                                const order: any = { prospect_identified: 1, contacted: 2, engaged: 3, signed_up: 4, active_user: 5, paid_customer: 6 };
                                return order[a.stage] - order[b.stage];
                            }).map((stage) => (
                                <div key={stage.stage} className="space-y-2 group">
                                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                                        <span className="text-[#666] group-hover:text-white transition-colors">{(stage.stage || 'unknown').replace('_', ' ')}</span>
                                        <span className="text-white bg-white/5 px-2 py-0.5 rounded">{stage.count} <span className="text-[#444]">({Math.round((stage.count / stats.prospects) * 100)}%)</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.05]">
                                        <div
                                            className="h-full bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-cyan)]/30 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(33,219,255,0.3)]"
                                            style={{ width: `${(stage.count / stats.prospects) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="h-60 flex items-center justify-center opacity-10">No Funnel Data</div>
                            )}
                        </div>
                    </Card>

                    {/* Daily Scorecard (Last 7 Days) */}
                    <Card className="p-8 border-white/5 bg-[#050505]">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="h-4 w-4 text-purple-500" />
                            <h3 className="text-sm font-mono uppercase tracking-[0.3em] text-white">Execution Persistence</h3>
                        </div>
                        <div className="h-48 flex items-end gap-3 justify-between">
                            {dailyLogs.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="relative w-full flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-purple-500/20 border border-purple-500/30 rounded-t-lg transition-all duration-700 group-hover:bg-purple-500/40 relative overflow-hidden"
                                            style={{ height: `${(day.log_count / 20) * 100}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
                                        </div>
                                        <span className="absolute -top-6 text-[9px] font-mono text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">{day.log_count}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-[#444] uppercase">{new Date(day.log_date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Activity & Follow-ups */}
                <div className="space-y-10">
                    {/* Priority Queue */}
                    <Card className="p-0 overflow-hidden bg-[#050505] border-white/5 shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-orange-400" />
                                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white">Target Queue</h3>
                            </div>
                            <span className="text-[9px] font-mono bg-orange-400/10 text-orange-400 px-2 py-0.5 rounded border border-orange-400/20">DUE_NOW</span>
                        </div>
                        <div className="divide-y divide-white/[0.02]">
                            {followupQueue.length > 0 ? followupQueue.map((f, i) => (
                                <Link
                                    key={i}
                                    href={`/crm/prospects/${f.prospect_id}`}
                                    className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                                >
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-white group-hover:text-[var(--color-cyan)] transition-colors">{f.prospects?.company_name}</p>
                                        <p className="text-[9px] font-mono text-[#444] uppercase">Follow-up #{f.follow_up_number}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-[#222] group-hover:text-white transition-colors" />
                                </Link>
                            )) : (
                                <div className="py-20 text-center opacity-10">
                                    <p className="text-[10px] font-mono uppercase tracking-widest">Targets Clear</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="p-0 overflow-hidden bg-[#050505] border-white/5">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                            <Users className="h-4 w-4 text-[#888]" />
                            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white">SDR Live Stream</h3>
                        </div>
                        <div className="p-6 space-y-8 relative before:absolute before:left-[2.25rem] before:top-8 before:bottom-8 before:w-px before:bg-white/5">
                            {recentActivity.map((log, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 z-10 shadow-xl">
                                        <Activity className="h-3 w-3 text-[#333]" />
                                    </div>
                                    <div className="space-y-1 pt-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-white uppercase font-mono">{log.crm_staff?.unique_name}</span>
                                            <span className="text-[9px] text-[#444] font-mono uppercase">Logged {log.type.split('_')[0]}</span>
                                        </div>
                                        <p className="text-[10px] text-[#888] font-mono truncate max-w-[180px]">For {log.prospects?.company_name}</p>
                                        <p className="text-[9px] text-[#333] font-mono uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
