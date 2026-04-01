"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight, Users, GitBranch, Globe,
    Plug, Settings, Check, ExternalLink, Zap
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── SVG Brand Logos ──────────────────────────────────────────────────────────
const SlackLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
);

const MSTeamsLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M20.625 7.594a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75zm0 1.125c-2.45 0-4.5 1.725-4.5 4.5v5.625c0 .623.502 1.125 1.125 1.125H24V13.22c0-2.775-1.5-4.5-3.375-4.5zM9 9.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM1.5 21.188V13.5C1.5 10.575 4.2 8.25 9 8.25s7.5 2.325 7.5 5.25v7.688c0 .62-.505 1.124-1.125 1.124H2.624A1.125 1.125 0 0 1 1.5 21.188z" fill="#5059C9"/>
    </svg>
);

const EmailLogo = () => (
    <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
    </div>
);

const JiraLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.132v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.024-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.486V1.005A1.001 1.001 0 0 0 23.013 0z" fill="#2684FF"/>
    </svg>
);

const LinearLogo = () => (
    <svg viewBox="0 0 100 100" className="h-6 w-6">
        <defs>
            <linearGradient id="lg-settings" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B61FF"/>
                <stop offset="100%" stopColor="#5E4DCA"/>
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#lg-settings)"/>
        <path d="M17 63.7L36.3 83c-11.1-4-19.9-12.3-19.3-19.3zM15 57.7l27.3 27.3c2-.4 4-.9 5.9-1.7L16.7 51.8c-.8 1.9-1.3 3.9-1.7 5.9zm4.5-11.6l34.4 34.4c1.5-.7 3-1.5 4.4-2.5L22 43.7c-1 1.4-1.8 2.9-2.5 4.4zm6.5-9.3l37 37c1.3-1.1 2.5-2.3 3.6-3.5L29.6 32.5c-1.3 1.1-2.5 2.3-3.6 3.6zm9.5-7.7L68 71.5c1.4-.9 2.8-2 4-3.1L38.6 25.9c-1.2 1.3-2.2 2.6-3.1 4.2zm10.5-6.1l31 31c1.2-1.5 2.3-3.1 3.2-4.8L49.2 23.5c-1.7.9-3.3 2-4.8 3.2zm11-5l23 23c.9-2 1.6-4 2.1-6.1L61 23.4c-2.1.5-4.1 1.2-6.1 2.1zm11-3.2l13.1 13.1c.3-2.1.3-4.3 0-6.5L72 14.5c-2.1-.3-4.3-.3-6.5.1z" fill="white"/>
    </svg>
);

const GitHubLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-gray-900">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
);

const GitLabLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" fill="#FC6D26"/>
    </svg>
);

const BitbucketLogo = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.52.873 1.027.873h15.386c.388 0 .72-.272.79-.655l3.263-20.03a.768.768 0 0 0-.768-.89H.778zM14.52 15.53H9.522L8.17 8.466h7.704l-1.354 7.064z" fill="#2684FF"/>
    </svg>
);

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({
    logo, name, description, connected = false, comingSoon = false,
}: {
    logo: React.ReactNode;
    name: string;
    description: string;
    connected?: boolean;
    comingSoon?: boolean;
}) {
    const [isConnected, setIsConnected] = useState(connected);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {logo}
                </div>
                {isConnected && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Connected
                    </span>
                )}
                {comingSoon && !isConnected && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
                )}
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
                onClick={() => !comingSoon && setIsConnected(v => !v)}
                disabled={comingSoon}
                className={cn(
                    "w-full py-2 text-sm font-medium rounded-lg transition-colors",
                    isConnected
                        ? "border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        : comingSoon
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                )}
            >
                {isConnected ? "Disconnect" : comingSoon ? "Coming Soon" : "Connect"}
            </button>
        </div>
    );
}

// ─── Tab Contents ─────────────────────────────────────────────────────────────
function GeneralTab({ workspace }: { workspace: any }) {
    const [orgName, setOrgName] = useState(workspace?.name || "");
    const [saved, setSaved] = useState(false);

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Organization Details</h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization name</label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                        <div className="flex">
                            <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">zentinel.dev/</span>
                            <input type="text" value={orgName.toLowerCase().replace(/\s+/g, "-")} readOnly
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-r-lg bg-gray-50 text-gray-500" />
                        </div>
                    </div>
                    <button
                        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        {saved ? "✓ Saved" : "Save changes"}
                    </button>
                </div>
            </div>
            <div className="bg-white border border-red-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h3>
                <p className="text-xs text-gray-500 mb-4">These actions are irreversible.</p>
                <button className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                    Delete organization
                </button>
            </div>
        </div>
    );
}

function UsersTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    Invite member
                </button>
            </div>
            <div className="divide-y divide-gray-100">
                <div className="flex items-center gap-4 px-6 py-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-[11px]">YO</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">You (Owner)</div>
                        <div className="text-xs text-gray-500">owner@zentinel.dev</div>
                    </div>
                    <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Owner</span>
                </div>
                <div className="px-6 py-10 flex flex-col items-center text-center">
                    <Users className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Invite your team to collaborate.</p>
                    <button className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">+ Invite people</button>
                </div>
            </div>
        </div>
    );
}

function TeamsTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No teams yet</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">Group members and assign repositories or issues to specific teams.</p>
            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Create a team</button>
        </div>
    );
}

function RepositoriesTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Manage repositories</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">Control which repositories are connected for scanning.</p>
            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Connect repository</button>
        </div>
    );
}

function DomainsTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center py-16 text-center">
            <Globe className="h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No domains configured</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">Add domains and APIs to monitor for surface-level security findings.</p>
            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Add domain</button>
        </div>
    );
}

function IntegrationsTab() {
    const categories = [
        {
            label: "Chat & Alerts",
            items: [
                { logo: <SlackLogo />, name: "Slack", description: "Get instant alerts for new critical findings and scan completions directly in your Slack channels." },
                { logo: <MSTeamsLogo />, name: "MS Teams", description: "Receive security notifications in Microsoft Teams channels for your workspace.", comingSoon: true },
                { logo: <EmailLogo />, name: "Email Forwarding", description: "Forward security alerts and weekly summaries to any email address or distribution list." },
            ],
        },
        {
            label: "Task Trackers",
            items: [
                { logo: <JiraLogo />, name: "Jira", description: "Automatically create Jira tickets for new security findings and sync their status back to Zentinel." },
                { logo: <LinearLogo />, name: "Linear", description: "Push issues directly to Linear and track remediation progress from your engineering workflow.", comingSoon: true },
            ],
        },
        {
            label: "Source Control",
            items: [
                { logo: <GitHubLogo />, name: "GitHub", description: "Connect your GitHub organization to enable SAST scanning on PRs and automatic fix suggestions.", connected: true },
                { logo: <GitLabLogo />, name: "GitLab", description: "Integrate with GitLab to scan merge requests and monitor your CI/CD pipeline for vulnerabilities." },
                { logo: <BitbucketLogo />, name: "Bitbucket", description: "Connect Bitbucket repositories to enable pull request scanning and security gate checks.", comingSoon: true },
            ],
        },
    ];

    return (
        <div className="space-y-8">
            {categories.map(cat => (
                <div key={cat.label}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.items.map(item => (
                            <IntegrationCard key={item.name} {...item} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
    { id: "general",      label: "General" },
    { id: "users",        label: "Users" },
    { id: "teams",        label: "Teams" },
    { id: "repositories", label: "Repositories" },
    { id: "domains",      label: "Domains & APIs" },
    { id: "integrations", label: "Integrations" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { activeWorkspace } = useWorkspace();
    const [activeTab, setActiveTab] = useState("general");
    const [repoCount, setRepoCount] = useState(0);
    const [memberCount, setMemberCount] = useState(1);

    useEffect(() => {
        if (!activeWorkspace) return;
        supabase
            .from("repositories")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", activeWorkspace.id)
            .then(({ count }) => setRepoCount(count || 0));
        supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", activeWorkspace.id)
            .then(({ count }) => setMemberCount(count || 1));
    }, [activeWorkspace]);

    const wsName = activeWorkspace?.name || "Organization";
    const plan = activeWorkspace?.plan || "free";
    const planLabel = plan === "starter" ? "Pro trial" : plan === "free" ? "Free" : plan.charAt(0).toUpperCase() + plan.slice(1);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>Settings</span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-gray-900 font-medium">Organization</span>
                </div>

                {/* Hero */}
                <div className="flex items-end justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{wsName}</h1>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {repoCount} active {repoCount === 1 ? "repo" : "repos"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium rounded-full">
                                <Users className="h-3 w-3" />
                                {memberCount} {memberCount === 1 ? "member" : "members"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium rounded-full">
                                <Zap className="h-3 w-3" />
                                {planLabel}
                            </span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        View docs
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex items-center overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
                                    activeTab === tab.id
                                        ? "border-purple-600 text-purple-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === "general"      && <GeneralTab workspace={activeWorkspace} />}
                    {activeTab === "users"        && <UsersTab />}
                    {activeTab === "teams"        && <TeamsTab />}
                    {activeTab === "repositories" && <RepositoriesTab />}
                    {activeTab === "domains"      && <DomainsTab />}
                    {activeTab === "integrations" && <IntegrationsTab />}
                </div>
            </div>
        </div>
    );
}
