"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    X, ExternalLink, CheckCircle2, EyeOff,
    RefreshCw, Terminal, Wrench, ChevronRight,
    ArrowLeft, ArrowRight as ArrowRightIcon,
    GitPullRequest, Loader2, Clock, BellOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateIssueStatus, snoozeIssue } from "@/lib/queries";

// ── Fix time estimate ─────────────────────────────────────────────────────────
export function fixTime(severity: string): string {
    return { critical: "4–8 hr", high: "2–4 hr", medium: "1–2 hr", low: "30 min" }[severity] ?? "1–2 hr";
}

// ── Snooze options ────────────────────────────────────────────────────────────
const SNOOZE_OPTIONS = [
    { label: "1 day",   days: 1 },
    { label: "3 days",  days: 3 },
    { label: "1 week",  days: 7 },
    { label: "1 month", days: 30 },
];

// ── CVSS-style dial ──────────────────────────────────────────────────────────

const SCORE_MAP: Record<string, { score: number; label: string; color: string; track: string }> = {
    critical: { score: 91, label: "Critical Risk", color: "#ef4444", track: "#7f1d1d" },
    high:     { score: 78, label: "High Risk",     color: "#f97316", track: "#7c2d12" },
    medium:   { score: 55, label: "Medium Risk",   color: "#eab308", track: "#713f12" },
    low:      { score: 28, label: "Low Risk",      color: "#22c55e", track: "#14532d" },
};

