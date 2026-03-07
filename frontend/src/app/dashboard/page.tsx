"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Calendar, GitPullRequest, ArrowRight, Activity, Code, Lock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [pentests, setPentests] = useState<any[]>([]);
    const [issues, setIssues] = useState({ critical: 0, high: 0, medium: 0 });
    const [reviews, setReviews] = useState<any[]>([]);
    const { activeWorkspace } = useWorkspace();

    useEffect(() => {
        const fetchData = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                // Fetch recent pentests for this organization
                const { data: pItems } = await supabase
                    .from('pentests')
                    .select('*')
                    .eq('organization_id', activeWorkspace.id)
                    .order('created_at', { ascending: false })
                    .limit(5);
                setPentests(pItems || []);

                // Fetch issue counts for this organization
                const { data: iData } = await supabase
                    .from('issues')
                    .select('severity')
                    .eq('organization_id', activeWorkspace.id);

                if (iData) {
                    setIssues({
                        critical: iData.filter(i => i.severity === 'critical').length,
                        high: iData.filter(i => i.severity === 'high').length,
                        medium: iData.filter(i => i.severity === 'medium').length,
                    });
                } else {
                    setIssues({ critical: 0, high: 0, medium: 0 });
                }

                /* 
                 * Fetch PR reviews 
                 * In a real implementation we'd join via repositories
                 */
                const { data: prData } = await supabase
                    .from('pr_reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);
                setReviews(prData || []);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeWorkspace]);

    if (loading) {
        return <div className="animate-pulse flex items-center justify-center min-h-[60vh] text-[var(--color-textMuted)]">Initializing Dashboard UI...</div>;
    }

    const hasData = pentests.length > 0 || reviews.length > 0 || issues.critical > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center px-4 animate-in fade-in duration-500">
                <div className="h-16 w-16 bg-[var(--color-cyan)] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                    <Activity className="h-8 w-8 text-black" />
                </div>
                <h1 className="text-4xl font-syne font-bold text-white mb-4">Get started with Zentinel</h1>
                <p className="text-lg text-[var(--color-textSecondary)] max-w-2xl mb-12">
                    Run security tests against your apps and APIs to uncover and fix vulnerabilities.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
                    <Card className="p-6 flex flex-col hover:border-[var(--color-cyan)]/50 transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Search className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-syne font-bold text-white mb-2">Run your first pentest</h3>
                        <p className="text-[var(--color-textSecondary)] flex-1 mb-6 text-sm">
                            Find vulnerabilities in your apps and APIs with a security test.
                        </p>
                        <Link href="/dashboard/pentests/new" className="inline-flex items-center justify-center bg-[var(--color-cyan)] text-black font-bold py-2.5 px-4 rounded-lg hover:bg-[var(--color-cyan)]/90 transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                            Start Pentest
                        </Link>
                    </Card>

                    <Card className="p-6 flex flex-col hover:border-white/20 transition-colors group relative overflow-hidden">
                        <div className="h-10 w-10 rounded-lg bg-white/5 text-white flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-syne font-bold text-white mb-2">Schedule pentests</h3>
                        <p className="text-[var(--color-textSecondary)] flex-1 mb-6 text-sm">
                            Automate recurring security tests on your own schedule.
                        </p>
                        <Link href="/dashboard/settings/billing" className="inline-flex items-center justify-center bg-white/5 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors">
                            <Lock className="h-4 w-4 mr-2 text-[var(--color-textMuted)]" /> Upgrade to Growth
                        </Link>
                    </Card>

                    <Card className="p-6 flex flex-col hover:border-[var(--color-purple)]/30 transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-[#A855F7]/10 text-[#A855F7] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <GitPullRequest className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-syne font-bold text-white mb-2">Enable PR reviews</h3>
                        <p className="text-[var(--color-textSecondary)] flex-1 mb-6 text-sm">
                            Catch vulnerabilities in every PR with checks that block risky merges.
                        </p>
                        <Link href="/dashboard/integrations" className="inline-flex items-center justify-center bg-transparent border border-[var(--color-border)] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/5 transition-colors">
                            Enable Reviews
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-[var(--color-textSecondary)] mt-1">Status overview of your active scopes and security posture.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Pentests & PRs) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Pentests */}
                    <Card className="p-0 overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-black/40">
                            <h3 className="font-syne font-bold text-lg text-white">Recent Pentests</h3>
                            <Link href="/dashboard/pentests" className="text-sm text-[var(--color-textMuted)] hover:text-white transition-colors flex items-center">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                            {pentests.length > 0 ? pentests.map((p, i) => (
                                <div key={i} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{p.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--color-cyan)] border border-[var(--color-cyan)]/20 px-1.5 rounded">{p.type}</span>
                                            <span className="text-xs text-[var(--color-textMuted)]">{new Date(p.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs px-2 py-1 rounded bg-white/5 font-mono text-[var(--color-textSecondary)]">{p.status}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-sm text-[var(--color-textMuted)] flex flex-col items-center">
                                    <Activity className="h-8 w-8 mb-2 opacity-50" />
                                    No pentests have been run yet.
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent PR Reviews */}
                    <Card className="p-0 overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-black/40">
                            <h3 className="font-syne font-bold text-lg text-white">Recent PR Reviews</h3>
                            <Link href="/dashboard/pr-reviews" className="text-sm text-[var(--color-textMuted)] hover:text-white transition-colors flex items-center">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                            {reviews.length > 0 ? reviews.map((r, i) => (
                                <div key={i} className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{r.pr_title}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <GitPullRequest className="h-3.5 w-3.5 text-[var(--color-textSecondary)]" />
                                            <span className="text-xs text-[var(--color-textSecondary)]">PR #{r.pr_number}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-[max-content]">
                                        <span className={`text-xs px-2 py-1 rounded ${r.status === 'passed' ? 'bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20' : 'bg-[var(--color-red)]/10 text-[var(--color-red)] border border-[var(--color-red)]/20'}`}>
                                            {r.status === 'passed' ? 'Passed' : 'Issues Found'}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-sm text-[var(--color-textMuted)] flex flex-col items-center">
                                    <GitPullRequest className="h-8 w-8 mb-2 opacity-50" />
                                    No PR reviews triggered.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column (Open Issues Summary) */}
                <div className="space-y-6">
                    <Card className="p-6 sticky top-8 shadow-xl">
                        <h3 className="font-syne font-bold text-lg text-white mb-6">Open Issues Summary</h3>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-red)]/20 bg-gradient-to-r from-[var(--color-red)]/10 to-transparent">
                                <span className="text-[var(--color-red)] font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-red)] shadow-[0_0_8px_var(--color-red)]" />
                                    Critical
                                </span>
                                <span className="font-mono text-xl text-white font-bold">{issues.critical}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-amber)]/20 bg-gradient-to-r from-[var(--color-amber)]/10 to-transparent">
                                <span className="text-[var(--color-amber)] font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-amber)] shadow-[0_0_8px_var(--color-amber)]" />
                                    High
                                </span>
                                <span className="font-mono text-xl text-white font-bold">{issues.high}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#A855F7]/20 bg-gradient-to-r from-[#A855F7]/10 to-transparent">
                                <span className="text-[#A855F7] font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
                                    Medium
                                </span>
                                <span className="font-mono text-xl text-white font-bold">{issues.medium}</span>
                            </div>
                        </div>
                        <Link href="/dashboard/issues" className="flex items-center justify-center w-full py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5 transition-colors font-medium text-sm group">
                            View all issues <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}
