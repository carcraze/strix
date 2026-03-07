"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2, Mail, ExternalLink, Slack, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPrefs {
    email_scan_completed: boolean;
    email_critical_vulns: boolean;
    email_high_vulns: boolean;
    email_pr_review: boolean;
    email_weekly_summary: boolean;
    email_monthly_report: boolean;
    slack_critical_vulns: boolean;
    slack_high_vulns: boolean;
    slack_scan_completed: boolean;
    slack_pr_blocked: boolean;
}

const defaultPrefs: NotificationPrefs = {
    email_scan_completed: true,
    email_critical_vulns: true,
    email_high_vulns: false,
    email_pr_review: false,
    email_weekly_summary: false,
    email_monthly_report: false,
    slack_critical_vulns: true,
    slack_high_vulns: false,
    slack_scan_completed: false,
    slack_pr_blocked: true,
};

export function NotificationsSettings() {
    const { activeWorkspace } = useWorkspace();
    const [isLoading, setIsLoading] = useState(true);
    const [isSlackConnected, setIsSlackConnected] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            if (!activeWorkspace) return;
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);

                    // Load notification preferences
                    const { data: existingPrefs, error } = await supabase
                        .from('notification_preferences')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();

                    if (existingPrefs) {
                        setPrefs(existingPrefs);
                    } else {
                        // Create initial preferences if they don't exist
                        await supabase
                            .from('notification_preferences')
                            .insert({
                                user_id: session.user.id,
                                organization_id: activeWorkspace.id,
                                ...defaultPrefs
                            });
                    }

                    // Check Slack integration
                    const { data: integrations } = await supabase
                        .from('integrations')
                        .select('id')
                        .eq('organization_id', activeWorkspace.id)
                        .eq('provider', 'slack')
                        .limit(1);

                    setIsSlackConnected(!!(integrations && integrations.length > 0));
                }
            } catch (err) {
                console.error("Failed to load notification settings:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        loadData();
        return () => { mounted = false; };
    }, [activeWorkspace]);

    const handleToggle = async (field: keyof NotificationPrefs, value: boolean) => {
        if (!user) return;

        // 1. Optimistic update
        setPrefs(prev => ({ ...prev, [field]: value }));

        // 2. Save to Supabase
        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: activeWorkspace?.id,
                    [field]: value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
        } catch (err) {
            console.error(`Failed to save ${field}:`, err);
            // 3. Revert on error
            setPrefs(prev => ({ ...prev, [field]: !value }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-cyan)]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
            {/* Email Notifications Section */}
            <div className="bg-[#080A0F] border border-(--color-border) rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-(--color-border) bg-linear-to-r from-[#0D1117] to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Mail className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Email Notifications</h3>
                            <p className="text-xs text-(--color-textMuted)">Configure which events trigger email notifications.</p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-(--color-border)">
                    <ToggleRow
                        label="Scan Completed"
                        subtitle="Get notified when a penetration test completes"
                        checked={prefs.email_scan_completed}
                        onChange={(val) => handleToggle('email_scan_completed', val)}
                    />
                    <ToggleRow
                        label="Critical Vulnerabilities"
                        subtitle="Get notified when critical issues are found"
                        checked={prefs.email_critical_vulns}
                        onChange={(val) => handleToggle('email_critical_vulns', val)}
                    />
                    <ToggleRow
                        label="High Vulnerabilities"
                        subtitle="Get notified when high severity issues are found"
                        checked={prefs.email_high_vulns}
                        onChange={(val) => handleToggle('email_high_vulns', val)}
                    />
                    <ToggleRow
                        label="PR Review Completed"
                        subtitle="Get notified when a PR security review finishes"
                        checked={prefs.email_pr_review}
                        onChange={(val) => handleToggle('email_pr_review', val)}
                    />
                    <ToggleRow
                        label="Weekly Summary"
                        subtitle="Receive a weekly security report via email"
                        checked={prefs.email_weekly_summary}
                        onChange={(val) => handleToggle('email_weekly_summary', val)}
                    />
                    <ToggleRow
                        label="Monthly Report"
                        subtitle="Receive a monthly security summary"
                        checked={prefs.email_monthly_report}
                        onChange={(val) => handleToggle('email_monthly_report', val)}
                    />
                </div>

                <div className="p-4 bg-[#0D1117]/50 border-t border-(--color-border)">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-(--color-textMuted)">
                            Emails will be sent to: <span className="text-white font-medium">{user?.email}</span>
                        </span>
                        <a href="/dashboard/settings/general" className="text-(--color-cyan) hover:underline flex items-center gap-1">
                            Change email <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Slack Notifications Section */}
            <div className="bg-[#080A0F] border border-(--color-border) rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-(--color-border) bg-linear-to-r from-[#0D1117] to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#4A154B]/10 flex items-center justify-center border border-[#4A154B]/20">
                            <Slack className="h-5 w-5 text-[#4A154B]" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Slack Notifications</h3>
                            {isSlackConnected ? (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Connected to workspace
                                </p>
                            ) : (
                                <p className="text-xs text-(--color-textMuted)">Connect Slack to get real-time alerts in your team channel.</p>
                            )}
                        </div>
                    </div>
                </div>

                {!isSlackConnected ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                            <Slack className="h-6 w-6 text-[var(--color-textMuted)]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-white">Not Connected</h4>
                            <p className="text-xs text-[var(--color-textMuted)] max-w-xs mx-auto">
                                Synchronize your security alerts with your team's Slack workspace.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 border-[var(--color-border)] hover:bg-white/5 text-white"
                            onClick={() => window.location.href = '/dashboard/integrations'}
                        >
                            Connect Slack <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                        <ToggleRow
                            label="Critical Vulnerabilities"
                            subtitle="Instant alert when a critical issue is found"
                            checked={prefs.slack_critical_vulns}
                            onChange={(val) => handleToggle('slack_critical_vulns', val)}
                        />
                        <ToggleRow
                            label="High Vulnerabilities"
                            subtitle="Alert when high severity issues are found"
                            checked={prefs.slack_high_vulns}
                            onChange={(val) => handleToggle('slack_high_vulns', val)}
                        />
                        <ToggleRow
                            label="Scan Completed"
                            subtitle="Notify when any pentest finishes"
                            checked={prefs.slack_scan_completed}
                            onChange={(val) => handleToggle('slack_scan_completed', val)}
                        />
                        <ToggleRow
                            label="PR Review Blocked"
                            subtitle="Alert when a PR is blocked due to security issues"
                            checked={prefs.slack_pr_blocked}
                            onChange={(val) => handleToggle('slack_pr_blocked', val)}
                        />
                        <div className="p-4 bg-[#0D1117]/50">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--color-textMuted)]">Connected to <span className="text-white font-medium">#security-alerts</span></span>
                                <button className="text-[var(--color-cyan)] hover:underline flex items-center gap-1">
                                    Configure channel <ExternalLink className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ToggleRow({ label, subtitle, checked, onChange }: {
    label: string,
    subtitle: string,
    checked: boolean,
    onChange: (val: boolean) => void
}) {
    return (
        <div className="p-6 flex items-center justify-between hover:bg-white/2 transition-colors group">
            <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white group-hover:text-(--color-cyan) transition-colors">{label}</h4>
                <p className="text-xs text-(--color-textMuted)">{subtitle}</p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onChange}
            />
        </div>
    );
}
