"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Zap, GitBranch, Bell, PlugZap, Clock, Settings, Unplug } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSearchParams } from "next/navigation";

// ─── SVG Brand Logos ─────────────────────────────────────────────────────────
const GitHubLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

const GitLabLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" fill="#FC6D26" />
    </svg>
);

const BitbucketLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.52.873 1.027.873h15.386c.388 0 .72-.272.79-.655l3.263-20.03a.768.768 0 0 0-.768-.89H.778zM14.52 15.53H9.522L8.17 8.466h7.704l-1.354 7.064z" fill="#2684FF" />
    </svg>
);

const JiraLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.132v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.024-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.486V1.005A1.001 1.001 0 0 0 23.013 0z" fill="#2684FF" />
    </svg>
);

const LinearLogo = () => (
    <svg viewBox="0 0 100 100" className="h-5 w-5">
        <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7B61FF" /><stop offset="100%" stopColor="#5E4DCA" /></linearGradient></defs>
        <circle cx="50" cy="50" r="50" fill="url(#lg2)" />
        <path d="M17 63.7L36.3 83c-11.1-4-19.9-12.3-19.3-19.3zM15 57.7l27.3 27.3c2-.4 4-.9 5.9-1.7L16.7 51.8c-.8 1.9-1.3 3.9-1.7 5.9zm4.5-11.6l34.4 34.4c1.5-.7 3-1.5 4.4-2.5L22 43.7c-1 1.4-1.8 2.9-2.5 4.4zm6.5-9.3l37 37c1.3-1.1 2.5-2.3 3.6-3.5L29.6 32.5c-1.3 1.1-2.5 2.3-3.6 3.6zm9.5-7.7L68 71.5c1.4-.9 2.8-2 4-3.1L38.6 25.9c-1.2 1.3-2.2 2.6-3.1 4.2zm10.5-6.1l31 31c1.2-1.5 2.3-3.1 3.2-4.8L49.2 23.5c-1.7.9-3.3 2-4.8 3.2zm11-5l23 23c.9-2 1.6-4 2.1-6.1L61 23.4c-2.1.5-4.1 1.2-6.1 2.1zm11-3.2l13.1 13.1c.3-2.1.3-4.3 0-6.5L72 14.5c-2.1-.3-4.3-.3-6.5.1z" fill="white" />
    </svg>
);

const SlackLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
    </svg>
);

const PagerDutyLogo = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M16.687.007C14.396-.1 12.22.616 10.68 2.15L4.73 8.036H0v7.927h4.73l5.95 5.885c1.307 1.307 3.054 2.02 4.854 2.02.538 0 1.084-.065 1.617-.2 2.296-.565 3.849-2.63 3.849-5.04V5.247C21 2.753 19.112.116 16.687.007zm2.023 8.47v6.038c0 1.19-.636 1.978-1.58 2.219-.945.24-1.986-.1-2.712-.826L9.482 11.0l4.936-4.893c.726-.726 1.767-1.066 2.712-.826.944.241 1.58 1.03 1.58 2.196z" fill="#06AC38" />
    </svg>
);

