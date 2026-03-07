"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, TerminalSquare, Github, CheckCircle2, AlertTriangle, ExternalLink, Activity } from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { getIssueDetails } from "@/lib/queries";

export default function IssueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchIssue = async () => {
            setLoading(true);
            try {
                const data = await getIssueDetails(id);
                setIssue(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchIssue();
        }
    }, [id]);

    if (loading) {
        return <div className="p-8 max-w-7xl mx-auto animate-pulse text-[var(--color-textMuted)]">Loading issue details...</div>;
    }

    if (!issue) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
                <ShieldAlert className="h-12 w-12 text-[var(--color-red)] mb-4" />
                <h1 className="text-2xl font-syne font-bold text-white mb-2">Issue Not Found</h1>
                <p className="text-[var(--color-textSecondary)] mb-6">The vulnerability you are looking for does not exist or you do not have permission.</p>
                <button onClick={() => router.push('/dashboard/issues')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                    Back to Issues
                </button>
            </div>
        );
    }

    const severityConfig: Record<string, { color: string, bg: string, label: string }> = {
        critical: { color: "text-[var(--color-red)]", bg: "bg-[var(--color-red)]/10", label: "Critical" },
        high: { color: "text-[var(--color-amber)]", bg: "bg-[var(--color-amber)]/10", label: "High" },
        medium: { color: "text-[#A855F7]", bg: "bg-[#A855F7]/10", label: "Medium" },
        low: { color: "text-[var(--color-cyan)]", bg: "bg-[var(--color-cyan)]/10", label: "Low" },
        info: { color: "text-[var(--color-textSecondary)]", bg: "bg-white/5", label: "Info" },
    };

    const conf = severityConfig[issue.severity] || severityConfig.info;

    // Mock data for proof and PR since DB schema doesn't have deep JSON models yet.
    const mockPayload = {
        request: `POST /api/v1/auth/reset HTTP/2.0\nHost: api.zentinel.dev\nContent-Type: application/json\n\n{\n  "email": "admin@zentinel.dev" \n  "inject": "' OR 1=1 --"\n}`,
        response: `HTTP/2.0 500 Internal Server Error\nContent-Type: application/json\n\n{\n  "error": "syntax error at or near 'OR' (SQLSTATE 42601)"\n}`
    };

    return (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
            {/* Header & Breadcrumbs */}
            <div className="mb-8">
                <button
                    onClick={() => router.push("/dashboard/issues")}
                    className="flex items-center text-sm text-[var(--color-textMuted)] hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Issues
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                                {conf.label}
                            </span>
                            <span className="text-sm font-mono text-[var(--color-textSecondary)] flex items-center gap-1.5">
                                <Activity className="h-4 w-4 text-[var(--color-textMuted)]" /> Discovered by Validate-γ
                            </span>
                        </div>
                        <h1 className="text-3xl font-syne font-bold text-white tracking-tight leading-tight max-w-3xl">
                            {issue.title}
                        </h1>
                        <p className="text-[var(--color-textSecondary)] mt-3 flex items-center gap-4 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <ShieldAlert className="h-4 w-4 text-[var(--color-textMuted)]" /> Found in: <span className="text-white">{issue.pentests?.name || 'Unknown Pentest'}</span>
                            </span>
                            <span className="text-[var(--color-border)]">|</span>
                            <span>Reported: {new Date(issue.created_at).toLocaleString()}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm shrink-0">
                        <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors font-medium">
                            Ignore Issue
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold transition-colors">
                            Mark Resolved
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)] mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-[var(--color-cyan)] text-[var(--color-cyan)]' : 'border-transparent text-[var(--color-textSecondary)] hover:text-white'}`}
                >
                    Overview & Impact
                </button>
                <button
                    onClick={() => setActiveTab('proof')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'proof' ? 'border-[var(--color-cyan)] text-[var(--color-cyan)]' : 'border-transparent text-[var(--color-textSecondary)] hover:text-white'}`}
                >
                    <TerminalSquare className="h-4 w-4" /> Proof of Concept
                </button>
                <button
                    onClick={() => setActiveTab('autofix')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'autofix' ? 'border-[var(--color-cyan)] text-[var(--color-cyan)]' : 'border-transparent text-[var(--color-textSecondary)] hover:text-white'}`}
                >
                    <Github className="h-4 w-4" /> Auto-Fix PR <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-green)]/20 text-[var(--color-green)] text-[10px] uppercase font-bold tracking-wider">Ready</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-6 md:p-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-syne font-bold text-white mb-3 flex items-center gap-2">
                                        Description
                                    </h3>
                                    <div className="text-[var(--color-textSecondary)] leading-relaxed bg-black/20 p-4 rounded-lg border border-[var(--color-border)] whitespace-pre-wrap">
                                        {issue.description || 'No detailed description available.'}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-syne font-bold text-white mb-3">Remediation Advice</h3>
                                    <div className="text-[var(--color-textSecondary)] leading-relaxed bg-black/20 p-4 rounded-lg border border-[var(--color-border)]">
                                        Apply parameterized queries for all database interactions. Ensure that the ORM is strictly bound to type-safe variables to prevent raw SQL injection in the parameters object.
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider mb-2">CVSS Score</h4>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-4xl font-syne font-bold ${conf.color}`}>8.4</span>
                                        <span className={`text-xs px-2 py-1 rounded ${conf.bg} ${conf.color} font-bold uppercase tracking-wider`}>{conf.label}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider mb-2">Impact Analysis</h4>
                                    <ul className="space-y-2 text-sm text-[var(--color-textSecondary)]">
                                        <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--color-amber)]" /> Confidentiality: High</li>
                                        <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--color-amber)]" /> Integrity: High</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--color-green)]" /> Availability: None</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider mb-2">References</h4>
                                    <ul className="space-y-2">
                                        <li>
                                            <a href="#" className="flex items-center gap-2 text-sm text-[var(--color-cyan)] hover:underline">
                                                CWE-89: Improper Neutralization of Special Elements <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="flex items-center gap-2 text-sm text-[#A855F7] hover:underline">
                                                OWASP Top 10: A03 Injection <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'proof' && (
                    <Card className="p-0 overflow-hidden shadow-xl border border-[var(--color-border)]">
                        <div className="p-4 border-b border-[var(--color-border)] bg-black/40 flex justify-between items-center">
                            <h3 className="font-syne font-bold flex items-center gap-2 text-white">
                                <TerminalSquare className="h-5 w-5 text-[var(--color-cyan)]" /> Validated Exploit Chain
                            </h3>
                            <button className="flex items-center gap-2 text-sm text-[var(--color-cyan)] hover:text-white transition-colors bg-[var(--color-cyan)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-cyan)]/20 shadow-[0_0_10px_rgba(0,212,255,0.1)] hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                                <Activity className="h-4 w-4" /> Verify Fix (Retest)
                            </button>
                        </div>
                        <div className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
                            <div className="bg-[#0D1117] p-4 font-mono text-sm">
                                <h4 className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Exploit Request Payload</h4>
                                <pre className="text-[var(--color-cyan)] overflow-x-auto">
                                    {mockPayload.request}
                                </pre>
                            </div>
                            <div className="bg-[#0D1117] p-4 font-mono text-sm">
                                <h4 className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Server Response</h4>
                                <pre className="text-[var(--color-amber)] overflow-x-auto">
                                    {mockPayload.response}
                                </pre>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'autofix' && (
                    <Card className="p-0 overflow-hidden shadow-xl border border-[var(--color-border)] max-w-4xl mx-auto">
                        <div className="p-6 border-b border-[var(--color-border)] bg-black/40 flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 bg-[var(--color-green)]/10 rounded-full flex items-center justify-center mb-4 border border-[var(--color-green)]/20 shadow-[0_0_30px_rgba(0,255,136,0.15)]">
                                <Github className="h-8 w-8 text-[var(--color-green)]" />
                            </div>
                            <h2 className="text-2xl font-syne font-bold text-white mb-2">Auto-Fix Deployed</h2>
                            <p className="text-[var(--color-textSecondary)] max-w-md">Our AI Fix-δ agent has successfully computed a patch for this vulnerability and created a Pull Request in your repository.</p>
                        </div>
                        <div className="p-8 bg-[var(--color-bgCard)] flex flex-col items-center">
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-lg border border-[var(--color-border)]">
                                    <span className="text-[var(--color-textMuted)] text-sm">Target Repo</span>
                                    <span className="text-white font-mono text-sm">acme-corp/zentinel-api</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-lg border border-[var(--color-border)]">
                                    <span className="text-[var(--color-textMuted)] text-sm">PR Status</span>
                                    <span className="text-[var(--color-green)] bg-[var(--color-green)]/10 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-[var(--color-green)]/20 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Open</span>
                                </div>
                                <button className="w-full py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors mt-4 flex items-center justify-center">
                                    Review & Merge on GitHub <ExternalLink className="h-4 w-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
