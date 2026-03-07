"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Layers, Github, GitBranch, Lock, Globe, X, Settings, ChevronDown, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getRepositories } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type GhRepo = {
    id: string;
    name: string;
    description?: string;
    private: boolean;
    url: string;
    default_branch?: string;
    language?: string;
    stars?: number;
    provider: string;
};

const PROVIDERS = [
    { id: 'github', label: 'GitHub' },
    { id: 'gitlab', label: 'GitLab' },
    { id: 'bitbucket', label: 'Bitbucket' },
];

export default function RepositoriesPage() {
    const [loading, setLoading] = useState(true);
    const [repositories, setRepositories] = useState<any[]>([]);
    const { activeWorkspace } = useWorkspace();

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string>('github');
    const [search, setSearch] = useState('');
    const [fetchingRepos, setFetchingRepos] = useState(false);
    const [availableRepos, setAvailableRepos] = useState<GhRepo[]>([]);
    const [addingRepos, setAddingRepos] = useState<Set<string>>(new Set());
    const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

    // Pagination settings
    const [currentPage, setCurrentPage] = useState(1);
    const reposPerPage = 20;

    // Load saved repositories
    useEffect(() => {
        const fetchRepositories = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const data = await getRepositories(activeWorkspace.id);
                setRepositories(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRepositories();
    }, [activeWorkspace]);

    // Check which providers are connected
    useEffect(() => {
        const checkIntegrations = async () => {
            if (!activeWorkspace) return;
            const { data } = await supabase
                .from('integrations')
                .select('provider')
                .eq('organization_id', activeWorkspace.id);
            if (data) setConnectedProviders(data.map((r: any) => r.provider));
        };
        checkIntegrations();
    }, [activeWorkspace]);

    // Fetch repos from selected provider
    const loadRepos = useCallback(async (provider: string, searchTerm: string) => {
        if (!activeWorkspace) return;
        setFetchingRepos(true);
        setAvailableRepos([]);
        try {
            const res = await fetch(`/api/repos?org=${activeWorkspace.id}&provider=${provider}&search=${encodeURIComponent(searchTerm)}`);
            const { repos, error } = await res.json();
            if (error) {
                setAvailableRepos([]);
            } else {
                setAvailableRepos(repos || []);
            }
        } catch {
            setAvailableRepos([]);
        } finally {
            setFetchingRepos(false);
        }
    }, [activeWorkspace]);

    // Debounced search
    useEffect(() => {
        if (!isAddModalOpen) return;
        const t = setTimeout(() => loadRepos(activeProvider, search), 400);
        return () => clearTimeout(t);
    }, [search, activeProvider, isAddModalOpen, loadRepos]);

    // Switch provider tab
    const switchProvider = (p: string) => {
        setActiveProvider(p);
        setSearch('');
    };

    // Auto-save a newly clicked repository
    const handleAddSingleRepo = async (repo: GhRepo) => {
        if (!activeWorkspace) return;

        // Optimistically show loading state
        setAddingRepos(prev => new Set(prev).add(repo.id));

        try {
            await supabase.from('repositories').upsert(
                [{
                    organization_id: activeWorkspace.id,
                    full_name: repo.name,
                    provider: repo.provider,
                    provider_repo_id: repo.id,
                    default_branch: repo.default_branch || 'main',
                    auto_review_enabled: false,
                }],
                { onConflict: 'organization_id,provider_repo_id' }
            );

            // Re-fetch repos after adding
            const data = await getRepositories(activeWorkspace.id);
            setRepositories(data || []);
            // Intentionally keeping modal open so users can add more
        } catch (err) {
            console.error("Failed to save repo", err);
        } finally {
            setAddingRepos(prev => {
                const next = new Set(prev);
                next.delete(repo.id);
                return next;
            });
        }
    };

    // Remove repo
    const handleRemoveRepo = async (id: string) => {
        if (!confirm("Are you sure you want to remove this repository from your workspace?")) return;
        try {
            await supabase.from('repositories').delete().eq('id', id);
            setRepositories(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Failed to remove repo", err);
        }
    };

    const providerIcon = (p: string) => {
        if (p === 'github') return <Github className="h-3.5 w-3.5" />;
        if (p === 'gitlab') return <span className="text-[#FC6D26] font-bold text-xs">GL</span>;
        return <span className="text-[#2684FF] font-bold text-xs">BB</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Repositories</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1">Manage source code for white-box scanning and PR reviews.</p>
                </div>
                <button
                    onClick={() => { setIsAddModalOpen(true); loadRepos(activeProvider, ''); }}
                    className="inline-flex items-center justify-center bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Repository
                </button>
            </div>

            {/* Add Repository Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080808] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                        {/* Modal Header */}
                        <div className="p-6 pb-4 flex items-start justify-between border-b border-white/[0.06]">
                            <div>
                                <h2 className="text-xl font-syne font-bold text-white">Add Repositories</h2>
                                <p className="text-sm text-white/40 mt-1">Select from your connected integrations</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-white/30 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Provider Tabs */}
                        <div className="flex items-center gap-1 px-6 pt-4 pb-2">
                            {PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => switchProvider(p.id)}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${activeProvider === p.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:text-white'
                                        } ${!connectedProviders.includes(p.id) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    disabled={!connectedProviders.includes(p.id)}
                                >
                                    {providerIcon(p.id)}
                                    {p.label}
                                    {!connectedProviders.includes(p.id) && <span className="text-[10px] text-white/30">(not connected)</span>}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="px-6 py-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search repositories..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Repo List */}
                        <div className="px-6 pb-4 flex-1 overflow-y-auto min-h-[240px]">
                            {fetchingRepos ? (
                                <div className="flex items-center justify-center h-40 text-white/30">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    <span className="text-sm">Loading repositories...</span>
                                </div>
                            ) : availableRepos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <Layers className="h-8 w-8 text-white/20 mb-2" />
                                    <p className="text-sm text-white/40">
                                        {connectedProviders.includes(activeProvider)
                                            ? 'No repositories found'
                                            : `Connect ${PROVIDERS.find(p => p.id === activeProvider)?.label} first`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableRepos.map(repo => {
                                        const isAdded = repositories.some(r => r.provider_repo_id === repo.id);
                                        const isAdding = addingRepos.has(repo.id);

                                        return (
                                            <button
                                                key={repo.id}
                                                onClick={() => handleAddSingleRepo(repo)}
                                                disabled={isAdding || isAdded}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isAdded
                                                    ? 'bg-emerald-400/5 border border-emerald-400/10 cursor-default'
                                                    : 'hover:bg-white/[0.04] border border-transparent disabled:opacity-50 disabled:cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="shrink-0 text-white/50">
                                                        {repo.private ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{repo.name}</p>
                                                        {repo.description && (
                                                            <p className="text-xs text-white/35 truncate mt-0.5">{repo.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                                    {repo.language && (
                                                        <span className="text-[10px] text-white/30 font-mono">{repo.language}</span>
                                                    )}
                                                    {isAdded ? (
                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                    ) : isAdding ? (
                                                        <Loader2 className="h-4 w-4 text-[var(--color-cyan)] animate-spin" />
                                                    ) : (
                                                        <Plus className="h-4 w-4 text-white/30 hover:text-white transition-colors" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 bg-black/30 border-t border-white/[0.06] flex items-center justify-between">
                            <Link href="/dashboard/integrations" className="flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors">
                                <Settings className="h-4 w-4" />
                                Manage integrations
                            </Link>
                            <button onClick={() => setIsAddModalOpen(false)} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors border border-white/5">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search filter for existing repos */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                    <input
                        type="text"
                        placeholder="Filter added repositories..."
                        className="w-full bg-[var(--color-bgCard)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#A855F7] transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden shadow-xl border border-[var(--color-border)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/40 border-b border-[var(--color-border)] font-syne text-[var(--color-textMuted)]">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Repository</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Issues</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Auto-Review</th>
                                <th className="px-6 py-4 font-medium tracking-wider text-xs flex items-center gap-1 border-r-0">Last Tested <ChevronDown className="h-3 w-3 inline-block" /></th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-textMuted)]">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        Loading repositories...
                                    </td>
                                </tr>
                            ) : repositories.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <Layers className="h-10 w-10 text-[var(--color-textMuted)] mb-4" />
                                            <h3 className="text-lg font-syne font-medium text-white mb-2">No repositories connected</h3>
                                            <p className="text-[var(--color-textSecondary)] max-w-sm mx-auto mb-6">
                                                Click <strong>Add Repository</strong> to pick repos from your connected GitHub, GitLab, or Bitbucket account.
                                            </p>
                                            <button
                                                onClick={() => { setIsAddModalOpen(true); loadRepos(activeProvider, ''); }}
                                                className="inline-flex items-center gap-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100"
                                            >
                                                <Plus className="h-4 w-4" /> Add Repository
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                repositories
                                    .slice((currentPage - 1) * reposPerPage, currentPage * reposPerPage)
                                    .map((repo) => (
                                        <tr key={repo.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <Link href={`/dashboard/repositories/${repo.id}`} className="font-medium text-white flex items-center gap-2 hover:text-[#A855F7] transition-colors w-fit">
                                                    {repo.provider === 'github' ? <Github className="h-4 w-4" /> : <GitBranch className="h-4 w-4 text-[var(--color-textMuted)]" />}
                                                    {repo.full_name || repo.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-textMuted)]">—</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-[var(--color-textSecondary)]">
                                                    {repo.auto_review_enabled ? (
                                                        <><div className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" /> Enabled</>
                                                    ) : (
                                                        <><div className="h-1.5 w-1.5 rounded-full bg-[var(--color-textMuted)]" /> Disabled</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-textMuted)]">—</td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveRepo(repo.id);
                                                    }}
                                                    className="text-[var(--color-textMuted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-red-400/10"
                                                    title="Remove repository"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {repositories.length > reposPerPage && (
                    <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-black/20">
                        <span className="text-sm text-[var(--color-textMuted)] font-syne">
                            Showing {((currentPage - 1) * reposPerPage) + 1} to {Math.min(currentPage * reposPerPage, repositories.length)} of {repositories.length} repos
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm text-white bg-white/5 border border-white/10 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(repositories.length / reposPerPage), p + 1))}
                                disabled={currentPage >= Math.ceil(repositories.length / reposPerPage)}
                                className="px-3 py-1 text-sm text-white bg-white/5 border border-white/10 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
