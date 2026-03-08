"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    User,
    Globe,
    Mail,
    Linkedin,
    Tag,
    Save,
    X,
    MessageSquare,
    CheckCircle2,
    ShieldAlert,
    ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function NewProspectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        company_name: "",
        website: "",
        source: "LinkedIn",
        tech_stack: "",
        revenue_mrr: "",
        growth_pct: 0,
        ph_launch_date: "",
        painpoints: "",
        contact_status: "prospect_identified",
        outreach_status: "Not contacted",
        next_action: "",
        due_date: "",
        poc_sent: false,
        notes: ""
    });

    const [founders, setFounders] = useState([
        { name: "", role: "Founder", email: "", x_handle: "", linkedin_profile: "" }
    ]);

    const addFounder = () => {
        setFounders([...founders, { name: "", role: "Founder", email: "", x_handle: "", linkedin_profile: "" }]);
    };

    const removeFounder = (index: number) => {
        if (founders.length <= 1) return;
        setFounders(founders.filter((_, i) => i !== index));
    };

    const updateFounder = (index: number, field: string, value: string) => {
        const newFounders = [...founders];
        (newFounders[index] as any)[field] = value;
        setFounders(newFounders);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Map founders to the first one for legacy columns if needed, 
            // but primarily store the array in the 'founders' jsonb column
            const mainFounder = founders[0] || {};

            const payload = {
                ...formData,
                founders: founders, // the new jsonb column
                founder_name: mainFounder.name, // legacy column
                email: mainFounder.email, // legacy column
                linkedin_profile: mainFounder.linkedin_profile, // legacy column
                role: mainFounder.role, // legacy column
                growth_pct: formData.growth_pct || null,
                ph_launch_date: formData.ph_launch_date || null,
                due_date: formData.due_date || null,
                last_contact_date: null
            };

            const { error: insertError } = await supabase
                .from('prospects')
                .insert([payload]);

            if (insertError) throw insertError;

            setSuccess(true);
            setTimeout(() => {
                router.push("/crm/prospects");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create prospect");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-syne font-bold text-white mb-2 uppercase tracking-tight">Lead Registered</h1>
                <p className="text-[#666] font-mono text-xs uppercase tracking-widest">Entry confirmed in Zentinel Pipeline</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Link
                href="/crm/prospects"
                className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Pipeline
            </Link>

            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-syne font-bold text-white uppercase tracking-tight">Aquire Lead</h1>
                    <p className="text-[#666] mt-2 italic font-mono text-[10px] uppercase tracking-widest">
                        "Precision tracking is the difference between a lead and a customer."
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-mono text-[var(--color-cyan)] uppercase tracking-widest block mb-1">Entry Protocol</span>
                    <span className="text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">EXCEL_DIRECT_SYNC</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* 1. FOUNDER INFO */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <User className="h-4 w-4 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-syne font-bold text-white uppercase tracking-wider">Founder Info</h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addFounder}
                            className="h-8 text-[10px] items-center gap-2 border-white/10 hover:bg-white/5 font-mono"
                        >
                            + ADD FOUNDER
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {founders.map((founder, index) => (
                            <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative group-founder animate-in slide-in-from-left-2 duration-300">
                                {founders.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeFounder(index)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Founder Name</label>
                                        <input
                                            type="text"
                                            value={founder.name}
                                            onChange={(e) => updateFounder(index, "name", e.target.value)}
                                            placeholder="Enter full name"
                                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Role</label>
                                        <input
                                            type="text"
                                            value={founder.role}
                                            onChange={(e) => updateFounder(index, "role", e.target.value)}
                                            placeholder="CEO, CTO, etc."
                                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">X Handle</label>
                                        <input
                                            type="text"
                                            value={founder.x_handle}
                                            onChange={(e) => updateFounder(index, "x_handle", e.target.value)}
                                            placeholder="@handle"
                                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            value={founder.email}
                                            onChange={(e) => updateFounder(index, "email", e.target.value)}
                                            placeholder="email@company.com"
                                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">LinkedIn URL</label>
                                        <input
                                            type="text"
                                            value={founder.linkedin_profile}
                                            onChange={(e) => updateFounder(index, "linkedin_profile", e.target.value)}
                                            placeholder="https://linkedin.com/in/..."
                                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-blue-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. COMPANY INFO */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <Building2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-syne font-bold text-white uppercase tracking-wider">Company Info</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white/5 border border-white/10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Company Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                placeholder="Acme Corp"
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-purple-500/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Website URL</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-purple-500/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Source</label>
                            <select
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-purple-500/50 transition-all font-mono"
                            >
                                <option value="Product Hunt">Product Hunt</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Crunchbase">Crunchbase</option>
                                <option value="GitHub">GitHub</option>
                                <option value="Referral">Referral</option>
                                <option value="Inbound">Inbound</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Tech Stack</label>
                            <input
                                type="text"
                                value={formData.tech_stack}
                                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                                placeholder="React, Next.js, etc."
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-purple-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>
                </section>

                {/* 3. BUSINESS INTELLEGENCE */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center border border-[var(--color-cyan)]/20">
                            <Tag className="h-4 w-4 text-[var(--color-cyan)]" />
                        </div>
                        <h2 className="text-lg font-syne font-bold text-white uppercase tracking-wider">Business Intelligence</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white/5 border border-white/10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Revenue / MRR</label>
                            <input
                                type="text"
                                value={formData.revenue_mrr}
                                onChange={(e) => setFormData({ ...formData, revenue_mrr: e.target.value })}
                                placeholder="$33,300"
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Growth %</label>
                            <input
                                type="number"
                                value={formData.growth_pct}
                                onChange={(e) => setFormData({ ...formData, growth_pct: parseFloat(e.target.value) || 0 })}
                                placeholder="25"
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Product Hunt Launch</label>
                            <input
                                type="date"
                                value={formData.ph_launch_date}
                                onChange={(e) => setFormData({ ...formData, ph_launch_date: e.target.value })}
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono text-[#888]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Perceived Painpoints</label>
                            <textarea
                                value={formData.painpoints}
                                onChange={(e) => setFormData({ ...formData, painpoints: e.target.value })}
                                placeholder="Manual scans, high cost, etc."
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono h-[46px] resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* 4. PIPELINE */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <ArrowRight className="h-4 w-4 text-orange-400" />
                        </div>
                        <h2 className="text-lg font-syne font-bold text-white uppercase tracking-wider">Pipeline Flow</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white/5 border border-white/10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Lead Status</label>
                            <select
                                value={formData.contact_status}
                                onChange={(e) => setFormData({ ...formData, contact_status: e.target.value })}
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 transition-all font-mono"
                            >
                                <option value="prospect_identified">Identified</option>
                                <option value="contacted">Contacted</option>
                                <option value="engaged">Engaged</option>
                                <option value="signed_up">Signed up</option>
                                <option value="active_user">Active user</option>
                                <option value="paid_customer">Paid customer</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Outreach Status</label>
                            <select
                                value={formData.outreach_status}
                                onChange={(e) => setFormData({ ...formData, outreach_status: e.target.value })}
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 transition-all font-mono"
                            >
                                <option value="Not contacted">Not contacted</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Replied">Replied</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Next Action</label>
                            <input
                                type="text"
                                value={formData.next_action}
                                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                                placeholder="Send DM / Follow up"
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Due Date</label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 transition-all font-mono text-[#888]"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-white/5 rounded-xl">
                            <input
                                type="checkbox"
                                id="poc_sent"
                                checked={formData.poc_sent}
                                onChange={(e) => setFormData({ ...formData, poc_sent: e.target.checked })}
                                className="h-4 w-4 bg-[var(--color-cyan)]/10 border-white/10 rounded"
                            />
                            <label htmlFor="poc_sent" className="text-xs font-mono text-[#888] uppercase tracking-widest cursor-pointer">POC Sent (Yes/No)</label>
                        </div>
                    </div>
                </section>

                {/* 5. NOTES */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-500/10 flex items-center justify-center border border-gray-500/20">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-syne font-bold text-white uppercase tracking-wider">Research & Resistance</h2>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <textarea
                            rows={6}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add research about funding rounds, recent news, or ICP match... Be specific about resistant points."
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-4 px-4 text-sm focus:border-white/20 transition-all font-mono resize-none"
                        />
                    </div>
                </section>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm animate-in shake duration-500">
                        <ShieldAlert className="h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-6 pt-12 border-t border-white/5">
                    <Link href="/crm/prospects" className="text-xs font-mono uppercase tracking-widest text-[#666] hover:text-white transition-colors">Abort Mission</Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-3 bg-[var(--color-cyan)] text-black px-10 py-4 rounded-2xl font-bold shadow-[0_4px_30px_rgba(0,212,255,0.2)] hover:shadow-[0_4px_50px_rgba(0,212,255,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all uppercase tracking-tighter text-sm"
                    >
                        {loading ? "Registering..." : (
                            <>
                                <Save className="h-5 w-5" /> Commit to Pipeline
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
