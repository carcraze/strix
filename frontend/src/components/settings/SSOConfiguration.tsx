"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Globe, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface SSOConfig {
    id: string;
    domain: string;
    workos_connection_id: string;
    created_at: string;
}

export function SSOConfiguration() {
    const { activeWorkspace } = useWorkspace();
    const [configs, setConfigs] = useState<SSOConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newDomain, setNewDomain] = useState("");
    const [newConnectionId, setNewConnectionId] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activeWorkspace?.id) {
            fetchConfigs();
        }
    }, [activeWorkspace?.id]);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("sso_configs")
                .select("*")
                .eq("organization_id", activeWorkspace?.id);

            if (error) throw error;
            setConfigs(data || []);
        } catch (err: any) {
            console.error("Error fetching SSO configs:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain || !newConnectionId) return;

        setSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from("sso_configs")
                .insert({
                    organization_id: activeWorkspace?.id,
                    domain: newDomain.toLowerCase().trim(),
                    workos_connection_id: newConnectionId.trim()
                });

            if (error) throw error;

            setNewDomain("");
            setNewConnectionId("");
            fetchConfigs();
        } catch (err: any) {
            console.error("Error adding SSO domain:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDomain = async (id: string) => {
        if (!confirm("Are you sure you want to disable SSO for this domain?")) return;

        try {
            const { error } = await supabase
                .from("sso_configs")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchConfigs();
        } catch (err: any) {
            console.error("Error deleting SSO domain:", err);
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-cyan)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h3 className="text-xl font-syne font-bold text-white mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--color-cyan)]" />
                    Enterprise Single Sign-On
                </h3>
                <p className="text-sm text-[var(--color-textSecondary)] max-w-2xl">
                    Configure SAML or OIDC authentication for your organization. Users with matching email domains will be redirected to your identity provider.
                </p>
            </div>

            {/* Active Connections */}
            <div className="grid gap-4">
                <h4 className="text-xs font-mono font-bold text-[var(--color-textMuted)] uppercase tracking-wider">Active Domains</h4>
                {configs.length === 0 ? (
                    <div className="bg-[#0D1117] border border-dashed border-[var(--color-border)] rounded-xl p-8 text-center">
                        <Globe className="h-8 w-8 text-[var(--color-textMuted)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--color-textSecondary)]">No SSO domains configured yet.</p>
                    </div>
                ) : (
                    configs.map((config) => (
                        <div key={config.id} className="bg-[#0D1117] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-[var(--color-cyan)]" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{config.domain}</div>
                                    <div className="text-xs font-mono text-[var(--color-textMuted)]">Connection: {config.workos_connection_id}</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDomain(config.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Remove
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New Connection Form */}
            <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Globe className="h-24 w-24" />
                </div>

                <h4 className="text-sm font-bold text-white mb-4">Add SSO Connection</h4>
                <form onSubmit={handleAddDomain} className="space-y-4 max-w-md relative z-10">
                    <div className="space-y-2">
                        <Label htmlFor="domain" className="text-xs font-mono text-[var(--color-textMuted)] uppercase">Company Domain</Label>
                        <Input
                            id="domain"
                            placeholder="acme.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            required
                            className="bg-[var(--background)] border-[var(--color-border)] text-white focus:border-[var(--color-cyan)]"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="connId" className="text-xs font-mono text-[var(--color-textMuted)] uppercase">WorkOS Connection ID</Label>
                            <a
                                href="https://dashboard.workos.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[var(--color-cyan)] hover:underline flex items-center gap-1"
                            >
                                Setup in WorkOS <ExternalLink className="h-2 w-2" />
                            </a>
                        </div>
                        <Input
                            id="connId"
                            placeholder="conn_..."
                            value={newConnectionId}
                            onChange={(e) => setNewConnectionId(e.target.value)}
                            required
                            className="bg-[var(--background)] border-[var(--color-border)] text-white focus:border-[var(--color-cyan)]"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={saving || !newDomain || !newConnectionId}
                        className="bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Enable SSO for Domain
                    </Button>
                </form>
            </div>

            {/* Help/Support info */}
            <div className="bg-white/5 rounded-xl p-4 flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-xs text-[var(--color-textSecondary)] leading-relaxed">
                    Need help setting up your Identity Provider? Contact our enterprise support team at <span className="text-white font-medium">enterprise@zentinel.ai</span> for assisted onboarding and custom certificate configuration.
                </div>
            </div>
        </div>
    );
}
