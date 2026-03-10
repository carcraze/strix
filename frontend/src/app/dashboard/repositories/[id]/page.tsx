'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    Github,
    GitBranch,
    CheckCircle2,
    Trash2,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Define the tabs for the details page
type Tab = 'issues' | 'tests' | 'pr_reviews' | 'settings';

export default function RepositoryDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const repoId = params.id as string;

    const [activeTab, setActiveTab] = useState<Tab>('issues');
    const [repo, setRepo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [togglingReview, setTogglingReview] = useState(false);
    const [removing, setRemoving] = useState(false);

    // Schedule state
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleDay, setScheduleDay] = useState("1");
    const [scheduleTime, setScheduleTime] = useState("09:00");
    const [scheduleTz, setScheduleTz] = useState("UTC");
    const [savingSchedule, setSavingSchedule] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchRepo = async () => {
            if (!repoId) return;
            const { data, error } = await supabase
                .from('repositories')
                .select('*')
                .eq('id', repoId)
                .single();

            if (mounted) {
                if (error) {
                    console.error("Failed to fetch repository", error);
                } else if (data) {
                    setRepo(data);
                    setScheduleEnabled(data.schedule_enabled || false);
                    setScheduleDay(data.schedule_day?.toString() || "1");
                    setScheduleTime(data.schedule_time || "09:00");
                    setScheduleTz(data.schedule_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
                }
                setLoading(false);
            }
        };

        fetchRepo();
        return () => { mounted = false; };
    }, [repoId, supabase]);

    const handleToggleAutoReview = async () => {
        if (!repo) return;
        setTogglingReview(true);
        const newValue = !repo.auto_review_enabled;

        try {
            const { error } = await supabase
                .from('repositories')
                .update({ auto_review_enabled: newValue })
                .eq('id', repo.id);

            if (!error) {
                setRepo({ ...repo, auto_review_enabled: newValue });
            }
        } catch (err) {
            console.error("Failed to toggle auto-review", err);
        } finally {
            setTogglingReview(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!repo) return;
        setSavingSchedule(true);
        try {
            const res = await fetch(`/api/repos/${repo.id}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: scheduleEnabled,
                    day: parseInt(scheduleDay),
                    time: scheduleTime,
                    timezone: scheduleTz
                })
            });
            if (!res.ok) throw new Error('Failed to save schedule');
            setRepo({
                ...repo,
                schedule_enabled: scheduleEnabled,
                schedule_day: parseInt(scheduleDay),
                schedule_time: scheduleTime,
                schedule_timezone: scheduleTz
            });
            alert('Scan schedule saved successfully.');
        } catch (err) {
            console.error("Failed to save schedule", err);
            alert('Error saving schedule');
        } finally {
            setSavingSchedule(false);
        }
    };

    const handleRemoveRepo = async () => {
        if (!repo || !confirm(`Are you sure you want to disconnect ${repo.full_name}?`)) return;

        setRemoving(true);
        try {
            const { error } = await supabase
                .from('repositories')
                .delete()
                .eq('id', repo.id);

            if (!error) {
                router.push('/dashboard/repositories');
            }
        } catch (err) {
            console.error("Failed to remove repository", err);
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-[#0A0A0A] p-8 items-center justify-center">
                <Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" />
            </div>
        );
    }

    if (!repo) {
        return (
            <div className="flex flex-col h-full bg-[#0A0A0A] p-8 text-white text-center pt-24">
                <h2 className="text-xl font-bold mb-4 font-syne">Repository not found</h2>
                <Link href="/dashboard/repositories" className="text-[var(--color-cyan)] hover:underline inline-flex items-center gap-2 justify-center">
                    <ArrowLeft className="h-4 w-4" /> Back to Repositories
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A]">
            {/* Header Area */}
            <div className="pt-8 px-8 pb-0">
                <Link href="/dashboard/repositories" className="inline-flex items-center gap-2 text-sm text-[var(--color-textMuted)] hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft className="h-4 w-4" /> Repositories
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    {repo.provider === 'github' ? (
                        <Github className="h-8 w-8 text-white" />
                    ) : (
                        <GitBranch className="h-8 w-8 text-white" />
                    )}
                    <h1 className="text-3xl font-bold text-white font-syne">{repo.full_name}</h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-[var(--color-border)]">
                    {(['issues', 'tests', 'pr_reviews', 'settings'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-white' : 'text-[var(--color-textMuted)] hover:text-white/80'
                                }`}
                        >
                            {tab === 'pr_reviews' ? 'PR Reviews' : tab.charAt(0).toUpperCase() + tab.slice(1)}

                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
                {activeTab !== 'settings' && (
                    <Card className="p-16 flex flex-col items-center justify-center text-center border-dashed border-[var(--color-border)] bg-transparent min-h-[400px]">
                        <div className="h-12 w-12 rounded-full bg-emerald-400/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No {tabNameForDisplay(activeTab).toLowerCase()} yet</h3>
                        <p className="text-sm text-[var(--color-textMuted)]">
                            {activeTab === 'issues' && "Zentinel scans will highlight identified security issues here."}
                            {activeTab === 'tests' && "Results from completed pentest runs will appear here."}
                            {activeTab === 'pr_reviews' && "AI analyses of PRs made against this repository will be listed here."}
                        </p>
                    </Card>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-3xl flex flex-col gap-6">
                        {/* Details Section */}
                        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-black">
                            <h2 className="text-sm font-bold text-white mb-6">Details</h2>
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-textMuted)]">Provider</span>
                                    <span className="text-sm text-white capitalize">{repo.provider}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-textMuted)]">Added</span>
                                    <span className="text-sm text-white">{new Date(repo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-textMuted)]">Last tested</span>
                                    <span className="text-sm text-white">—</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-textMuted)]">Auto-review PRs</span>
                                    <Switch
                                        checked={repo.auto_review_enabled}
                                        onCheckedChange={handleToggleAutoReview}
                                        disabled={togglingReview}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Scheduled Scans */}
                        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-black">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-bold text-white">Scheduled Scans</h2>
                                    <p className="text-xs text-[var(--color-textMuted)] mt-1">Configure automated pentests for this repository</p>
                                </div>
                                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                            </div>

                            {scheduleEnabled && (
                                <div className="flex flex-col gap-4 mt-4 mb-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-[var(--color-textMuted)] mb-1 block">Day of Week</label>
                                            <select
                                                value={scheduleDay}
                                                onChange={e => setScheduleDay(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-[var(--color-cyan)] transition-colors"
                                            >
                                                <option value="0" className="text-black">Sunday</option>
                                                <option value="1" className="text-black">Monday</option>
                                                <option value="2" className="text-black">Tuesday</option>
                                                <option value="3" className="text-black">Wednesday</option>
                                                <option value="4" className="text-black">Thursday</option>
                                                <option value="5" className="text-black">Friday</option>
                                                <option value="6" className="text-black">Saturday</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-[var(--color-textMuted)] mb-1 block">Time</label>
                                            <input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={e => setScheduleTime(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-[var(--color-cyan)] transition-colors [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--color-textMuted)] mb-1 block">Timezone</label>
                                        <input
                                            type="text"
                                            value={scheduleTz}
                                            readOnly
                                            className="w-full bg-white/5 border border-white/10 rounded-md text-sm text-[var(--color-textMuted)] px-3 py-2 outline-none opacity-70 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            )}

                            {(scheduleEnabled !== (repo.schedule_enabled || false) ||
                                scheduleDay !== (repo.schedule_day?.toString() || "1") ||
                                scheduleTime !== (repo.schedule_time || "09:00") ||
                                scheduleTz !== (repo.schedule_timezone || scheduleTz)) && (
                                    <button
                                        onClick={handleSaveSchedule}
                                        disabled={savingSchedule}
                                        className="w-full mt-2 bg-white text-black text-sm font-bold py-2 rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center"
                                    >
                                        {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Schedule'}
                                    </button>
                                )}
                        </div>

                        {/* Danger Zone */}
                        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-black">
                            <h2 className="text-sm font-bold text-white mb-6">Actions</h2>
                            <button
                                onClick={handleRemoveRepo}
                                disabled={removing}
                                className="inline-flex items-center gap-2 text-sm text-[var(--color-textMuted)] hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Disconnect repository
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function tabNameForDisplay(tab: Tab) {
    if (tab === 'pr_reviews') return 'PR Reviews';
    return tab.charAt(0).toUpperCase() + tab.slice(1);
}