// ─── Row Component ────────────────────────────────────────────────────────────
function IntegrationRow({
    logo, name, description, logoColor, connected, connectHref, manageHref, comingSoon, providerId, orgId, onDisconnect,
}: {
    logo: React.ReactNode;
    name: string;
    description: string;
    logoColor: string;
    connected: boolean;
    connectHref?: string;
    manageHref?: string;
    comingSoon?: boolean;
    providerId?: string;
    orgId?: string;
    onDisconnect?: (provider: string) => void;
}) {
    const [disconnecting, setDisconnecting] = useState(false);

    const handleDisconnect = async () => {
        if (!providerId || !onDisconnect) return;
        if (!confirm(`Disconnect ${name}? This will remove access for your workspace.`)) return;
        setDisconnecting(true);
        try {
            await fetch(`/api/oauth/${providerId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId: orgId }),
            });
            onDisconnect(providerId);
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <div className="flex items-center justify-between py-4 px-5 group hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
                <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${logoColor}18` }}
                >
                    {logo}
                </div>
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-white">{name}</span>
                        {connected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
                                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{description}</p>
                </div>
            </div>

            <div className="shrink-0 ml-8 flex items-center gap-2">
                {comingSoon ? (
                    <span className="flex items-center gap-1.5 text-xs text-white/25 font-mono">
                        <Clock className="h-3 w-3" />
                        Coming soon
                    </span>
                ) : connected ? (
                    <>
                        <Link
                            href={manageHref || "/dashboard/repositories"}
                            className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Settings className="h-3 w-3" />
                            Configure
                        </Link>
                        <button
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="flex items-center gap-1.5 text-xs font-medium text-white/30 hover:text-red-400 hover:border-red-400/30 border border-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 group/disc"
                        >
                            {disconnecting ? (
                                <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Unplug className="h-3 w-3" />
                            )}
                            Disconnect
                        </button>
                    </>
                ) : connectHref && orgId ? (
                    <a
                        href={connectHref}
                        className="flex items-center gap-1.5 text-xs font-bold text-black px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                        style={{ background: logoColor === '#ffffff' ? 'white' : logoColor }}
                    >
                        <PlugZap className="h-3 w-3" />
                        Connect
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                ) : (
                    <button disabled className="flex items-center gap-1.5 text-xs font-medium text-white/50 border border-white/10 px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50 bg-white/5">
                        <PlugZap className="h-3 w-3 opacity-50" />
                        Connect
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ icon, title, description, children }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <div>
                    <h2 className="text-sm font-syne font-bold text-white">{title}</h2>
                    <p className="text-xs text-white/40 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="bg-[#0C0C0E] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                {children}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
    const { activeWorkspace } = useWorkspace();
    const [connected, setConnected] = useState<Set<string>>(new Set());
    const searchParams = useSearchParams();

    const fetchConnected = async () => {
        if (!activeWorkspace) return;
        const { data } = await supabase
            .from("integrations")
            .select("provider")
            .eq("organization_id", activeWorkspace.id);
        if (data) setConnected(new Set(data.map((r: any) => r.provider)));
    };

    useEffect(() => { fetchConnected(); }, [activeWorkspace]);

    // Show success toast and refetch when OAuth completes
    const [toast, setToast] = useState<string | null>(null);
    useEffect(() => {
        const connected = searchParams.get("connected");
        const repos     = searchParams.get("repos");
        const error     = searchParams.get("error");
        if (connected) {
            fetchConnected();
            const repoMsg = repos ? ` ${repos} repositories synced.` : '';
            setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!${repoMsg}`);
            setTimeout(() => setToast(null), 5000);
        }
        if (error) {
            setToast(`Connection failed: ${error.replace(/_/g, ' ')}. Please try again.`);
            setTimeout(() => setToast(null), 5000);
        }
    }, [searchParams]);

    const isConnected = (id: string) => connected.has(id);
    const connectedCount = connected.size;
    const totalCount = 7;
    const orgId = activeWorkspace?.id || '';

    const handleDisconnect = (provider: string) => {
        setConnected(prev => { const next = new Set(prev); next.delete(provider); return next; });
    };

    return (
        <>
        {toast && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${
                toast.includes('failed') || toast.includes('Error')
                    ? 'bg-red-600 text-white'
                    : 'bg-green-600 text-white'
            }`}>
                {toast}
            </div>
        )}
        <div className="flex-1 w-full bg-[#050505] p-8 overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-[780px] mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-syne font-bold text-white tracking-tight">Integrations</h1>
                        <p className="text-white/40 mt-1 text-sm">Connect Zentinel into your existing stack.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] rounded-xl px-3.5 py-2 text-xs">
                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        <span className="text-white font-bold">{connectedCount}</span>
                        <span className="text-white/30">/ {totalCount} active</span>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Source Control */}
                    <Section
                        icon={<div className="h-7 w-7 rounded-lg bg-[var(--color-cyan)]/10 flex items-center justify-center"><GitBranch className="h-3.5 w-3.5 text-[var(--color-cyan)]" /></div>}
                        title="Source Control"
                        description="Connect repositories for white-box scanning and automated PR reviews."
                    >
                        <IntegrationRow
                            logo={<GitHubLogo />}
                            name="GitHub"
                            description="Scan code and automate fixes via Pull Requests"
                            logoColor="#ffffff"
                            connected={isConnected("github")}
                            connectHref={`/api/integrations/authorize?provider=github&state=${orgId}`}
                            manageHref="/dashboard/settings?tab=repositories"
                            providerId="github"
                            orgId={orgId}
                            onDisconnect={handleDisconnect}
                        />
                        <IntegrationRow
                            logo={<GitLabLogo />}
                            name="GitLab"
                            description="Deep source analysis via Merge Requests"
                            logoColor="#FC6D26"
                            connected={isConnected("gitlab")}
                            connectHref={`/api/integrations/authorize?provider=gitlab&state=${orgId}`}
                            manageHref="/dashboard/settings?tab=repositories"
                            providerId="gitlab"
                            orgId={orgId}
                            onDisconnect={handleDisconnect}
                        />
                        <IntegrationRow
                            logo={<BitbucketLogo />}
                            name="Bitbucket"
                            description="Enterprise code scanning for Atlassian Bitbucket"
                            logoColor="#2684FF"
                            connected={isConnected("bitbucket")}
                            connectHref={`/api/integrations/authorize?provider=bitbucket&state=${orgId}`}
                            manageHref="/dashboard/settings?tab=repositories"
                            providerId="bitbucket"
                            orgId={orgId}
                            onDisconnect={handleDisconnect}
                        />
                    </Section>

                    {/* Issue Trackers */}
                    <Section
                        icon={<div className="h-7 w-7 rounded-lg bg-amber-400/10 flex items-center justify-center"><Bell className="h-3.5 w-3.5 text-amber-400" /></div>}
                        title="Issue Trackers"
                        description="Auto-push vulnerabilities as actionable tickets."
                    >
                        <IntegrationRow
                            logo={<JiraLogo />}
                            name="Jira"
                            description="Auto-create and sync Jira tickets for every finding"
                            logoColor="#2684FF"
                            connected={isConnected("jira")}
                            comingSoon
                        />
                        <IntegrationRow
                            logo={<LinearLogo />}
                            name="Linear"
                            description="Push findings directly into Linear as issues"
                            logoColor="#7B61FF"
                            connected={isConnected("linear")}
                            comingSoon
                        />
                    </Section>

                    {/* Team Alerts */}
                    <Section
                        icon={<div className="h-7 w-7 rounded-lg bg-[#E01E5A]/10 flex items-center justify-center"><Zap className="h-3.5 w-3.5 text-[#E01E5A]" /></div>}
                        title="Team Alerts"
                        description="Get notified in your team's channels when critical issues are found."
                    >
                        <IntegrationRow
                            logo={<SlackLogo />}
                            name="Slack"
                            description="Instant alerts for critical CVEs and scan completions"
                            logoColor="#E01E5A"
                            connected={isConnected("slack")}
                            comingSoon
                        />
                        <IntegrationRow
                            logo={<PagerDutyLogo />}
                            name="PagerDuty"
                            description="Escalate Critical findings as on-call incidents"
                            logoColor="#06AC38"
                            connected={isConnected("pagerduty")}
                            comingSoon
                        />
                    </Section>
                </div>
            </div>
        </div>
        </>
    );
}
