"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils"; // Assuming cn utility is available or needs to be added

export function ProfileAccount() {
    const { activeWorkspace, refreshWorkspaces } = useWorkspace(); // Changed to plural
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [initialOrgName, setInitialOrgName] = useState("");
    const [user, setUser] = useState<any>(null);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                    }
                    if (activeWorkspace) {
                        setOrgName(activeWorkspace.name || "");
                        setInitialOrgName(activeWorkspace.name || "");
                    }
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
        return () => { mounted = false; };
    }, [activeWorkspace]);

    const hasChanges = orgName !== initialOrgName;

    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !hasChanges) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ name: orgName })
                .eq('id', activeWorkspace.id);

            setInitialOrgName(orgName); // Update initial state after success
            refreshWorkspaces(); // Refresh the workspace context if name changed
        } catch (err: any) {
            console.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-cyan)]" />
            </div>
        );
    }

    const initials = user?.user_metadata?.first_name
        ? `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name?.charAt(0) || ""}`.toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || "U";

    const fullName = user?.user_metadata?.first_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
        : "User";

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
            {/* User Profile Section */}
            <div className="flex items-center justify-between p-6 bg-[#080A0F] border border-[var(--color-border)] rounded-2xl">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#1A2332] to-[#0D1117] flex items-center justify-center text-xl font-bold text-[#E8F4FF] border border-[#1A2332] shadow-xl">
                        {initials}
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-white font-syne">{fullName}</h2>
                        <p className="text-[var(--color-textSecondary)] text-sm">{user?.email}</p>
                    </div>
                </div>
                <PlanBadge plan={activeWorkspace?.plan || "starter"} className="px-3 py-1 text-[11px]" />
            </div>

            {/* 2FA Section */}
            <div className="p-6 bg-[#080A0F] border border-[var(--color-border)] rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-[var(--color-textMuted)]">Protect your account with an authenticator app that generates one-time codes.</p>
                </div>
                <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                />
            </div>

            {/* Organization Settings Section */}
            <div className="p-6 bg-[#080A0F] border border-[var(--color-border)] rounded-2xl">
                <h3 className="text-base font-bold text-white mb-8">Organization</h3>

                <form onSubmit={handleUpdateOrg} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--color-textSecondary)] uppercase tracking-wider">Name</label>
                        <Input
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="bg-[#0D1117] border-[var(--color-border)] h-12 focus:ring-[var(--color-cyan)]/20 transition-all text-white"
                            placeholder="Org Name"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSaving || !hasChanges}
                        className={cn(
                            "h-12 px-8 font-bold rounded-lg transition-all duration-300",
                            hasChanges
                                ? "bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                : "bg-white/10 text-white/30 border border-white/5 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>

                    <div className="pt-8 border-t border-[var(--color-border)] space-y-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-[var(--color-textMuted)] uppercase tracking-wider">Organization ID</span>
                            <span className="text-sm font-mono text-[var(--color-textSecondary)] break-all">{activeWorkspace?.id}</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-[var(--color-textMuted)] uppercase tracking-wider">Your Role</span>
                            <span className="text-sm text-[var(--color-textSecondary)] capitalize">{activeWorkspace?.role || "Member"}</span>
                        </div>
                    </div>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="p-6 bg-[#080A0F] border border-red-500/20 rounded-2xl">
                <h3 className="text-base font-bold text-red-500 mb-2">Danger Zone</h3>
                <p className="text-sm text-[var(--color-textMuted)] mb-6"> Permanently remove your organization and all related data. This action cannot be undone.</p>

                <Button
                    variant="outline"
                    className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold"
                >
                    Delete Organization
                </Button>
            </div>
        </div>
    );
}
