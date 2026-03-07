'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert, Activity,
    Settings, Globe, Trash2, Copy, Loader2, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Domain {
    id: string;
    domain: string;
    type: string;
    context: string | null;
    verified: boolean;
    verification_token: string | null;
    verification_method: string | null;
    verified_at: string | null;
    created_at: string;
    organization_id: string;
}

interface Issue {
    id: string;
    title: string;
    severity: string;
    status: string;
    found_at: string;
    pentest_id: string | null;
}

interface Pentest {
    id: string;
    name: string;
    status: string;
    created_at: string;
    completed_at: string | null;
}

const SEVERITY_STYLES: Record<string, string> = {
    CRITICAL: 'text-[#FF4444] bg-[#FF4444]/10 border-[#FF4444]/20',
    HIGH: 'text-[#FF8C00] bg-[#FF8C00]/10 border-[#FF8C00]/20',
    MEDIUM: 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20',
    LOW: 'text-[#00B4FF] bg-[#00B4FF]/10 border-[#00B4FF]/20',
    INFO: 'text-[#A0A0A0] bg-white/5 border-white/10',
};

export default function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'issues' | 'tests' | 'settings'>('issues');

    const [domain, setDomain] = useState<Domain | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [pentests, setPentests] = useState<Pentest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verify now state
    const [verifyTab, setVerifyTab] = useState<'dns' | 'file' | 'meta'>('dns');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch domain
                const { data: dom, error: domErr } = await supabase
                    .from('domains')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (domErr || !dom) {
                    setError('Domain not found.');
                    setLoading(false);
                    return;
                }
                setDomain(dom);

                // Fetch issues linked to this domain
                const { data: iss } = await supabase
                    .from('issues')
                    .select('id, title, severity, status, found_at, pentest_id')
                    .eq('domain_id', id)
                    .order('found_at', { ascending: false });
                setIssues(iss || []);

                // Fetch pentests linked via pentest_targets
                const { data: targets } = await supabase
                    .from('pentest_targets')
                    .select('pentest_id')
                    .eq('domain_id', id);

                if (targets && targets.length > 0) {
                    const pentestIds = targets.map((t: any) => t.pentest_id).filter(Boolean);
                    const { data: pts } = await supabase
                        .from('pentests')
                        .select('id, name, status, created_at, completed_at')
                        .in('id', pentestIds)
                        .order('created_at', { ascending: false });
                    setPentests(pts || []);
                }
            } catch (e: any) {
                setError(e.message || 'Failed to load domain.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

    const handleVerifyNow = async () => {
        if (!domain) return;
        setIsVerifying(true);
        setVerifyError(null);
        setVerifySuccess(null);
        try {
            const res = await fetch('/api/verify-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domainId: domain.id }),
            });
            const data = await res.json();
            if (data.success) {
                setVerifySuccess(data.message || 'Domain verified!');
                // Refresh domain to show verified state
                setDomain(prev => prev ? { ...prev, verified: true, verification_method: data.method } : prev);
            } else {
                setVerifyError(data.error || 'Verification failed. Please try again.');
            }
        } catch {
            setVerifyError('Network error. Please check your connection and try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDelete = async () => {
        if (!domain) return;
        if (!confirm(`Are you sure you want to disconnect ${domain.domain}? This action cannot be undone.`)) return;
        await supabase.from('domains').delete().eq('id', domain.id);
        router.push('/dashboard/domains');
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#050505]">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] gap-4">
                <p className="text-[var(--color-textMuted)]">{error || 'Domain not found.'}</p>
                <button onClick={() => router.push('/dashboard/domains')} className="text-sm text-white underline">Back to Domains</button>
            </div>
        );
    }

    const statusColor = domain.verified ? 'var(--color-green)' : '#FFB800';
    const typeLabel = (domain.type || 'web_application').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    return (
        <div className="flex-1 w-full bg-[#050505] overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-[900px] mx-auto px-8 py-8">
                {/* Back */}
                <button
                    onClick={() => router.push('/dashboard/domains')}
                    className="flex items-center text-sm text-[var(--color-textMuted)] hover:text-white transition-colors mb-6 group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                    Domains
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-syne font-bold text-white tracking-tight">{domain.domain}</h1>
                        {domain.verified ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[var(--color-green)] border border-[var(--color-green)]/20 bg-[var(--color-green)]/10">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#FFB800] border border-[#FFB800]/20 bg-[#FFB800]/10">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Unverified
                            </span>
                        )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/60 border border-white/10">
                        {typeLabel}
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)] mb-8">
                    {(['issues', 'tests', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                ? 'border-white text-white'
                                : 'border-transparent text-[var(--color-textMuted)] hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab: Issues */}
                {activeTab === 'issues' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {issues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#1A1A1A] rounded-xl">
                                <div className="h-14 w-14 rounded-full bg-[var(--color-green)]/10 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-7 w-7 text-[var(--color-green)]" />
                                </div>
                                <p className="text-white font-medium">No issues yet</p>
                                <p className="text-sm text-[var(--color-textMuted)] mt-1">Run a pentest to detect vulnerabilities on this domain</p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] bg-[#0D0D0D] text-[0.65rem] uppercase tracking-wider text-[var(--color-textMuted)] font-mono">
                                            <th className="px-5 py-3 font-semibold w-[50%]">Issue</th>
                                            <th className="px-5 py-3 font-semibold">Severity</th>
                                            <th className="px-5 py-3 font-semibold">Status</th>
                                            <th className="px-5 py-3 font-semibold">Found</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issues.map(issue => (
                                            <tr
                                                key={issue.id}
                                                className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                                            >
                                                <td className="px-5 py-3.5 font-medium text-white">{issue.title}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.INFO}`}>
                                                        {issue.severity}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-[var(--color-textMuted)] capitalize">{issue.status}</td>
                                                <td className="px-5 py-3.5 text-[var(--color-textMuted)] text-xs">{new Date(issue.found_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Tests */}
                {activeTab === 'tests' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {pentests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#1A1A1A] rounded-xl">
                                <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Activity className="h-7 w-7 text-[var(--color-textMuted)]" />
                                </div>
                                <p className="text-white font-medium">No tests yet</p>
                                <p className="text-sm text-[var(--color-textMuted)] mt-1">Start a pentest to see results here</p>
                                <button onClick={() => router.push('/dashboard/pentests/new')} className="mt-5 px-5 py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors">
                                    Start Test
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] bg-[#0D0D0D] text-[0.65rem] uppercase tracking-wider text-[var(--color-textMuted)] font-mono">
                                            <th className="px-5 py-3 font-semibold w-[50%]">Test Name</th>
                                            <th className="px-5 py-3 font-semibold">Status</th>
                                            <th className="px-5 py-3 font-semibold">Started</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pentests.map(pt => (
                                            <tr
                                                key={pt.id}
                                                className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => router.push(`/dashboard/pentests/${pt.id}`)}
                                            >
                                                <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2">
                                                    {pt.name} <ExternalLink className="h-3.5 w-3.5 text-[var(--color-textMuted)]" />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pt.status === 'completed' ? 'text-[var(--color-green)] border-[var(--color-green)]/20 bg-[var(--color-green)]/10' : 'text-[#FFB800] border-[#FFB800]/20 bg-[#FFB800]/10'}`}>
                                                        {pt.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-[var(--color-textMuted)] text-xs">{new Date(pt.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Settings */}
                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-6">
                        {/* Verification block - only for unverified domains */}
                        {!domain.verified && domain.verification_token && (
                            <div>
                                <h3 className="text-base font-semibold text-white mb-4">Domain Verification</h3>
                                {/* Tabs */}
                                <div className="flex bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg p-0.5 mb-5">
                                    {(['dns', 'file', 'meta'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setVerifyTab(t)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${verifyTab === t ? 'bg-white/10 text-white' : 'text-[var(--color-textMuted)] hover:text-white'}`}
                                        >
                                            {t === 'dns' ? 'DNS Record' : t === 'file' ? 'File Upload' : 'Meta Tag'}
                                        </button>
                                    ))}
                                </div>

                                {verifyTab === 'dns' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <p className="text-sm text-[var(--color-textMuted)]">Add a DNS <strong className="text-white">TXT</strong> record to verify ownership:</p>
                                        <div>
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1.5">Record name</p>
                                            <div className="flex items-center justify-between bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                                                <code className="text-sm text-white font-mono">_zentinel-verification.{domain.domain}</code>
                                                <button onClick={() => handleCopy(`_zentinel-verification.${domain.domain}`)} className="text-[var(--color-textMuted)] hover:text-white ml-3"><Copy className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1.5">Record value</p>
                                            <div className="flex items-center justify-between bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                                                <code className="text-sm text-white font-mono break-all">{domain.verification_token}</code>
                                                <button onClick={() => handleCopy(domain.verification_token!)} className="text-[var(--color-textMuted)] hover:text-white ml-3"><Copy className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[var(--color-textMuted)]">Propagation might take 2–10 minutes.</p>
                                    </div>
                                )}

                                {verifyTab === 'file' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <p className="text-sm text-[var(--color-textMuted)]">Upload a verification file to your domain's <code className="text-white font-mono">.well-known</code> directory:</p>
                                        <div>
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1.5">File URL</p>
                                            <div className="flex items-center justify-between bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                                                <code className="text-sm text-white font-mono break-all">https://{domain.domain}/.well-known/zentinel-verify.txt</code>
                                                <button onClick={() => handleCopy(`https://${domain.domain}/.well-known/zentinel-verify.txt`)} className="text-[var(--color-textMuted)] hover:text-white ml-3"><Copy className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1.5">File content</p>
                                            <div className="flex items-center justify-between bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                                                <code className="text-sm text-white font-mono break-all">{domain.verification_token}</code>
                                                <button onClick={() => handleCopy(domain.verification_token!)} className="text-[var(--color-textMuted)] hover:text-white ml-3"><Copy className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {verifyTab === 'meta' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <p className="text-sm text-[var(--color-textMuted)]">Add this <strong className="text-white">meta tag</strong> in your homepage's <code className="text-white font-mono">&lt;head&gt;</code>:</p>
                                        <div>
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1.5">Meta tag</p>
                                            <div className="flex items-center justify-between bg-[#0A0A0A] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                                                <code className="text-sm text-white font-mono break-all">{`<meta name="zentinel-verification" content="${domain.verification_token}">`}</code>
                                                <button onClick={() => handleCopy(`<meta name="zentinel-verification" content="${domain.verification_token}">`)} className="text-[var(--color-textMuted)] hover:text-white ml-3"><Copy className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Verify Now Button */}
                                <div className="mt-5">
                                    {verifyError && (
                                        <p className="text-xs text-red-400 mb-2 animate-in fade-in">{verifyError}</p>
                                    )}
                                    {verifySuccess && (
                                        <p className="text-xs text-green-400 font-medium mb-2 animate-in fade-in flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {verifySuccess}
                                        </p>
                                    )}
                                    {!domain.verified && (
                                        <button
                                            onClick={handleVerifyNow}
                                            disabled={isVerifying}
                                            className="px-5 py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isVerifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : 'Verify Now'}
                                        </button>
                                    )}
                                </div>

                                <div className="border-t border-[var(--color-border)] my-6" />
                            </div>
                        )}

                        {/* Domain Details */}
                        <div>
                            <h3 className="text-base font-semibold text-white mb-4">Details</h3>
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <td className="px-5 py-3.5 text-[var(--color-textMuted)] w-1/3">Type</td>
                                            <td className="px-5 py-3.5 text-white text-right">{typeLabel}</td>
                                        </tr>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <td className="px-5 py-3.5 text-[var(--color-textMuted)]">Added</td>
                                            <td className="px-5 py-3.5 text-white text-right">{new Date(domain.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        </tr>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <td className="px-5 py-3.5 text-[var(--color-textMuted)]">Last tested</td>
                                            <td className="px-5 py-3.5 text-[var(--color-textMuted)] text-right">—</td>
                                        </tr>
                                        <tr>
                                            <td className="px-5 py-3.5 text-[var(--color-textMuted)]">Verified</td>
                                            <td className="px-5 py-3.5 text-right">
                                                {domain.verified ? (
                                                    <span className="text-[var(--color-green)] font-medium">Yes</span>
                                                ) : (
                                                    <span className="text-[#FFB800] font-medium">No</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div>
                            <h3 className="text-base font-semibold text-white mb-4">Actions</h3>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-sm text-[var(--color-red)] hover:underline transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Disconnect domain
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
