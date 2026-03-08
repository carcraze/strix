"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserPlus,
    Shield,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Check,
    X,
    Copy,
    ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function TeamManagementPage() {
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [makeAdmin, setMakeAdmin] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [showWelcome, setShowWelcome] = useState(false);
    const [newMember, setNewMember] = useState<any>(null);
    const [tempCredentials, setTempCredentials] = useState<any>(null);

    useEffect(() => {
        const checkAdminAndFetchTeam = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if current user is admin
            const { data: currentStaff } = await supabase
                .from('crm_staff')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

            if (!currentStaff?.is_admin) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            setIsAdmin(true);

            // Fetch all staff
            const { data } = await supabase
                .from('crm_staff')
                .select('*')
                .order('created_at', { ascending: false });

            setStaff(data || []);
            setLoading(false);
        };

        checkAdminAndFetchTeam();
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("/api/crm/manage-staff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    isAdmin: makeAdmin
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Failed to create agent");

            setStaff([result.member, ...staff]);
            setNewMember(result.member);
            setTempCredentials(result.credentials);
            setShowWelcome(true);

            // Clear form
            setName("");
            setEmail("");
            setPassword("");
            setMakeAdmin(false);
        } catch (err: any) {
            setError(err.message || "Failed to add team member");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm("CRITICAL: Permanent Deletion. This agent's credentials will be voided. Proceed?")) return;

        try {
            const { error: deleteError } = await supabase
                .from('crm_staff')
                .delete()
                .eq('id', memberId);

            if (deleteError) throw deleteError;
            setStaff(staff.filter(s => s.id !== memberId));
        } catch (err: any) {
            alert("Deletion failed: " + err.message);
        }
    };

    const toggleStatus = async (memberId: string, currentStatus: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('crm_staff')
                .update({ is_active: !currentStatus })
                .eq('id', memberId);

            if (updateError) throw updateError;

            setStaff(staff.map(s => s.id === memberId ? { ...s, is_active: !currentStatus } : s));
        } catch (err: any) {
            alert("Update failed: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Shield className="h-16 w-16 text-red-500/20 mb-6" />
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Access Restricted</h1>
                <p className="text-[#666] mt-2 font-mono text-xs uppercase tracking-widest leading-relaxed">
                    This sector is restricted to Super Administrators only.<br />
                    Unauthorized access attempt logged.
                </p>
                <Link href="/crm" className="mt-8 text-xs font-mono text-[var(--color-cyan)] hover:underline uppercase tracking-widest">Return to Base</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Link
                href="/crm"
                className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-syne font-bold text-white uppercase tracking-tight">Team Command</h1>
                    <p className="text-[#666] mt-2 italic font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                        "A sales engine is only as strong as the SDRs who fuel it."
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-mono text-[var(--color-cyan)] uppercase tracking-widest block mb-1">Personnel Ops</span>
                    <span className="text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase font-mono tracking-tighter">ADMIN_LEVEL_0</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Member Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6 space-y-6 bg-[#080808] border-white/5 sticky top-24">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center border border-[var(--color-cyan)]/20">
                                <UserPlus className="h-4 w-4 text-[var(--color-cyan)]" />
                            </div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-syne">Enlist New Agent</h2>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Agent Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Email / Username</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@company.com"
                                    className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Password</label>
                                <input
                                    type="text"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Set temporary password"
                                    className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-black/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors cursor-pointer" onClick={() => setMakeAdmin(!makeAdmin)}>
                                <div className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                    makeAdmin ? "bg-purple-500 border-purple-500" : "bg-transparent border-white/20"
                                )}>
                                    {makeAdmin && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-[10px] font-mono text-[#888] uppercase tracking-widest flex items-center gap-2">
                                    <Shield className={cn("h-3 w-3", makeAdmin ? "text-purple-400" : "text-[#444]")} />
                                    Grant Admin Clearance
                                </span>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-mono uppercase">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-white text-black font-bold h-12 uppercase tracking-tighter hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-all"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Agent"}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Staff List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#444]" />
                            <h2 className="text-xs font-mono text-[#666] uppercase tracking-widest">Active Personnel Directory</h2>
                        </div>
                        <span className="text-[10px] font-mono text-[#444] uppercase">{staff.length} Members</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staff.map((member) => (
                            <Card key={member.id} className={cn(
                                "p-5 bg-[#080808] border transition-all duration-300",
                                member.is_active ? "border-white/5 hover:border-white/10" : "border-red-500/20 opacity-60 grayscale"
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-black border border-white/10 shadow-inner",
                                            member.is_admin ? "from-purple-500 to-blue-500" : "from-gray-500 to-black"
                                        )}>
                                            {member.unique_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white font-syne leading-none mb-1">{member.unique_name}</h3>
                                            <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest">{member.is_admin ? "Super Admin" : "Sales Agent"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.is_admin && (
                                            <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20" title="Super Admin">
                                                <Shield className="h-3 w-3 text-purple-400" />
                                            </div>
                                        )}
                                        {member.user_id ? (
                                            <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20" title="Linked to System User">
                                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20" title="Unlinked Agent">
                                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                    <span className={cn(
                                        "text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded",
                                        member.is_active ? "text-green-400 bg-green-400/5" : "text-red-400 bg-red-400/5"
                                    )}>
                                        {member.is_active ? "Operational" : "Deactivated"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleStatus(member.id, member.is_active)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                member.is_active ? "text-[#444] hover:text-red-400 hover:bg-red-400/5" : "text-green-400 hover:bg-green-400/10"
                                            )}
                                            title={member.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {member.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="p-2 rounded-lg text-[#222] hover:text-red-600 transition-colors"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Welcome Modal */}
            {showWelcome && newMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="max-w-md w-full p-8 bg-[#0a0a0a] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-cyan)] to-transparent" />

                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-[var(--color-cyan)]/10 flex items-center justify-center border border-[var(--color-cyan)]/20 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                                <CheckCircle2 className="h-10 w-10 text-[var(--color-cyan)]" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-syne font-bold text-white uppercase tracking-tight">Agent Deployed</h3>
                                <p className="text-[#666] font-mono text-[10px] uppercase tracking-widest mt-1">Credentials initialized for base access</p>
                            </div>

                            <div className="w-full space-y-4 text-left">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Login Credentials</span>
                                        <button
                                            onClick={() => {
                                                const text = `Zentinel CRM Access Granted:\nEmail: ${tempCredentials.email}\nPassword: ${tempCredentials.password}\nLogin at: ${window.location.origin}/crm`;
                                                navigator.clipboard.writeText(text);
                                            }}
                                            className="text-[10px] font-mono text-[var(--color-cyan)] hover:underline flex items-center gap-1"
                                        >
                                            <Copy className="h-3 w-3" /> Copy Credentials
                                        </button>
                                    </div>
                                    <div className="font-mono text-xs text-[#888] space-y-2 leading-relaxed">
                                        <p>Zentinel CRM Access:</p>
                                        <p className="text-white">Email: {tempCredentials.email}</p>
                                        <p className="text-white">Password: {tempCredentials.password}</p>
                                        <p>URL: <span className="text-[var(--color-cyan)] underline select-all">{window.location.origin}/crm</span></p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
                                    <Shield className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-purple-300 leading-relaxed font-mono">
                                        Instruct the agent to use these credentials at the Access URL. The account is already pre-linked and ready for immediate operational use.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowWelcome(false)}
                                className="w-full bg-white text-black font-bold h-12 uppercase tracking-tighter"
                            >
                                Close Operations Log
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