function CvssDial({ severity }: { severity: string }) {
    const cfg = SCORE_MAP[severity] || SCORE_MAP.low;
    const score = cfg.score;

    // SVG arc: semi-circle from 180° to 0° (left to right)
    const r = 36;
    const cx = 50;
    const cy = 50;
    const startAngle = Math.PI;                         // 180°
    const endAngle   = startAngle + (score / 100) * Math.PI; // proportional

    const arcX = (a: number) => cx + r * Math.cos(a);
    const arcY = (a: number) => cy + r * Math.sin(a);

    const trackPath = `M ${arcX(Math.PI)} ${arcY(Math.PI)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`;
    const scorePath = `M ${arcX(Math.PI)} ${arcY(Math.PI)} A ${r} ${r} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;

    return (
        <div className="flex flex-col items-center">
            <svg width="100" height="56" viewBox="0 0 100 60">
                {/* Track */}
                <path d={trackPath} fill="none" stroke={cfg.track} strokeWidth="8" strokeLinecap="round" />
                {/* Score arc */}
                <path d={scorePath} fill="none" stroke={cfg.color} strokeWidth="8" strokeLinecap="round" />
                {/* Score number */}
                <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill={cfg.color} fontFamily="monospace">
                    {score}
                </text>
            </svg>
            <span className="text-xs font-medium mt-1" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
    );
}

// ── Status actions ───────────────────────────────────────────────────────────

const STATUSES = [
    { id: "open",        label: "Reopen",      icon: RefreshCw },
    { id: "in_progress", label: "In Progress",  icon: RefreshCw },
    { id: "fixed",       label: "Mark Fixed",   icon: CheckCircle2 },
    { id: "ignored",     label: "Ignore",       icon: EyeOff },
] as const;

// ── Main sidebar component ───────────────────────────────────────────────────

interface Props {
    issueId: string | null;
    onClose: () => void;
    onStatusChange?: (id: string, status: string) => void;
    /** Optional: list of all issue IDs in the current view for prev/next navigation */
    allIds?: string[];
}

export function IssueSidebar({ issueId, onClose, onStatusChange, allIds = [] }: Props) {
    const [issue, setIssue] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"overview" | "poc" | "fix">("overview");
    const [updating, setUpdating] = useState(false);
    const [creatingPr, setCreatingPr] = useState(false);
    const [prUrl, setPrUrl] = useState<string | null>(null);
    const [prError, setPrError] = useState<string | null>(null);
    const [snoozeOpen, setSnoozeOpen] = useState(false);
    const [snoozing, setSnoozing] = useState(false);

    const currentIdx = allIds.indexOf(issueId || "");
    const prevId = currentIdx > 0 ? allIds[currentIdx - 1] : null;
    const nextId = currentIdx < allIds.length - 1 ? allIds[currentIdx + 1] : null;

    const handleCreatePr = async () => {
        if (!issue || creatingPr) return;
        setCreatingPr(true);
        setPrError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/autofix/create-pr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ issue_id: issue.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setPrUrl(data.pr_url);
            setIssue({ ...issue, external_issue_url: data.pr_url });
        } catch (e: any) {
            setPrError(e.message);
        } finally {
            setCreatingPr(false);
        }
    };

    const handleSnooze = async (days: number) => {
        if (!issue || snoozing) return;
        setSnoozing(true);
        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        try {
            await snoozeIssue(issue.id, until);
            setIssue({ ...issue, snoozed_until: until.toISOString() });
            onStatusChange?.(issue.id, 'snoozed');
        } finally {
            setSnoozing(false);
            setSnoozeOpen(false);
        }
    };

    useEffect(() => {
        if (!issueId) { setIssue(null); return; }
        setLoading(true);
        setPrUrl(null);
        setPrError(null);
        setSnoozeOpen(false);
        setTab("overview");
        supabase
            .from("issues")
            .select("*, repositories(full_name), pentests(name)")
            .eq("id", issueId)
            .single()
            .then(({ data }) => { setIssue(data); setLoading(false); });
    }, [issueId]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleStatus = async (status: string) => {
        if (!issue || updating) return;
        setUpdating(true);
        try {
            await updateIssueStatus(issue.id, status as any);
            setIssue({ ...issue, status });
            onStatusChange?.(issue.id, status);
        } finally {
            setUpdating(false);
        }
    };

    if (!issueId) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-[var(--background)] border-l border-[var(--color-border)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-[var(--color-textMuted)] hover:text-[var(--foreground)]">
                            <X className="h-4 w-4" />
                        </button>
                        {issueId && (
                            <Link href={`/dashboard/issues/${issueId}`}
                                className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-[var(--color-textMuted)] hover:text-[var(--foreground)]">
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        )}
                    </div>

                    {/* Prev / Next navigation */}
                    {allIds.length > 1 && (
                        <div className="flex items-center gap-1 text-xs text-[var(--color-textMuted)]">
                            <button disabled={!prevId} onClick={() => prevId && onClose()}
                                className="p-1.5 rounded hover:bg-white/8 disabled:opacity-30 transition-colors">
                                <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-1">{currentIdx + 1} / {allIds.length}</span>
                            <button disabled={!nextId} onClick={() => nextId && onClose()}
                                className="p-1.5 rounded hover:bg-white/8 disabled:opacity-30 transition-colors">
                                <ArrowRightIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    {issue && (
                        <div className="flex items-center gap-2">
                            {/* AutoFix PR button */}
                            {issue.repository_id && (
                                issue.external_issue_url || prUrl ? (
                                    <a href={issue.external_issue_url || prUrl!} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-colors">
                                        <GitPullRequest className="h-3.5 w-3.5" />
                                        View PR
                                    </a>
                                ) : (
                                    <button onClick={handleCreatePr} disabled={creatingPr}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors disabled:opacity-60">
                                        {creatingPr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitPullRequest className="h-3.5 w-3.5" />}
                                        {creatingPr ? "Creating PR…" : "Create Fix PR"}
                                    </button>
                                )
                            )}
                            {issue.status !== "fixed" && (
                                <button onClick={() => handleStatus("fixed")} disabled={updating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-cyan)] text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Fixed
                                </button>
                            )}
                            {/* Snooze dropdown */}
                            <div className="relative">
                                <button onClick={() => setSnoozeOpen(o => !o)} disabled={snoozing}
                                    className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-textSecondary)] hover:bg-white/5 hover:text-amber-400 transition-colors disabled:opacity-50"
                                    title="Snooze">
                                    <BellOff className="h-3.5 w-3.5" />
                                </button>
                                {snoozeOpen && (
                                    <div className="absolute right-0 top-8 z-50 bg-[var(--background)] border border-[var(--color-border)] rounded-xl shadow-2xl py-1 w-36 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {SNOOZE_OPTIONS.map(opt => (
                                            <button key={opt.days} onClick={() => handleSnooze(opt.days)}
                                                className="w-full text-left px-3 py-2 text-sm text-[var(--color-textSecondary)] hover:bg-white/5 hover:text-[var(--foreground)] transition-colors flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-amber-400" />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {issue.status !== "ignored" && (
                                <button onClick={() => handleStatus("ignored")} disabled={updating}
                                    className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-textSecondary)] hover:bg-white/5 transition-colors disabled:opacity-50"
                                    title="Ignore">
                                    <EyeOff className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                {loading || !issue ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">

                        {/* ── Hero block (dial + title) ── */}
                        <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                            <div className="flex items-start gap-5">
                                <CvssDial severity={issue.severity} />
                                <div className="flex-1 min-w-0 pt-1">
                                    <h2 className="text-base font-bold text-[var(--foreground)] leading-snug mb-2">
                                        {issue.title}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border capitalize
                                            ${issue.status === "fixed"   ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                              issue.status === "ignored" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                                              issue.status === "in_progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                              "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                            {issue.status?.replace("_", " ") || "open"}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded border bg-white/5 border-white/10 text-[var(--color-textSecondary)] font-mono uppercase">
                                            {issue.repository_id ? "SAST" : "DAST"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-textMuted)] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                            <Clock className="h-3 w-3" />
                                            Fix: {fixTime(issue.severity)}
                                        </span>
                                        {issue.snoozed_until && new Date(issue.snoozed_until) > new Date() && (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                <BellOff className="h-3 w-3" />
                                                Snoozed until {new Date(issue.snoozed_until).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        )}
                                        {issue.found_at && (
                                            <span className="text-xs text-[var(--color-textMuted)]">
                                                {new Date(issue.found_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className="flex border-b border-[var(--color-border)] px-4">
                            {[
                                { id: "overview", label: "Overview" },
                                { id: "poc",      label: "Proof of Concept" },
                                { id: "fix",      label: "How to Fix" },
                            ].map(t => (
                                <button key={t.id} onClick={() => setTab(t.id as any)}
                                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                                        ${tab === t.id
                                            ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                                            : "border-transparent text-[var(--color-textSecondary)] hover:text-[var(--foreground)]"}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Tab content ── */}
                        <div className="px-6 py-5 space-y-5">

                            {/* Overview */}
                            {tab === "overview" && (
                                <>
                                    {issue.description ? (
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2">TL;DR</p>
                                            <p className="text-sm text-[var(--foreground)] leading-relaxed">{issue.description}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--color-textMuted)]">No description available.</p>
                                    )}

                                    {/* Source location */}
                                    {(issue.repositories?.full_name || issue.pentests?.name) && (
                                        <div className="bg-[var(--surface-container)] border border-[var(--color-border)] rounded-lg p-3">
                                            <p className="text-xs text-[var(--color-textMuted)] mb-1">Found in</p>
                                            <p className="text-sm font-mono text-[var(--foreground)]">
                                                {issue.repositories?.full_name || issue.pentests?.name}
                                            </p>
                                        </div>
                                    )}

                                    {/* Status picker */}
                                    <div>
                                        <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2">Update Status</p>
                                        <div className="flex flex-col gap-1.5">
                                            {(["open", "in_progress", "fixed", "ignored"] as const).map(s => (
                                                <button key={s} onClick={() => handleStatus(s)} disabled={updating || issue.status === s}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize border
                                                        ${issue.status === s
                                                            ? "bg-white/8 border-white/20 text-[var(--foreground)] font-semibold cursor-default"
                                                            : "border-[var(--color-border)] text-[var(--color-textSecondary)] hover:bg-white/5 hover:text-[var(--foreground)]"}`}>
                                                    {issue.status === s && <CheckCircle2 className="h-3.5 w-3.5 inline mr-2 text-[var(--color-cyan)]" />}
                                                    {s.replace("_", " ")}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* PoC */}
                            {tab === "poc" && (
                                <>
                                    {issue.poc_request || issue.poc_response ? (
                                        <div className="space-y-4">
                                            {issue.poc_request && (
                                                <div>
                                                    <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Terminal className="h-3.5 w-3.5" /> Exploit / Evidence
                                                    </p>
                                                    <pre className="text-xs font-mono text-[var(--color-cyan)] bg-black/40 border border-[var(--color-border)] rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                        {issue.poc_request}
                                                    </pre>
                                                </div>
                                            )}
                                            {issue.poc_response && (
                                                <div>
                                                    <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2">Server Response</p>
                                                    <pre className="text-xs font-mono text-amber-400 bg-black/40 border border-[var(--color-border)] rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                        {issue.poc_response}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-12 text-center">
                                            <Terminal className="h-8 w-8 text-[var(--color-textMuted)] mb-3" />
                                            <p className="text-sm text-[var(--color-textSecondary)]">No proof of concept recorded.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Fix */}
                            {tab === "fix" && (
                                <>
                                    {issue.fix_description ? (
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Wrench className="h-3.5 w-3.5 text-green-400" /> Remediation
                                            </p>
                                            <div className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap bg-[var(--surface-container)] border border-[var(--color-border)] rounded-lg p-4">
                                                {issue.fix_description}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-12 text-center">
                                            <Wrench className="h-8 w-8 text-[var(--color-textMuted)] mb-3" />
                                            <p className="text-sm text-[var(--color-textSecondary)]">No fix guidance recorded.</p>
                                        </div>
                                    )}
                                    {issue.fix_diff && (
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--color-textMuted)] uppercase tracking-wider mb-2">Suggested Diff</p>
                                            <pre className="text-xs font-mono text-green-400 bg-black/40 border border-green-500/20 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                {issue.fix_diff}
                                            </pre>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* PR error */}
                            {prError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
                                    ⚠ {prError}
                                </div>
                            )}

                            {/* Full detail link */}
                            <Link href={`/dashboard/issues/${issue.id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-textSecondary)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors mt-2">
                                View full detail <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
