"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Globe, CheckCircle2, AlertTriangle, MoreVertical, X, Copy, Trash2, ShieldCheck, Loader2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getDomains, addDomain } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

function generateTxtToken(domain: string) {
    return `zentinel-verify=${btoa(domain + Date.now()).slice(0, 32)}`;
}

export default function DomainsPage() {
    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;
    const { activeWorkspace } = useWorkspace();

    // Add modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDomainString, setNewDomainString] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [newDomainType, setNewDomainType] = useState('web_application');
    const [newDomainContext, setNewDomainContext] = useState('');
    const [isCheckingReachability, setIsCheckingReachability] = useState(false);
    const [isReachable, setIsReachable] = useState<boolean | null>(null);
    const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);

    // Verification instructions modal (shown right after adding)
    const [verifyDomain, setVerifyDomain] = useState<{ domain: string; token: string; id: string } | null>(null);
    const [verifyTab, setVerifyTab] = useState<'dns' | 'file' | 'meta'>('dns');
    const [copied, setCopied] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Three-dot dropdown state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchDomains = async () => {
        if (!activeWorkspace) return;
        setLoading(true);
        try {
            const data = await getDomains(activeWorkspace.id);
            setDomains(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, [activeWorkspace]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Reachability check via API
    useEffect(() => {
        let isMounted = true;
        let pinger: NodeJS.Timeout;

        const checkDomain = async () => {
            if (newDomainString.length > 3 && newDomainString.includes('.')) {
                setIsCheckingReachability(true);
                setIsReachable(null);

                try {
                    const res = await fetch(`/api/ping?domain=${encodeURIComponent(newDomainString)}`);
                    const data = await res.json();
                    if (isMounted) {
                        setIsReachable(data.reachable);
                        if (data.reachable) {
                            setIsMoreDetailsOpen(true);
                        }
                    }
                } catch (e) {
                    if (isMounted) setIsReachable(false);
                } finally {
                    if (isMounted) setIsCheckingReachability(false);
                }
            } else {
                setIsCheckingReachability(false);
                setIsReachable(null);
                setIsMoreDetailsOpen(false);
            }
        };

        pinger = setTimeout(checkDomain, 800);
        return () => { isMounted = false; clearTimeout(pinger); };
    }, [newDomainString]);

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !newDomainString) return;
        setIsSaving(true);
        try {
            const token = generateTxtToken(newDomainString);
            // Save verification_token to DB alongside the domain
            const { data, error } = await supabase.from('domains').insert({
                organization_id: activeWorkspace.id,
                domain: newDomainString,
                verified: false,
                type: 'web_application',
                verification_token: token,
                verification_method: 'dns_txt'
            }).select().single();

            if (error) throw error;

            setNewDomainString("");
            setIsAddModalOpen(false);
            setVerifyDomain({ domain: data.domain, token, id: data.id });
            fetchDomains();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to add domain.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyToken = (token: string) => {
        navigator.clipboard.writeText(`zentinel-verify TXT "${token}"`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this domain?")) return;
        setOpenMenuId(null);
        try {
            await supabase.from('domains').delete().eq('id', id);
            setDomains(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckVerification = async (domain: any) => {
        setOpenMenuId(null);
        // Optimistically open the verify instructions modal so DNS can be added
        setVerifyDomain({ domain: domain.domain, token: domain.verification_token || generateTxtToken(domain.domain), id: domain.id });
    };

    const filteredDomains = domains.filter(d =>
        d.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filteredDomains.length / PAGE_SIZE));
    const paginatedDomains = filteredDomains.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex-1 w-full bg-[#050505] p-8 overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Domains &amp; APIs</h1>
                        <p className="text-(--color-textSecondary) mt-1">Manage verified attack surfaces and web applications.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Domain
                    </button>
                </div>

                {/* Add Domain Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-[#050505] border border-(--color-border) rounded-xl w-full max-w-md shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-syne font-bold text-white mb-1">Add Domain</h2>
                                    <p className="text-sm text-(--color-textSecondary)">Enter a domain or API to monitor and test</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-(--color-textMuted) hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddDomain} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-(--color-textSecondary) mb-2">Domain</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            placeholder="api.example.com"
                                            value={newDomainString}
                                            onChange={(e) => setNewDomainString(e.target.value)}
                                            className={`w-full bg-transparent border ${isReachable ? 'border-(--color-green)' : 'border-(--color-border)'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-(--color-cyan) transition-colors pr-10`}
                                        />
                                        {isCheckingReachability && (
                                            <Loader2 className="h-4 w-4 animate-spin text-(--color-textMuted) absolute right-3 top-1/2 -translate-y-1/2" />
                                        )}
                                        {isReachable && !isCheckingReachability && (
                                            <CheckCircle2 className="h-4 w-4 text-(--color-green) absolute right-3 top-1/2 -translate-y-1/2" />
                                        )}
                                        {isReachable === false && !isCheckingReachability && (
                                            <X className="h-4 w-4 text-(--color-red) absolute right-3 top-1/2 -translate-y-1/2" />
                                        )}
                                    </div>
                                    {isReachable === true && (
                                        <p className="text-xs text-(--color-green) mt-1.5">Domain is reachable</p>
                                    )}
                                    {isReachable === false && (
                                        <p className="text-xs text-(--color-red) mt-1.5">Domain is not reachable</p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsMoreDetailsOpen(!isMoreDetailsOpen)}
                                        className="text-sm font-medium text-(--color-textMuted) flex items-center gap-1 hover:text-white transition-colors mb-4"
                                    >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isMoreDetailsOpen ? 'rotate-180' : ''}`} /> More details
                                    </button>

                                    {isMoreDetailsOpen && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div>
                                                <label className="block text-sm font-medium text-(--color-textSecondary) mb-2">Type</label>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: 'web_application', label: 'Web Application' },
                                                        { id: 'api', label: 'API' },
                                                        { id: 'attack_surface', label: 'Attack Surface' }
                                                    ].map(type => (
                                                        <label key={type.id} className="flex items-center gap-3 p-3 rounded-lg border border-(--color-border) cursor-pointer hover:bg-white/5 transition-colors">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newDomainType === type.id ? 'border-(--color-cyan)' : 'border-(--color-textMuted)'}`}>
                                                                {newDomainType === type.id && <div className="w-2 h-2 rounded-full bg-(--color-cyan)" />}
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                name="domainType"
                                                                value={type.id}
                                                                checked={newDomainType === type.id}
                                                                onChange={() => setNewDomainType(type.id)}
                                                                className="hidden"
                                                            />
                                                            <span className="text-sm text-white font-medium">{type.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-(--color-textSecondary) mb-2">Context <span className="text-(--color-textMuted)">(optional)</span></label>
                                                <textarea
                                                    placeholder="What does this app do? Tech stack, auth, sensitive data it handles..."
                                                    value={newDomainContext}
                                                    onChange={(e) => setNewDomainContext(e.target.value)}
                                                    className="w-full bg-transparent border border-(--color-border) rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-(--color-textSecondary) transition-colors min-h-[80px] resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-(--color-border)">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-white hover:text-gray-300 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving || !newDomainString}
                                        className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : "Add Domain"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Verification Instructions Modal */}
                {verifyDomain && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-[#050505] border border-(--color-border) rounded-xl w-full max-w-xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-xl font-syne font-bold text-white">Domain Added</h2>
                                <button onClick={() => setVerifyDomain(null)} className="text-(--color-textMuted) hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-(--color-textSecondary) mb-6">Verify domain ownership using DNS, file upload, or meta tag</p>

                            <div className="bg-[#1A1500] border border-[#332A00] rounded-lg p-3 mb-6 flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-[#FFB800]" />
                                <p className="text-sm text-[#FFB800] font-medium"><span className="font-bold">{verifyDomain.domain}</span> added — verification pending</p>
                            </div>

                            <div className="flex bg-white/5 p-1 rounded-lg mb-6">
                                {(['dns', 'file', 'meta'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setVerifyTab(tab)}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${verifyTab === tab ? 'bg-white/10 text-white' : 'text-(--color-textMuted) hover:text-white'}`}
                                    >
                                        {tab === 'dns' ? 'DNS Record' : tab === 'file' ? 'File Upload' : 'Meta Tag'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 mb-8">
                                {verifyTab === 'dns' && (
                                    <div className="animate-in fade-in">
                                        <p className="text-sm text-(--color-textSecondary) mb-4">Add a DNS <span className="font-bold text-white">TXT</span> record to verify ownership:</p>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-(--color-textMuted) mb-1.5">Record name</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-(--color-border) rounded-lg px-4 py-2.5">
                                                    <code className="text-sm text-white font-mono break-all">_zentinel-verification.{verifyDomain.domain}</code>
                                                    <button onClick={() => handleCopyToken(`_zentinel-verification.${verifyDomain.domain}`)} className="text-(--color-textMuted) hover:text-white transition-colors ml-2">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-(--color-textMuted) mb-1.5">Record value</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-(--color-border) rounded-lg px-4 py-2.5">
                                                    <code className="text-sm text-white font-mono break-all">{verifyDomain.token}</code>
                                                    <button onClick={() => handleCopyToken(verifyDomain.token)} className="text-(--color-textMuted) hover:text-white transition-colors ml-2">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-(--color-textMuted)">Propagation might take 2-10 minutes.</p>
                                        </div>
                                    </div>
                                )}

                                {verifyTab === 'file' && (
                                    <div className="animate-in fade-in">
                                        <p className="text-sm text-(--color-textSecondary) mb-4">Upload a verification file to your domain's <span className="font-mono text-white">.well-known</span> directory:</p>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-(--color-textMuted) mb-1.5">File URL</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-(--color-border) rounded-lg px-4 py-2.5">
                                                    <code className="text-sm text-white font-mono break-all">https://{verifyDomain.domain}/.well-known/zentinel-verify.txt</code>
                                                    <button onClick={() => handleCopyToken(`https://${verifyDomain.domain}/.well-known/zentinel-verify.txt`)} className="text-(--color-textMuted) hover:text-white transition-colors ml-2">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-(--color-textMuted) mb-1.5">File content</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-(--color-border) rounded-lg px-4 py-2.5">
                                                    <code className="text-sm text-white font-mono break-all">{verifyDomain.token}</code>
                                                    <button onClick={() => handleCopyToken(verifyDomain.token)} className="text-(--color-textMuted) hover:text-white transition-colors ml-2">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-(--color-textMuted)">Create the file at <span className="font-mono text-white">/.well-known/zentinel-verify.txt</span> with the content above</p>
                                        </div>
                                    </div>
                                )}

                                {verifyTab === 'meta' && (
                                    <div className="animate-in fade-in">
                                        <p className="text-sm text-(--color-textSecondary) mb-4">Add a <span className="font-bold text-white">meta tag</span> to your homepage's <code className="font-mono text-white">&lt;head&gt;</code>:</p>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-(--color-textMuted) mb-1.5">Meta tag</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-(--color-border) rounded-lg px-4 py-2.5">
                                                    <code className="text-sm text-white font-mono break-all">&lt;meta name="zentinel-verification" content="{verifyDomain.token}"&gt;</code>
                                                    <button onClick={() => handleCopyToken(`<meta name="zentinel-verification" content="${verifyDomain.token}">`)} className="text-(--color-textMuted) hover:text-white transition-colors ml-2">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-(--color-textMuted)">Place this tag in the <code className="font-mono text-white">&lt;head&gt;</code> section of your homepage at <span className="font-bold text-white">{verifyDomain.domain}</span>.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Simulated Verification Error Space */}
                            <div className="min-h-[24px] mb-4">
                                {verifyError && (
                                    <p className="text-sm text-(--color-red) animate-in fade-in slide-in-from-bottom-1">{verifyError}</p>
                                )}
                                {isVerifying && (
                                    <p className="text-sm text-(--color-textMuted) animate-pulse">Checking verification...</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-(--color-border)">
                                <button type="button" onClick={() => setVerifyDomain(null)} className="px-5 py-2.5 text-sm font-bold text-white hover:text-gray-300 transition-colors">
                                    Skip
                                </button>
                                <button
                                    type="button"
                                    disabled={isVerifying}
                                    onClick={() => {
                                        setIsVerifying(true);
                                        setVerifyError(null);
                                        // Simulate network check
                                        setTimeout(() => {
                                            setIsVerifying(false);
                                            setVerifyError("Verification not detected. Ensure your DNS record, file, or meta tag is configured and try again.");
                                        }, 2500);
                                    }}
                                    className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Verify Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-textMuted)" />
                    <input
                        type="text"
                        placeholder="Search domains..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-(--color-bgCard) border border-(--color-border) rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-(--color-cyan) transition-colors"
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-20 text-(--color-textMuted)">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                        <p>Loading domains...</p>
                    </div>
                ) : filteredDomains.length === 0 ? (
                    <div className="bg-[#0A0A0A] border border-(--color-border) rounded-xl overflow-hidden mt-6 shadow-sm">
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-(--color-border) flex items-center justify-center mb-4">
                                <Globe className="h-6 w-6 text-(--color-textMuted)" />
                            </div>
                            <h3 className="text-lg font-syne font-medium text-white mb-2">
                                {searchQuery ? "No matching domains" : "No domains"}
                            </h3>
                            <p className="text-(--color-textMuted) text-sm mb-6">
                                {searchQuery ? "Try a different search term." : "Add your first domain to get started"}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="inline-flex items-center justify-center bg-white text-black font-bold py-2 px-5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Add Domain
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0A0A0A] border border-(--color-border) rounded-xl overflow-hidden mt-6 shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-(--color-border) text-[0.65rem] uppercase tracking-wider text-(--color-textMuted) font-mono bg-[#0D0D0D]">
                                    <th className="px-6 py-4 font-semibold w-[40%]">DOMAIN</th>
                                    <th className="px-6 py-4 font-semibold w-[30%]">ISSUES</th>
                                    <th className="px-6 py-4 font-semibold w-[30%]">Last Tested <ChevronDown className="inline h-3 w-3 ml-1" /></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {paginatedDomains.map((domain) => (
                                    <tr
                                        key={domain.id}
                                        className="border-b border-(--color-border) last:border-0 hover:bg-[#111111] transition-colors cursor-pointer group"
                                        onClick={() => window.location.href = `/dashboard/domains/${domain.id}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <Globe className="h-4 w-4 text-(--color-textMuted)" />
                                                    <span className="font-medium text-white group-hover:text-(--color-cyan) transition-colors">{domain.domain}</span>
                                                    {/* Inline Status */}
                                                    {domain.verified ? (
                                                        <div className="flex items-center gap-1 mt-0.5 ml-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-(--color-green)" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-(--color-yellow) ml-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider">Not verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-(--color-textMuted)">
                                            —
                                        </td>
                                        <td className="px-6 py-4 text-(--color-textMuted)">
                                            —
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1A1A1A]">
                                <span className="text-xs text-white/40">
                                    {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDomains.length)} of {filteredDomains.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 transition-colors text-white/60"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs text-white/50 px-2">{currentPage} / {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 transition-colors text-white/60"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
