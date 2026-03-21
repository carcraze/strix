"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Layers, Github, GitBranch, Lock, Globe, X, Settings, ChevronDown, Check, Loader2, Play } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
            const res = await fetch('/api/repos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: activeWorkspace.id,
                    provider: repo.provider,
                    repoId: repo.id,
                    repoName: repo.name,
                    defaultBranch: repo.default_branch || 'main'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                if (typeof showToast === 'function') showToast(`❌ Failed to connect repo: ${err.error || 'Unknown error'}`);
                throw new Error(err.error);
            }

            if (typeof showToast === 'function') showToast(`✅ Repository connected securely.`);

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
    const handleRemoveRepo = async (repo: any) => {
        if (!activeWorkspace) return;
        if (!confirm("Are you sure you want to remove this repository from your workspace and delete its webhook?")) return;
        try {
            const res = await fetch('/api/repos', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: activeWorkspace.id,
                    provider: repo.provider,
                    repoId: repo.provider_repo_id,
                    repoName: repo.full_name || repo.name
                })
            });

            if (!res.ok) {
                const err = await res.json();
                if (typeof showToast === 'function') showToast(`❌ Failed to remove repo: ${err.error || 'Unknown error'}`);
                throw new Error(err.error);
            }

            if (typeof showToast === 'function') showToast(`✅ Repository removed.`);

            setRepositories(prev => prev.filter(r => r.id !== repo.id));
        } catch (err) {
            console.error("Failed to remove repo", err);
        }
    };

    const handleToggleAutoReview = async (repoId: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('repositories')
                .update({ auto_review_enabled: !current })
                .eq('id', repoId);
            
            if (error) throw error;
            setRepositories(prev => prev.map(r => r.id === repoId ? { ...r, auto_review_enabled: !current } : r));
        } catch (err) {
            console.error("Failed to toggle auto review", err);
        }
    };

    const [scanModal, setScanModal] = useState<{ repo: any, prs: any[] } | null>(null);
    const [scanMode, setScanMode] = useState<'pr' | 'full_repo'>('pr');
    const [scanInput, setScanInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [fetchingPRs, setFetchingPRs] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleScanNow = async (repo: any) => {
        setFetchingPRs(true);
        // Temporarily open with empty PRs while fetching
        setScanModal({ repo, prs: [] });
        setScanMode('pr');
        setScanInput('');
        
        try {
            const provider = repo.provider || 'github';
            const res = await fetch(`/api/repos/prs?repo=${repo.id}&provider=${provider}&org=${activeWorkspace?.id}`);
            if (res.ok) {
                const data = await res.json();
                setScanModal({ repo, prs: data.prs || [] });
                // auto select first PR if exists
                if (data.prs && data.prs.length > 0) {
                    setScanInput(data.prs[0].number.toString());
                }
            } else {
                showToast(`❌ Failed to fetch open PRs for this repository`);
            }
        } catch {
            showToast('❌ Network error while fetching PRs');
        } finally {
            setFetchingPRs(false);
        }
    };

    const submitManualScan = async () => {
        if (!scanModal) return;
        
        const provider = scanModal.repo.provider || 'github';
        if (!connectedProviders.includes(provider)) {
            showToast('❌ Connect your repository first');
            return;
        }

        if (scanMode === 'pr' && (!scanInput || parseInt(scanInput, 10) <= 0)) {
            showToast('❌ Please enter a valid PR number');
            return;
        }

        setScanning(true);
        try {
            const body: any = {
                repo_id: scanModal.repo.id,
                provider: provider,
                trigger: scanMode === 'full_repo' ? 'full_repo' : 'manual',
            };
            if (scanMode === 'pr') {
                body.pr_number = parseInt(scanInput, 10);
            } else {
                body.branch_name = scanModal.repo.default_branch || 'main';
            }

            const res = await fetch('/api/pr-reviews/manual-launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setScanModal(null);
                showToast('✅ Scan queued — results will appear in the PR Reviews feed.');
            } else {
                const err = await res.json();
                showToast(`❌ ${err.error || 'Failed to queue scan'}`);
            }
        } catch {
            showToast('❌ Network error, please try again.');
        } finally {
            setScanning(false);
        }
    };

    const providerIcon = (p: string) => {
        if (p === 'github') return <Github className="h-3.5 w-3.5" />;
        if (p === 'gitlab') return <span className="text-[#FC6D26] font-bold text-xs">GL</span>;
        return <span className="text-[#2684FF] font-bold text-xs">BB</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-[100] bg-[#111] border border-white/10 text-white text-sm px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300 max-w-sm">
                    {toast}
                </div>
            )}

            {/* Scan Now Modal */}
            {scanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080808] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 pb-4 flex items-start justify-between border-b border-white/[0.06]">
                            <div>
                                <h2 className="text-xl font-syne font-bold text-white">Manual Scan</h2>
                                <p className="text-sm text-white/40 mt-1 font-mono truncate max-w-xs">{scanModal.repo.full_name}</p>
                            </div>
                            <button onClick={() => setScanModal(null)} className="text-white/30 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Mode toggle */}
                            <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
                                <button
                                    onClick={() => { setScanMode('pr'); setScanInput(''); }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${scanMode === 'pr' ? 'bg-white text-black' : 'bg-transparent text-white/50 hover:text-white'}`}
                                >
                                    PR Scan
                                </button>
                                <button
                                    onClick={() => { setScanMode('full_repo'); setScanInput(''); }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${scanMode === 'full_repo' ? 'bg-white text-black' : 'bg-transparent text-white/50 hover:text-white'}`}
                                >
                                    Full Repo Scan
                                </button>
                            </div>
                                                {/* Input */}
                            {scanMode === 'pr' ? (
                                fetchingPRs ? (
                                    <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/50 flex flex-row items-center font-mono">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Fetching open pull requests...
                                    </div>
                                ) : scanModal.prs.length === 0 ? (
                                    <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-red-400 font-mono">
                                        No open pull requests found — Please open a PR on {scanModal.repo.provider} first to begin a security review.
                                    </div>
                                ) : (
                                    <select
                                        value={scanInput}
                                        onChange={e => setScanInput(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors appearance-none font-mono"
                                    >
                                        <option value="" disabled>Select an open PR...</option>
                                        {scanModal.prs.map((pr: any) => (
                                            <option key={pr.number} value={pr.number} className="bg-[#111] text-white">
                                                #{pr.number}: {pr.title}
                                            </option>
                                        ))}
                                    </select>
                                )
                            ) : (
                                <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/50 font-mono">
                                    Full repository scan on default branch ({scanModal.repo.default_branch || 'main'})
                                </div>
                            )}
                            <p className="text-xs text-white/30">
                                {scanMode === 'pr'
                                    ? 'Select an open pull request to run a security review.'
                                    : 'Perform a full deep scan of the entire repository codebase. Results will appear in the Issues dashboard.'}
                            </p>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setScanModal(null)}
                                className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitManualScan}
                                disabled={(scanMode === 'pr' && !scanInput) || scanning}
                                className="flex-1 py-2 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                {scanning ? 'Queuing...' : 'Launch Scan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Auto-Review</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right border-r-0">Actions</th>
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
                                                <div className="text-xs text-[var(--color-textMuted)] mt-1 ml-6">
                                                    Branch: {repo.default_branch || 'main'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {repo.auto_review_enabled ? (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-white/5 text-white/40 border-white/10">
                                                        Disabled
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Switch 
                                                        checked={!!repo.auto_review_enabled} 
                                                        onCheckedChange={() => handleToggleAutoReview(repo.id, !!repo.auto_review_enabled)}
                                                        className="data-[state=checked]:bg-[#A855F7]"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleScanNow(repo)}
                                                        className="inline-flex items-center gap-1.5 text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors border border-white/5"
                                                    >
                                                        <Play className="h-3 w-3" /> Scan now
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleRemoveRepo(repo);
                                                        }}
                                                        className="text-[var(--color-textMuted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded hover:bg-red-400/10"
                                                        title="Remove repository"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
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
