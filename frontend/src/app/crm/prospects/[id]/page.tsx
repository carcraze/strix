"use client";

import { useEffect, useState, use } from "react";
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Linkedin,
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Send,
    Edit3,
    Trash2,
    ChevronRight,
    ExternalLink,
    TrendingUp,
    Search,
    Save,
    X
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [prospect, setProspects] = useState<any>(null);
    const [outreachLogs, setOutreachLogs] = useState<any[]>([]);
    const [followups, setFollowups] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [nextFollowupDate, setNextFollowupDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]); // Default 3 days out
    const [saving, setSaving] = useState<string | null>(null);

    // Outreach Form State
    const [outreachType, setOutreachType] = useState('linkedin_message');
    const [outreachContent, setOutreachContent] = useState('');

    const fetchData = async () => {
        const { data: pData } = await supabase.from('prospects').select('*, crm_staff(unique_name)').eq('id', id).single();
        const { data: oLogs } = await supabase.from('outreach_logs').select('*, crm_staff(unique_name)').eq('prospect_id', id).order('created_at', { ascending: false });
        const { data: fUps } = await supabase.from('follow_ups').select('*').eq('prospect_id', id).order('scheduled_date', { ascending: true });
        const { data: sList } = await supabase.from('crm_staff').select('*').eq('is_active', true);

        setProspects(pData);
        setOutreachLogs(oLogs || []);
        setFollowups(fUps || []);
        setStaffList(sList || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const updateField = async (field: string, value: any) => {
        setSaving(field);
        try {
            const { error } = await supabase.from('prospects').update({ [field]: value }).eq('id', id);
            if (error) throw error;
            setProspects((prev: any) => ({ ...prev, [field]: value }));
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(null);
        }
    };

    const handleLogOutreach = async (e: React.FormEvent) => {
        e.preventDefault();
        setLogging(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: staff } = await supabase.from('crm_staff').select('id').eq('user_id', user?.id).single();

            const { error } = await supabase.from('outreach_logs').insert([{
                prospect_id: id,
                staff_id: staff?.id,
                type: outreachType,
                content: outreachContent
            }]);

            if (error) throw error;
            setOutreachContent('');
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLogging(false);
        }
    };

    const handleScheduleFollowup = async () => {
        setScheduling(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: staff } = await supabase.from('crm_staff').select('id').eq('user_id', user?.id).single();

            const nextNum = (followups.length % 3) + 1;

            const { error } = await supabase.from('follow_ups').insert([{
                prospect_id: id,
                staff_id: staff?.id,
                follow_up_number: nextNum,
                scheduled_date: nextFollowupDate,
                status: 'pending'
            }]);

            if (error) throw error;
            setShowScheduleModal(false);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setScheduling(false);
        }
    };

    const deleteProspect = async () => {
        if (!confirm("Confirm complete asset removal? This action is irreversible.")) return;
        try {
            await supabase.from('prospects').delete().eq('id', id);
            router.push('/crm/prospects');
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-mono text-xs uppercase tracking-[0.5em] text-[#444] animate-pulse">Synchronizing Data...</div>;
    if (!prospect) return <div className="p-8 text-white font-mono uppercase tracking-widest text-center py-40 opacity-20">ASSET NOT FOUND_</div>;

    const pipelineStages = [
        { id: 'prospect_identified', label: 'Identified' },
        { id: 'contacted', label: 'Contacted' },
        { id: 'engaged', label: 'Engaged' },
        { id: 'signed_up', label: 'Signed Up' },
        { id: 'active_user', label: 'Active' },
        { id: 'paid_customer', label: 'Paid' }
    ];

    const currentStageIdx = pipelineStages.findIndex(s => s.id === prospect.contact_status);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header: Command Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link href="/crm/prospects" className="text-[10px] font-mono text-[#555] hover:text-white uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors">
                        <ArrowLeft className="h-3 w-3" /> Root_Directory / Prospects
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xl font-bold text-white shadow-2xl">
                            {prospect.company_name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-syne font-bold text-white tracking-tight leading-none">{prospect.company_name}</h1>
                            <p className="text-[#444] font-mono text-[9px] uppercase tracking-tighter mt-1">ID: {prospect.id.split('-')[0]} // Assigned: {prospect.crm_staff?.unique_name || 'UNASSIGNED'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-4 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-400 font-mono text-[10px] uppercase tracking-widest hover:bg-purple-500/10 transition-all flex items-center gap-2"
                    >
                        <Calendar className="h-3 w-3" /> Schedule Follow-up
                    </button>
                    <button
                        onClick={() => updateField('poc_sent', !prospect.poc_sent)}
                        className={cn(
                            "px-4 py-2 rounded-xl border font-mono text-[10px] uppercase tracking-widest transition-all",
                            prospect.poc_sent ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-[#666] hover:text-white"
                        )}
                    >
                        {saving === 'poc_sent' ? 'SENDING...' : prospect.poc_sent ? 'POC_SENT' : 'Mark POC_SENT'}
                    </button>
                    <button
                        onClick={deleteProspect}
                        className="p-2.5 rounded-xl border border-red-500/10 text-red-900/40 hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pipeline Progress Board */}
            <Card className="p-8 border-white/5 bg-[#050505] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div
                        className="h-full bg-[var(--color-cyan)] shadow-[0_0_15px_rgba(33,219,255,0.5)] transition-all duration-1000"
                        style={{ width: `${((currentStageIdx + 1) / pipelineStages.length) * 100}%` }}
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {pipelineStages.map((stage, i) => (
                        <button
                            key={stage.id}
                            onClick={() => updateField('contact_status', stage.id)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all relative border",
                                i <= currentStageIdx ? "bg-white/[0.02] border-white/10" : "opacity-30 border-transparent grayscale",
                                stage.id === prospect.contact_status ? "ring-1 ring-[var(--color-cyan)]/30 border-[var(--color-cyan)]/20 shadow-[0_0_30px_rgba(33,219,255,0.05)]" : ""
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs",
                                i <= currentStageIdx ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]" : "bg-white/5 text-[#444]"
                            )}>
                                {i + 1}
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">{stage.label}</span>
                            {stage.id === prospect.contact_status && (
                                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Information Core (Editable) */}
                <div className="lg:col-span-2 space-y-10">
                    {/* 1. COMPANY & INTEL */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-l-2 border-[var(--color-cyan)] pl-4">
                            <Building2 className="h-4 w-4 text-[var(--color-cyan)]" />
                            <h2 className="text-xl font-syne font-bold text-white uppercase tracking-tight">Organization Root</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EditableField label="Company Name" value={prospect.company_name} onSave={(v: string) => updateField('company_name', v)} />
                            <EditableField label="Website URL" value={prospect.website} onSave={(v: string) => updateField('website', v)} />
                            <EditableField
                                label="Source"
                                value={prospect.source}
                                type="select"
                                options={['Product Hunt', 'LinkedIn', 'Crunchbase', 'GitHub', 'Referral', 'Inbound', 'Other']}
                                onSave={(v: string) => updateField('source', v)}
                            />
                            <EditableField label="Tech Stack" value={prospect.tech_stack} onSave={(v: string) => updateField('tech_stack', v)} />
                            <EditableField label="Revenue / MRR" value={prospect.revenue_mrr} onSave={(v: string) => updateField('revenue_mrr', v)} />
                            <EditableField label="Growth (%)" value={prospect.growth_pct?.toString()} onSave={(v: string) => updateField('growth_pct', parseFloat(v))} />
                        </div>
                    </div>

                    {/* 2. FOUNDERS DIRECTORY */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-l-2 border-orange-500 pl-4">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-orange-500" />
                                <h2 className="text-xl font-syne font-bold text-white uppercase tracking-tight">Founders Directory</h2>
                            </div>
                            <button
                                onClick={() => {
                                    const newFounders = [...(prospect.founders || []), { name: '', role: '', email: '', linkedin: '', x_handle: '' }];
                                    updateField('founders', newFounders);
                                }}
                                className="h-7 px-3 rounded-lg border border-white/5 text-[#555] hover:text-white hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest"
                            >
                                + ADD_PEOPLE
                            </button>
                        </div>
                        <div className="space-y-4">
                            {prospect.founders?.map((founder: any, idx: number) => (
                                <div key={idx} className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 relative group">
                                    <button
                                        onClick={() => {
                                            const newFounders = prospect.founders.filter((_: any, i: number) => i !== idx);
                                            updateField('founders', newFounders);
                                        }}
                                        className="absolute top-4 right-4 text-[#333] hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            value={founder.name}
                                            onChange={(e) => {
                                                const f = [...prospect.founders];
                                                f[idx].name = e.target.value;
                                                setProspects({ ...prospect, founders: f });
                                            }}
                                            onBlur={() => updateField('founders', prospect.founders)}
                                            placeholder="Name"
                                            className="bg-transparent border-b border-white/5 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                                        />
                                        <input
                                            value={founder.role}
                                            onChange={(e) => {
                                                const f = [...prospect.founders];
                                                f[idx].role = e.target.value;
                                                setProspects({ ...prospect, founders: f });
                                            }}
                                            onBlur={() => updateField('founders', prospect.founders)}
                                            placeholder="Role"
                                            className="bg-transparent border-b border-white/5 py-2 text-sm text-[#888] focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <div className="flex items-center gap-2 text-xs text-[#444] bg-white/5 px-2 py-1 rounded">
                                            <Mail className="h-3 w-3" />
                                            <input
                                                value={founder.email}
                                                onChange={(e) => {
                                                    const f = [...prospect.founders];
                                                    f[idx].email = e.target.value;
                                                    setProspects({ ...prospect, founders: f });
                                                }}
                                                onBlur={() => updateField('founders', prospect.founders)}
                                                placeholder="Email"
                                                className="bg-transparent outline-none text-[10px]"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#444] bg-white/5 px-2 py-1 rounded">
                                            <Linkedin className="h-3 w-3" />
                                            <input
                                                value={founder.linkedin}
                                                onChange={(e) => {
                                                    const f = [...prospect.founders];
                                                    f[idx].linkedin = e.target.value;
                                                    setProspects({ ...prospect, founders: f });
                                                }}
                                                onBlur={() => updateField('founders', prospect.founders)}
                                                placeholder="LinkedIn"
                                                className="bg-transparent outline-none text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. SALES LOGS & TIMELINE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-l-2 border-purple-500 pl-4">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <h2 className="text-xl font-syne font-bold text-white uppercase tracking-tight">Outreach Chronicle</h2>
                        </div>
                        <Card className="p-8 border-white/5 bg-[#050505]">
                            <form onSubmit={handleLogOutreach} className="space-y-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    {['linkedin_message', 'email', 'call', 'other'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setOutreachType(type)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all",
                                                outreachType === type ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "text-[#444] border border-white/5 hover:text-white"
                                            )}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={outreachContent}
                                    onChange={(e) => setOutreachContent(e.target.value)}
                                    placeholder="Enter mission debrief content here..."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono resize-none placeholder:text-[#222]"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={logging || !outreachContent}
                                    className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-30 uppercase text-xs tracking-[0.2em]"
                                >
                                    <Send className="h-4 w-4" /> {logging ? "LOGGING..." : "COMMIT LOG ENTRY"}
                                </button>
                            </form>

                            <div className="mt-12 space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-0 before:w-px before:bg-white/5">
                                {outreachLogs.length > 0 ? outreachLogs.map((log, i) => (
                                    <div key={i} className="flex gap-6 group relative">
                                        <div className="h-10 w-10 rounded-xl bg-black border border-white/10 flex items-center justify-center z-10 shrink-0 group-hover:border-purple-500/30 transition-all">
                                            <MessageSquare className="h-4 w-4 text-[#444] group-hover:text-purple-400" />
                                        </div>
                                        <div className="flex-1 space-y-3 pb-8 border-b border-white/[0.02]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-white uppercase font-mono">{log.crm_staff?.unique_name}</span>
                                                    <span className="h-1 w-1 rounded-full bg-white/10" />
                                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 uppercase tracking-widest">{log.type.replace('_', ' ')}</span>
                                                </div>
                                                <span className="text-[10px] text-[#333] font-mono">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-[#888] font-mono leading-relaxed p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
                                                {log.content}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-10">
                                        <TrendingUp className="h-20 w-20 mx-auto mb-4" />
                                        <p className="font-mono text-xs uppercase tracking-[0.3em]">Chronicle Empty</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar: Metadata & Controls */}
                <div className="space-y-10">
                    {/* BI & INTEL BOARD */}
                    <Card className="p-8 border-white/5 bg-[#050505] shadow-2xl space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <Search className="h-4 w-4" />
                                <h3 className="text-sm font-mono uppercase tracking-widest">BI Matrix</h3>
                            </div>
                            <div className="space-y-6">
                                <EditableField label="PH Launch" value={prospect.ph_launch_date} type="date" onSave={(v: string) => updateField('ph_launch_date', v)} />
                                <EditableField label="Painpoints" value={prospect.painpoints} type="textarea" onSave={(v: string) => updateField('painpoints', v)} />
                                <EditableField
                                    label="Lead Score"
                                    value={prospect.lead_score || 'B'}
                                    type="select"
                                    options={['A', 'B', 'C', 'D']}
                                    onSave={(v: string) => updateField('lead_score', v)}
                                />
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3 text-orange-400">
                                <Calendar className="h-4 w-4" />
                                <h3 className="text-sm font-mono uppercase tracking-widest">Pipeline Timeline</h3>
                            </div>
                            <div className="space-y-6">
                                <EditableField label="Next Action" value={prospect.next_action} onSave={(v: string) => updateField('next_action', v)} />
                                <EditableField label="Due Date" value={prospect.due_date} type="date" onSave={(v: string) => updateField('due_date', v)} />
                                <EditableField label="Last Contact" value={prospect.last_contact_date} type="date" onSave={(v: string) => updateField('last_contact_date', v)} />
                                <div className="space-y-2">
                                    <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest">SDR Assigned</label>
                                    <select
                                        value={prospect.assigned_to || ''}
                                        onChange={(e) => updateField('assigned_to', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[var(--color-cyan)]/30 transition-all font-mono"
                                    >
                                        <option value="">Unassigned</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.unique_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Follow-up Queue */}
                    <Card className="p-8 border-white/5 bg-[#050505] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                            <Clock className="h-24 w-24 -mr-8 -mt-8" />
                        </div>
                        <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-6">Execution Queue</h3>
                        <div className="space-y-4 relative z-10">
                            {followups.map((f, i) => (
                                <div key={i} className={cn(
                                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                                    f.status === 'completed' ? "bg-green-500/[0.02] border-green-500/10 opacity-30" : "bg-white/[0.02] border-white/5"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs",
                                            f.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-white/5 text-[#444]"
                                        )}>
                                            F{f.follow_up_number}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white leading-none mb-1">{new Date(f.scheduled_date).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Active_Target</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newStatus = f.status === 'completed' ? 'pending' : 'completed';
                                            await supabase.from('follow_ups').update({ status: newStatus }).eq('id', f.id);
                                            await fetchData();
                                        }}
                                        className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                            f.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-white/5 text-[#333] hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Schedule Follow-up Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <Card className="w-full max-w-md p-8 border-white/10 bg-[#0A0A0A] space-y-8 relative">
                        <button onClick={() => setShowScheduleModal(false)} className="absolute top-6 right-6 text-[#333] hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                        <div className="space-y-2">
                            <h3 className="text-xl font-syne font-bold text-white uppercase tracking-tight">Schedule Follow-up</h3>
                            <p className="text-[#444] font-mono text-[9px] uppercase tracking-widest">Queue Mission #{(followups.length % 3) + 1} for execution</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest leading-none">Target Execution Date</label>
                                <input
                                    type="date"
                                    value={nextFollowupDate}
                                    onChange={(e) => setNextFollowupDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleScheduleFollowup}
                            disabled={scheduling}
                            className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-30 uppercase text-xs tracking-[0.2em]"
                        >
                            {scheduling ? "SCHEDULING..." : "COMMIT TO QUEUE"}
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
}

function EditableField({ label, value, onSave, type = 'text', options = [] }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(currentValue);
        setIsEditing(false);
    };

    return (
        <div className="space-y-2 group">
            <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest leading-none">{label}</label>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-[var(--color-cyan)] font-mono uppercase">
                        Edit_Data
                    </button>
                )}
            </div>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    {type === 'select' ? (
                        <select
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none"
                            autoFocus
                        >
                            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ) : type === 'textarea' ? (
                        <textarea
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none font-mono"
                            rows={3}
                            autoFocus
                        />
                    ) : (
                        <input
                            type={type}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none font-mono"
                            autoFocus
                        />
                    )}
                    <button onClick={handleSave} className="p-2 rounded-xl bg-[var(--color-cyan)] text-black"><Save className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setCurrentValue(value); setIsEditing(false); }} className="p-2 rounded-xl bg-white/5 text-[#666]"><X className="h-3.5 w-3.5" /></button>
                </div>
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.02] group-hover:bg-white/[0.03] group-hover:border-white/10 transition-all cursor-text min-h-[46px]"
                >
                    <p className={cn(
                        "text-xs font-mono truncate",
                        value ? "text-white" : "text-[#222] italic"
                    )}>
                        {type === 'date' && value ? new Date(value).toLocaleDateString() : (value || 'NULL_VALUE')}
                    </p>
                </div>
            )}
        </div>
    );
}
