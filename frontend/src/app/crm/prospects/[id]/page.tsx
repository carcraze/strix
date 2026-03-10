"use client";

import { useEffect, useState, use } from "react";
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Linkedin,
    Twitter,
    Github,
    Cloud,
    Instagram,
    MessageCircle,
    Globe,
    Link as LinkIcon,
    MessageSquare,
    Clock,
    CheckCircle2,
    Calendar,
    Send,
    Trash2,
    ExternalLink,
    TrendingUp,
    Search,
    Save,
    X,
    Plus,
    AlertCircle,
    Edit3
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [prospect, setProspect] = useState<any>(null);
    const [outreachLogs, setOutreachLogs] = useState<any[]>([]);
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [followups, setFollowups] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [currentStaff, setCurrentStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [nextFollowupDate, setNextFollowupDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

    // Note form
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState('linkedin_message');

    // Edit mode for prospect fields
    const [editMode, setEditMode] = useState(false);
    const [editDraft, setEditDraft] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        const [{ data: pData }, { data: oLogs }, { data: fUps }, { data: sList }, { data: aLog }] = await Promise.all([
            supabase.from('prospects').select('*, crm_staff(unique_name)').eq('id', id).single(),
            supabase.from('outreach_logs').select('*, crm_staff(unique_name)').eq('prospect_id', id).order('created_at', { ascending: false }),
            supabase.from('follow_ups').select('*').eq('prospect_id', id).order('scheduled_date', { ascending: true }),
            supabase.from('crm_staff').select('*').eq('is_active', true),
            supabase.from('crm_activity_log').select('*, crm_staff(unique_name)').eq('prospect_id', id).order('created_at', { ascending: false }),
        ]);
        setProspect(pData);
        setEditDraft(pData || {});
        setOutreachLogs(oLogs || []);
        setFollowups(fUps || []);
        setStaffList(sList || []);
        setActivityLog(aLog || []);
        setLoading(false);
    };

    useEffect(() => {
        const loadStaff = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('crm_staff').select('*').eq('user_id', user.id).single();
                setCurrentStaff(data);
            }
        };
        loadStaff();
        fetchData();
    }, [id]);

    // Log activity helper
    const logActivity = async (action: string, opts?: { field?: string; oldValue?: string; newValue?: string; note?: string }) => {
        if (!currentStaff) return;
        await supabase.from('crm_activity_log').insert({
            prospect_id: id,
            staff_id: currentStaff.id,
            action,
            field_changed: opts?.field || null,
            old_value: opts?.oldValue || null,
            new_value: opts?.newValue || null,
            note: opts?.note || null,
        });
    };

    // Save all edits at once
    const handleSaveEdits = async () => {
        setSaving(true);
        try {
            const changedFields: string[] = [];
            const fields = ['company_name', 'website', 'source', 'tech_stack', 'revenue_mrr', 'growth_pct', 'painpoints', 'next_action', 'due_date', 'last_contact_date', 'lead_score', 'ph_launch_date'];
            fields.forEach(f => {
                if (editDraft[f] !== prospect[f]) changedFields.push(f);
            });

            const updates: any = {};
            changedFields.forEach(f => { updates[f] = editDraft[f]; });

            if (Object.keys(updates).length > 0) {
                await supabase.from('prospects').update(updates).eq('id', id);
                for (const f of changedFields) {
                    await logActivity('edited', { field: f, oldValue: String(prospect[f] || ''), newValue: String(editDraft[f] || '') });
                }
            }

            setProspect({ ...prospect, ...updates });
            setEditMode(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const updateField = async (field: string, value: any) => {
        const old = prospect[field];
        await supabase.from('prospects').update({ [field]: value }).eq('id', id);
        setProspect((prev: any) => ({ ...prev, [field]: value }));
        await logActivity('edited', { field, oldValue: String(old || ''), newValue: String(value || '') });
    };

    const handleLogNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setLogging(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: staff } = await supabase.from('crm_staff').select('id').eq('user_id', user?.id).single();
            await supabase.from('outreach_logs').insert([{
                prospect_id: id,
                staff_id: staff?.id,
                type: noteType,
                content: noteContent
            }]);
            await logActivity('note_added', { note: `[${noteType}] ${noteContent}` });
            setNoteContent('');
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
            const nextNum = (followups.length % 3) + 1;
            await supabase.from('follow_ups').insert([{
                prospect_id: id,
                staff_id: currentStaff?.id,
                follow_up_number: nextNum,
                scheduled_date: nextFollowupDate,
                status: 'pending'
            }]);
            await logActivity('follow_up_scheduled', { note: `Follow-up #${nextNum} scheduled for ${nextFollowupDate}` });
            setShowScheduleModal(false);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setScheduling(false);
        }
    };

    const handleDeleteProspect = async () => {
        setDeleting(true);
        try {
            // Log it before deleting (prospect_id will become null after delete due to SET NULL)
            const { data: { user } } = await supabase.auth.getUser();
            const { data: staff } = await supabase.from('crm_staff').select('id').eq('user_id', user?.id).maybeSingle();
            await supabase.from('crm_activity_log').insert({
                prospect_id: id,
                staff_id: staff?.id,
                action: 'deleted',
                note: `Prospect "${prospect.company_name}" (ID: ${id}) was permanently deleted by ${currentStaff?.unique_name || 'Unknown'}`,
            });
            await supabase.from('prospects').delete().eq('id', id);
            router.push('/crm/prospects');
        } catch (err) {
            console.error(err);
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center text-sm text-[#6b7280]">
            Loading prospect...
        </div>
    );
    if (!prospect) return (
        <div className="p-8 text-center text-[#6b7280] py-40">Prospect not found.</div>
    );

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
        <div className="space-y-8 pb-20 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/crm/prospects" className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0a0a0a] mb-3 transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Prospects
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-[#0a0a0a] flex items-center justify-center text-lg font-bold text-white">
                            {prospect.company_name?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0a0a0a]">{prospect.company_name}</h1>
                            <p className="text-sm text-[#6b7280]">
                                {prospect.website && <a href={prospect.website} target="_blank" className="hover:underline">{prospect.website}</a>}
                                {prospect.crm_staff?.unique_name && <> · Assigned to {prospect.crm_staff.unique_name}</>}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#0a0a0a] hover:bg-[#f1f3f5] transition-colors font-medium"
                    >
                        <Calendar className="h-4 w-4" /> Schedule Follow-up
                    </button>
                    <button
                        onClick={() => updateField('poc_sent', !prospect.poc_sent)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                            prospect.poc_sent
                                ? "bg-[#16a34a]/10 border-[#16a34a]/20 text-[#16a34a]"
                                : "border-[#e5e7eb] text-[#6b7280] hover:bg-[#f1f3f5]"
                        )}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {prospect.poc_sent ? 'POC Sent' : 'Mark POC Sent'}
                    </button>
                    {editMode ? (
                        <>
                            <button
                                onClick={handleSaveEdits}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-[#1f1f1f] transition-colors disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setEditMode(false); setEditDraft(prospect); }}
                                className="p-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f1f3f5] transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#0a0a0a] hover:bg-[#f1f3f5] transition-colors font-medium"
                        >
                            <Edit3 className="h-4 w-4" /> Edit
                        </button>
                    )}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#dc2626]/20 text-[#dc2626] hover:bg-[#dc2626]/5 text-sm font-medium transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pipeline Progress */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                <div className="h-1.5 bg-[#f1f3f5] rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-[#0a0a0a] rounded-full transition-all duration-700"
                        style={{ width: `${((currentStageIdx + 1) / pipelineStages.length) * 100}%` }}
                    />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {pipelineStages.map((stage, i) => (
                        <button
                            key={stage.id}
                            onClick={() => updateField('contact_status', stage.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-lg transition-all border text-center",
                                stage.id === prospect.contact_status
                                    ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                                    : i < currentStageIdx
                                        ? "bg-[#f8f9fa] border-[#e5e7eb] text-[#6b7280]"
                                        : "border-transparent text-[#9ca3af] opacity-50"
                            )}
                        >
                            <div className={cn(
                                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                                stage.id === prospect.contact_status ? "bg-white/20 text-white" : "bg-[#e5e7eb] text-[#6b7280]"
                            )}>
                                {i + 1}
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wide">{stage.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Info + Notes */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Company Info */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Building2 className="h-4 w-4 text-[#6b7280]" />
                            <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">Company Info</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Company Name', field: 'company_name' },
                                { label: 'Website', field: 'website' },
                                { label: 'Tech Stack', field: 'tech_stack' },
                                { label: 'Revenue / MRR', field: 'revenue_mrr' },
                                { label: 'Growth (%)', field: 'growth_pct' },
                            ].map(({ label, field }) => (
                                <div key={field}>
                                    <label className="block text-xs text-[#9ca3af] mb-1 font-medium">{label}</label>
                                    {editMode ? (
                                        <input
                                            value={editDraft[field] || ''}
                                            onChange={e => setEditDraft((d: any) => ({ ...d, [field]: e.target.value }))}
                                            className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                                        />
                                    ) : (
                                        <p className="text-sm text-[#0a0a0a] font-medium">{prospect[field] || <span className="text-[#9ca3af] font-normal">—</span>}</p>
                                    )}
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs text-[#9ca3af] mb-1 font-medium">Source</label>
                                {editMode ? (
                                    <select
                                        value={editDraft.source || ''}
                                        onChange={e => setEditDraft((d: any) => ({ ...d, source: e.target.value }))}
                                        className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                    >
                                        {['Product Hunt', 'LinkedIn', 'Crunchbase', 'GitHub', 'Referral', 'Inbound', 'Other'].map(o => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-[#0a0a0a] font-medium">{prospect.source || <span className="text-[#9ca3af] font-normal">—</span>}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Founders */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#6b7280]" />
                                <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">Founders</h2>
                            </div>
                            <button
                                onClick={() => {
                                    const newFounders = [...(prospect.founders || []), { name: '', role: '', email: '', linkedin: '', x_handle: '', github: '', bluesky: '', telegram: '', instagram: '', website: '', other_link: '' }];
                                    updateField('founders', newFounders);
                                }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f1f3f5] hover:text-[#0a0a0a] transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Person
                            </button>
                        </div>
                        <div className="space-y-4">
                            {prospect.founders?.length > 0 ? prospect.founders.map((founder: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] space-y-3 relative group">
                                    <button
                                        onClick={() => {
                                            const newFounders = prospect.founders.filter((_: any, i: number) => i !== idx);
                                            updateField('founders', newFounders);
                                        }}
                                        className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#dc2626] transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            value={founder.name}
                                            onChange={e => { const f = [...prospect.founders]; f[idx].name = e.target.value; setProspect({ ...prospect, founders: f }); }}
                                            onBlur={() => updateField('founders', prospect.founders)}
                                            placeholder="Name"
                                            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                        />
                                        <input
                                            value={founder.role}
                                            onChange={e => { const f = [...prospect.founders]; f[idx].role = e.target.value; setProspect({ ...prospect, founders: f }); }}
                                            onBlur={() => updateField('founders', prospect.founders)}
                                            placeholder="Role"
                                            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { icon: Mail, field: 'email', placeholder: 'Email' },
                                            { icon: Linkedin, field: 'linkedin', placeholder: 'LinkedIn' },
                                            { icon: Twitter, field: 'x_handle', placeholder: 'X/Twitter' },
                                            { icon: Github, field: 'github', placeholder: 'GitHub' },
                                            { icon: Cloud, field: 'bluesky', placeholder: 'Bluesky' },
                                            { icon: Instagram, field: 'instagram', placeholder: 'Instagram' },
                                            { icon: MessageCircle, field: 'telegram', placeholder: 'Telegram' },
                                            { icon: Globe, field: 'website', placeholder: 'Website' },
                                            { icon: LinkIcon, field: 'other_link', placeholder: 'Other Link' }
                                        ].map((item, linkIdx) => (
                                            <div key={linkIdx} className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-xs text-[#6b7280]">
                                                <item.icon className="h-3 w-3 shrink-0" />
                                                <input
                                                    value={founder[item.field] || ''}
                                                    onChange={e => { const f = [...prospect.founders]; f[idx][item.field] = e.target.value; setProspect({ ...prospect, founders: f }); }}
                                                    onBlur={() => updateField('founders', prospect.founders)}
                                                    placeholder={item.placeholder}
                                                    className="bg-transparent outline-none text-xs text-[#0a0a0a] min-w-[90px] placeholder:text-[#9ca3af]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-sm text-[#9ca3af]">No founders added yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Add Note / Outreach Log */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MessageSquare className="h-4 w-4 text-[#6b7280]" />
                            <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">Add Note</h2>
                        </div>
                        <form onSubmit={handleLogNote} className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                {['linkedin_message', 'email', 'call', 'other'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNoteType(type)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border capitalize",
                                            noteType === type
                                                ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                                : "border-[#e5e7eb] text-[#6b7280] hover:bg-[#f1f3f5]"
                                        )}
                                    >
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                                placeholder="Write a note about this outreach..."
                                rows={3}
                                required
                                className="w-full bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none placeholder:text-[#9ca3af]"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={logging || !noteContent}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] text-white text-sm font-semibold rounded-lg hover:bg-[#1f1f1f] transition-colors disabled:opacity-40"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {logging ? 'Saving...' : 'Add Note'}
                                </button>
                            </div>
                        </form>

                        {/* Timeline */}
                        {outreachLogs.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[#e5e7eb] space-y-4">
                                {outreachLogs.map((log, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[#f1f3f5] border border-[#e5e7eb] flex items-center justify-center shrink-0 mt-0.5">
                                            <MessageSquare className="h-3.5 w-3.5 text-[#6b7280]" />
                                        </div>
                                        <div className="flex-1 pb-4 border-b border-[#f1f3f5] last:border-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-[#0a0a0a]">{log.crm_staff?.unique_name || 'Unknown'}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f3f5] text-[#6b7280] border border-[#e5e7eb] capitalize">{log.type.replace('_', ' ')}</span>
                                                </div>
                                                <span className="text-[11px] text-[#9ca3af]">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-[#374151] leading-relaxed">{log.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Log */}
                    {activityLog.length > 0 && (
                        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Clock className="h-4 w-4 text-[#6b7280]" />
                                <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">Activity Log</h2>
                            </div>
                            <div className="space-y-2">
                                {activityLog.map((entry, i) => (
                                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#f1f3f5] last:border-0">
                                        <div className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold",
                                            entry.action === 'deleted' ? "bg-red-50 text-[#dc2626]" :
                                                entry.action === 'edited' ? "bg-blue-50 text-blue-600" :
                                                    "bg-[#f1f3f5] text-[#6b7280]"
                                        )}>
                                            {entry.action === 'deleted' ? '×' : entry.action === 'edited' ? '✎' : '·'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-[#374151]">
                                                <span className="font-semibold">{entry.crm_staff?.unique_name || 'System'}</span>
                                                {' '}
                                                {entry.action === 'edited' && entry.field_changed ? (
                                                    <>updated <span className="font-mono text-[#0a0a0a]">{entry.field_changed}</span>{entry.old_value && <> from "<span className="text-[#6b7280]">{entry.old_value}</span>" to "<span className="text-[#0a0a0a]">{entry.new_value}</span>"</>}</>
                                                ) : entry.note ? entry.note : entry.action.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-[#9ca3af] shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Metadata sidebar */}
                <div className="space-y-6">
                    {/* BI / Intel */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Search className="h-4 w-4 text-[#6b7280]" />
                            <h3 className="text-sm font-semibold text-[#0a0a0a]">Intelligence</h3>
                        </div>
                        {[
                            { label: 'PH Launch Date', field: 'ph_launch_date', type: 'date' },
                            { label: 'Painpoints', field: 'painpoints', type: 'textarea' },
                        ].map(({ label, field, type }) => (
                            <div key={field}>
                                <label className="block text-xs text-[#9ca3af] mb-1 font-medium">{label}</label>
                                {editMode ? (
                                    type === 'textarea' ? (
                                        <textarea
                                            value={editDraft[field] || ''}
                                            onChange={e => setEditDraft((d: any) => ({ ...d, [field]: e.target.value }))}
                                            rows={3}
                                            className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            value={editDraft[field] || ''}
                                            onChange={e => setEditDraft((d: any) => ({ ...d, [field]: e.target.value }))}
                                            className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                        />
                                    )
                                ) : (
                                    <p className="text-sm text-[#0a0a0a]">{prospect[field] || <span className="text-[#9ca3af]">—</span>}</p>
                                )}
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs text-[#9ca3af] mb-1 font-medium">Lead Score</label>
                            {editMode ? (
                                <select
                                    value={editDraft.lead_score || 'B'}
                                    onChange={e => setEditDraft((d: any) => ({ ...d, lead_score: e.target.value }))}
                                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                >
                                    {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                                </select>
                            ) : (
                                <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold",
                                    prospect.lead_score === 'A' ? "bg-[#16a34a]/10 text-[#16a34a]" :
                                        prospect.lead_score === 'B' ? "bg-blue-50 text-blue-700" :
                                            prospect.lead_score === 'C' ? "bg-[#d97706]/10 text-[#d97706]" :
                                                "bg-[#f1f3f5] text-[#6b7280]"
                                )}>
                                    Score: {prospect.lead_score || 'B'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Pipeline / Timeline */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-[#6b7280]" />
                            <h3 className="text-sm font-semibold text-[#0a0a0a]">Pipeline</h3>
                        </div>
                        {[
                            { label: 'Next Action', field: 'next_action' },
                            { label: 'Due Date', field: 'due_date', type: 'date' },
                            { label: 'Last Contact', field: 'last_contact_date', type: 'date' },
                        ].map(({ label, field, type = 'text' }) => (
                            <div key={field}>
                                <label className="block text-xs text-[#9ca3af] mb-1 font-medium">{label}</label>
                                {editMode ? (
                                    <input
                                        type={type}
                                        value={editDraft[field] || ''}
                                        onChange={e => setEditDraft((d: any) => ({ ...d, [field]: e.target.value }))}
                                        className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                                    />
                                ) : (
                                    <p className="text-sm text-[#0a0a0a]">
                                        {type === 'date' && prospect[field]
                                            ? new Date(prospect[field]).toLocaleDateString()
                                            : prospect[field] || <span className="text-[#9ca3af]">—</span>}
                                    </p>
                                )}
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs text-[#9ca3af] mb-1 font-medium">SDR Assigned</label>
                            <select
                                value={prospect.assigned_to || ''}
                                onChange={e => updateField('assigned_to', e.target.value)}
                                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a]"
                            >
                                <option value="">Unassigned</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.unique_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Follow-up Queue */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#0a0a0a] mb-4">Follow-up Queue</h3>
                        {followups.length > 0 ? (
                            <div className="space-y-2">
                                {followups.map((f, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border",
                                        f.status === 'completed' ? "bg-[#16a34a]/5 border-[#16a34a]/20 opacity-60" : "bg-[#f8f9fa] border-[#e5e7eb]"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold",
                                                f.status === 'completed' ? "bg-[#16a34a]/20 text-[#16a34a]" : "bg-[#e5e7eb] text-[#6b7280]"
                                            )}>F{f.follow_up_number}</div>
                                            <span className="text-xs font-medium text-[#0a0a0a]">{new Date(f.scheduled_date).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const newStatus = f.status === 'completed' ? 'pending' : 'completed';
                                                await supabase.from('follow_ups').update({ status: newStatus }).eq('id', f.id);
                                                await logActivity('follow_up_updated', { note: `Follow-up #${f.follow_up_number} marked as ${newStatus}` });
                                                await fetchData();
                                            }}
                                            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                                                f.status === 'completed' ? "bg-[#16a34a]/20 text-[#16a34a]" : "bg-[#e5e7eb] text-[#9ca3af] hover:bg-[#0a0a0a] hover:text-white"
                                            )}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[#9ca3af] text-center py-4">No follow-ups scheduled.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Follow-up Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-2xl space-y-6 relative">
                        <button onClick={() => setShowScheduleModal(false)} className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-[#0a0a0a]">Schedule Follow-up</h3>
                            <p className="text-sm text-[#6b7280] mt-1">Follow-up #{(followups.length % 3) + 1}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-2">Date</label>
                            <input
                                type="date"
                                value={nextFollowupDate}
                                onChange={e => setNextFollowupDate(e.target.value)}
                                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-2.5 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleScheduleFollowup}
                            disabled={scheduling}
                            className="w-full py-3 bg-[#0a0a0a] text-white text-sm font-semibold rounded-lg hover:bg-[#1f1f1f] transition-colors disabled:opacity-40"
                        >
                            {scheduling ? "Scheduling..." : "Schedule"}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-2xl space-y-5 relative">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-[#dc2626]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#0a0a0a]">Delete Prospect</h3>
                                <p className="text-xs text-[#6b7280]">This cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#374151]">
                            Are you sure you want to permanently delete <strong>{prospect.company_name}</strong>? This action will be logged.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 rounded-lg border border-[#e5e7eb] text-sm font-medium text-[#0a0a0a] hover:bg-[#f1f3f5] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProspect}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-lg bg-[#dc2626] text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
