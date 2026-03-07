"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getMembers, inviteMember } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export function TeamManagement() {
    const { activeWorkspace } = useWorkspace();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("developer");
    const [invitePassword, setInvitePassword] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [invitedUserCredentials, setInvitedUserCredentials] = useState<{ email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchMembers = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const data = await getMembers(activeWorkspace.id);
                setMembers(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [activeWorkspace]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace) return;
        setIsSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/manage-member", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: "invite",
                    orgId: activeWorkspace.id,
                    email: inviteEmail,
                    password: invitePassword,
                    role: inviteRole
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to invite");

            showToast("success", `Member invited and account created.`);
            setInvitedUserCredentials({ email: inviteEmail, password: invitePassword });
            setShowSuccessModal(true);

            setInviteEmail("");
            setInvitePassword("");
            // Refresh member list
            const data = await getMembers(activeWorkspace.id);
            setMembers(data || []);
        } catch (err: any) {
            showToast("error", err.message || "Failed to send invitation.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSuspend = async (userId: string, isSuspended: boolean) => {
        if (!activeWorkspace) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/manage-member", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: isSuspended ? "unsuspend" : "suspend",
                    userId,
                    orgId: activeWorkspace.id
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            showToast("success", isSuspended ? "User reinstated." : "User suspended.");
            const data = await getMembers(activeWorkspace.id);
            setMembers(data || []);
        } catch (err: any) {
            showToast("error", err.message);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!activeWorkspace || !confirm("Are you sure you want to remove this member?")) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/manage-member", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: "delete",
                    userId,
                    orgId: activeWorkspace.id
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            showToast("success", "Member removed.");
            const data = await getMembers(activeWorkspace.id);
            setMembers(data || []);
        } catch (err: any) {
            showToast("error", err.message);
        }
    };

    const roleStyle = (role: string) => {
        switch (role) {
            case "owner": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
            case "admin": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
            case "developer": return "bg-green-500/10 text-green-400 border border-green-500/20";
            default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
        }
    };

    const userRole = activeWorkspace?.role || "viewer";
    const isAdmin = ["owner", "admin"].includes(userRole);
    const isOwner = userRole === "owner";

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-2xl font-syne font-bold text-white mb-2">Members</h2>
                <p className="text-[var(--color-textSecondary)] text-sm">Manage who has access to your organization's Zentinel workspace.</p>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-3 mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                    {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                    {toast.message}
                </div>
            )}

            {/* Invite Section - Only for Admins/Owners */}
            {isAdmin && (
                <div className="bg-[#080A0F] border border-[var(--color-border)] rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-6">Invite Team Member</h3>
                    <form onSubmit={handleInvite} className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-mono text-[var(--color-textSecondary)] uppercase">Email</label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="colleague@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-[#0D1117] border-[var(--color-border)] h-11"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-mono text-[var(--color-textSecondary)] uppercase">Initial Password</label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="Set password for member"
                                    value={invitePassword}
                                    onChange={(e) => setInvitePassword(e.target.value)}
                                    className="bg-[#0D1117] border-[var(--color-border)] h-11"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full sm:w-48 space-y-1">
                                <label className="text-xs font-mono text-[var(--color-textSecondary)] uppercase">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full h-11 px-3 bg-[#0D1117] border border-[var(--color-border)] rounded-md text-sm text-white focus:outline-none focus:border-[var(--color-cyan)]"
                                >
                                    {isOwner && <option value="owner">Owner</option>}
                                    <option value="admin">Admin</option>
                                    <option value="developer">Developer</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                disabled={isSending}
                                className="w-full sm:w-auto h-11 bg-[var(--color-cyan)] text-black font-bold hover:bg-[var(--color-cyan)]/90 px-8 disabled:opacity-50"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Create & Add Member</>}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Members List */}
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--background)] border-b border-[var(--color-border)]">
                            <th className="py-3 px-4 font-mono text-xs text-[var(--color-textMuted)] font-medium">USER</th>
                            <th className="py-3 px-4 font-mono text-xs text-[var(--color-textMuted)] font-medium">STATUS / ROLE</th>
                            {isAdmin && <th className="py-3 px-4 font-mono text-xs text-[var(--color-textMuted)] font-medium text-right">ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            <tr>
                                <td colSpan={isAdmin ? 3 : 2} className="py-8 text-center text-[var(--color-textMuted)] text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading members...
                                </td>
                            </tr>
                        ) : members.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 3 : 2} className="py-8 text-center text-[var(--color-textMuted)] text-sm">
                                    No members found.
                                </td>
                            </tr>
                        ) : members.map((member: any) => {
                            const profile = member.user_profiles;
                            const isSuspended = profile?.is_suspended;
                            const isTargetOwner = member.role === "owner";
                            const isActuallySelf = profile?.id === currentUserId;

                            const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Unknown User';
                            const email = profile?.email || '';
                            const initials = name.charAt(0).toUpperCase();

                            return (
                                <tr key={member.id} className={`hover:bg-white/5 transition-colors ${isSuspended ? 'opacity-50' : ''}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-linear-to-br from-gray-700 to-gray-900 flex shrink-0 items-center justify-center text-xs font-bold font-mono text-white border border-gray-600">
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-white">
                                                        {name} {isActuallySelf && <span className="text-[10px] text-[var(--color-textMuted)] ml-1">(You)</span>}
                                                    </div>
                                                    {isSuspended && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 rounded uppercase font-bold">Suspended</span>}
                                                </div>
                                                <div className="text-xs text-[var(--color-textMuted)]">{email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-medium uppercase ${roleStyle(member.role)}`}>
                                            {member.role === 'owner' ? 'Super Admin' : (member.role || 'MEMBER')}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="py-3 px-4 text-right">
                                            {!isTargetOwner && !isActuallySelf && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSuspend(profile?.id, isSuspended)}
                                                        className={`h-8 text-[11px] font-bold uppercase transition-colors ${isSuspended ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                                                    >
                                                        {isSuspended ? 'Unsuspend' : 'Suspend'}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(profile?.id)}
                                                        className="h-8 text-[11px] font-bold uppercase text-gray-400 hover:text-white"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invitation Success Modal */}
            {showSuccessModal && invitedUserCredentials && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-6">
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-center text-white mb-2">Member Added Successfully</h3>
                            <p className="text-sm text-center text-[var(--color-textMuted)] mb-6">
                                Account created for <span className="text-white font-medium">{invitedUserCredentials.email}</span>. Copy the message below to share with them.
                            </p>

                            <div className="relative group">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-[10px] uppercase font-bold text-[var(--color-cyan)]"
                                        onClick={() => {
                                            const message = `Welcome to the team at ${activeWorkspace?.name || 'Zentinel'}!\n\nYour account has been created on Zentinel.\nEmail: ${invitedUserCredentials.email}\nPassword: ${invitedUserCredentials.password}\n\nSign in here: https://zentinel.de/sign-in`;
                                            navigator.clipboard.writeText(message);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        {copied ? "Copied!" : "Copy Message"}
                                    </Button>
                                </div>
                                <div className="bg-[#080A0F] border border-[var(--color-border)] rounded-xl p-4 font-mono text-xs text-[var(--color-textSecondary)] leading-relaxed whitespace-pre-wrap">
                                    {`Welcome to the team at ${activeWorkspace?.name || 'Zentinel'}!\n\nYour account has been created on Zentinel.\nEmail: ${invitedUserCredentials.email}\nPassword: ${invitedUserCredentials.password}\n\nSign in here: zentinel.de/sign-in`}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button
                                    className="flex-1 h-11 bg-white hover:bg-white/90 text-black font-bold rounded-xl"
                                    onClick={() => {
                                        const message = `Welcome to the team at ${activeWorkspace?.name || 'Zentinel'}!\n\nYour account has been created on Zentinel.\nEmail: ${invitedUserCredentials.email}\nPassword: ${invitedUserCredentials.password}\n\nSign in here: https://zentinel.de/sign-in`;
                                        navigator.clipboard.writeText(message);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                >
                                    {copied ? "Copied to Clipboard!" : "Copy & Close"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-11 px-6 border border-[var(--color-border)] text-white hover:bg-white/5 font-bold rounded-xl"
                                    onClick={() => setShowSuccessModal(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
