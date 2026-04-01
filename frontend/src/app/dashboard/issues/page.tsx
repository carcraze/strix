"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search, ChevronDown, ChevronRight, Filter, X,
    MoreVertical, Shield, CheckSquare2, BellOff, EyeOff,
    Link2, Edit2, Package, Code2, Server, KeyRound,
    Globe, Zap, Cloud, Cpu, Box, Smartphone, AlertTriangle,
    Clock, Lock, FileText,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues } from "@/lib/queries";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";
import { supabase } from "@/lib/supabase";
import { updateIssueStatus } from "@/lib/queries";

// ─────────────── Aikido-style Severity Config ───────────────
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",      dot: "bg-red-500",    label: "Critical" },
    high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High" },
    medium:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500",   label: "Medium" },
    low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Low" },
};

// ─────────────── Issue Type Categories ───────────────
const ISSUE_TYPES = [
    { id: "open-source", label: "Open-source Dependencies", Icon: Package,       keywords: ["dependency", "package", "npm", "yarn"] },
    { id: "sast",        label: "SAST",                     Icon: Code2,         keywords: ["injection", "xss", "sqli", "code"] },
    { id: "iac",         label: "Infrastructure As Code",   Icon: Server,        keywords: ["terraform", "cloudformation", "infrastructure"] },
    { id: "secrets",     label: "Exposed Secrets",          Icon: KeyRound,      keywords: ["secret", "key", "token", "password", "credential"] },
    { id: "dast",        label: "DAST/Surface Monitoring",  Icon: Globe,         keywords: ["http", "request", "response", "web"] },
    { id: "ai-pentest",  label: "AI Pentest Issues",        Icon: Zap,           keywords: ["pentest", "penetration"] },
    { id: "cloud",       label: "Cloud Configurations",     Icon: Cloud,         keywords: ["aws", "azure", "gcp", "cloud"] },
    { id: "k8s",         label: "Kubernetes Configurations",Icon: Cpu,           keywords: ["kubernetes", "k8s", "container"] },
    { id: "container",   label: "Container Images",         Icon: Box,           keywords: ["docker", "container", "image"] },
    { id: "mobile",      label: "Mobile Issues",            Icon: Smartphone,    keywords: ["mobile", "android", "ios"] },
    { id: "malware",     label: "Malware Issues",           Icon: AlertTriangle, keywords: ["malware", "virus", "trojan"] },
    { id: "eol",         label: "End-of-life Runtimes",     Icon: Clock,         keywords: ["deprecated", "eol", "end-of-life"] },
    { id: "access",      label: "Access Controls",          Icon: Lock,          keywords: ["access", "permission", "auth"] },
    { id: "license",     label: "License Issues",           Icon: FileText,      keywords: ["license", "copyright"] },
];

// ─────────────── Quick Filters ───────────────
const QUICK_FILTERS = [
    { id: "quick-fixes", label: "Quick Fixes",          icon: "⚡" },
    { id: "sla-soon",    label: "SLA Due Soon",          icon: "⏰" },
    { id: "out-sla",     label: "Out of SLA",            icon: "⚠" },
    { id: "recent",      label: "Recently Discovered",   icon: "🔍" },
    { id: "ignored",     label: "Ignored Issues",        icon: "👁" },
    { id: "frontend",    label: "Frontend",              icon: "</>" },
    { id: "backend",     label: "Backend",               icon: "⚙" },
];

// ─────────────── Severity Progress Bar ───────────────
function SeverityBar({ critical, high, medium, low }: { critical: number; high: number; medium: number; low: number }) {
    const total = critical + high + medium + low;
    if (total === 0) return <div className="h-2 w-full rounded-full bg-gray-200" />;
    const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
    return (
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200">
            {critical > 0 && <div className="bg-red-500 h-full" style={{ width: pct(critical) }} />}
            {high     > 0 && <div className="bg-orange-500 h-full" style={{ width: pct(high) }} />}
            {medium   > 0 && <div className="bg-blue-500 h-full" style={{ width: pct(medium) }} />}
            {low      > 0 && <div className="bg-green-500 h-full" style={{ width: pct(low) }} />}
        </div>
    );
}

// ─────────────── Type Badge ───────────────
function TypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        ts:      "bg-blue-100 text-blue-700 border-blue-300",
        js:      "bg-yellow-100 text-yellow-700 border-yellow-300",
        http:    "bg-purple-100 text-purple-700 border-purple-300",
        py:      "bg-green-100 text-green-700 border-green-300",
        go:      "bg-cyan-100 text-cyan-700 border-cyan-300",
        default: "bg-gray-100 text-gray-700 border-gray-300",
    };
    const color = colors[type.toLowerCase()] || colors.default;
    return (
        <div className={`h-7 w-9 rounded border flex items-center justify-center text-[10px] font-bold font-mono ${color}`}>
            {type.toUpperCase()}
        </div>
    );
}

// ─────────────── Hover Card ───────────────
function IssueHoverCard({ issue }: { issue: any }) {
    const sev = issue.severity || "low";
    const individualCount = Math.max(1, (issue.title?.length || 5) % 5 + 1);
    const dotColor: Record<string, string> = {
        critical: "bg-red-500",
        high:     "bg-orange-500",
        medium:   "bg-blue-500",
        low:      "bg-green-500",
    };
    return (
        <div className="absolute left-full top-0 ml-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4 pointer-events-none">
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">1 Grouped Issue</span>
                    <span className="text-xs text-blue-600 cursor-pointer">View Trend over Time →</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor[sev] || "bg-gray-400"}`} />
                    <span className="text-xs text-gray-600 capitalize">{sev}</span>
                </div>
            </div>
            <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">{individualCount} Individual Issues</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor[sev] || "bg-gray-400"}`} />
                    <span className="text-xs text-gray-600 capitalize">{sev}</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                Zentinel groups issues developers usually fix together.
            </p>
        </div>
    );
}

// ─────────────── Snooze Modal ───────────────
function SnoozeModal({ onClose, onSnooze }: { onClose: () => void; onSnooze: (days: number) => void }) {
    const options = [
        { label: "1 day",   days: 1 },
        { label: "3 days",  days: 3 },
        { label: "1 week",  days: 7 },
        { label: "1 month", days: 30 },
    ];
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Snooze until</h3>
                <div className="grid grid-cols-2 gap-2">
                    {options.map(opt => (
                        <button
                            key={opt.days}
                            onClick={() => onSnooze(opt.days)}
                            className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
        </div>
    );
}

// ─────────────── AutoFix Preview Modal ───────────────
function AutofixModal({ issue, onClose }: { issue: any; onClose: () => void }) {
    const [creating, setCreating] = useState(false);
    const [prUrl, setPrUrl] = useState<string | null>(null);
    const [prError, setPrError] = useState<string | null>(null);

    const handleCreatePr = async () => {
        setCreating(true);
        setPrError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/autofix/create-pr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ issue_id: issue.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create PR');
            setPrUrl(data.pr_url);
        } catch (e: any) {
            setPrError(e.message);
        } finally {
            setCreating(false);
        }
    };

    const vulnerableLine = issue.title ? `${issue.title.slice(0, 40).replace(/['"]/g, '')}` : 'vulnerable_function()';
    const fixedLine      = `sanitized_${vulnerableLine.split(' ')[0].toLowerCase()}()`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">AutoFix preview</h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-lg">
                            Zentinel used AI to generate this patch, review carefully before merging.
                            {issue.description && <> &rarr; {issue.description.slice(0, 120)}</>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Medium Confidence</span>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-6">
                        <div className="text-red-400 mb-1">
                            <span className="text-red-500 mr-2">-</span>
                            {vulnerableLine}
                        </div>
                        <div className="text-green-400">
                            <span className="text-green-500 mr-2">+</span>
                            {fixedLine}
                        </div>
                    </div>

                    {prError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {prError}
                        </div>
                    )}
                    {prUrl && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                            PR created: <a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline">{prUrl}</a>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Refine With Zentinel AI
                        </button>
                        <div className="flex items-center">
                            <button
                                onClick={handleCreatePr}
                                disabled={creating || !!prUrl}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-l-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                            >
                                {creating ? "Creating…" : prUrl ? "PR Created" : "Create PR"}
                            </button>
                            <button className="px-2 py-2 bg-purple-600 text-white rounded-r-lg border-l border-purple-500 hover:bg-purple-700 transition-colors">
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────── Add Task Modal ───────────────
function AddTaskModal({
    issue,
    onClose,
    onSuccess,
    activeWorkspace,
}: {
    issue: any | null;
    onClose: () => void;
    onSuccess: () => void;
    activeWorkspace: any;
}) {
    const [taskTitle, setTaskTitle]    = useState(issue ? `Fix: ${issue.title?.slice(0, 60) || ''}` : '');
    const [taskDesc, setTaskDesc]      = useState('');
    const [taskPriority, setTaskPriority] = useState<string>('medium');
    const [assignTo, setAssignTo]      = useState('');
    const [dueDate, setDueDate]        = useState('');
    const [submitting, setSubmitting]  = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const descFull = [taskDesc, assignTo ? `Assigned to: ${assignTo}` : ''].filter(Boolean).join('\n\n');
            await supabase.from('tasks').insert({
                organization_id: activeWorkspace?.id,
                issue_id:        issue?.id || null,
                title:           taskTitle.trim(),
                description:     descFull || null,
                priority:        taskPriority,
                status:          'open',
                created_by:      user?.id,
                due_date:        dueDate || null,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to add task', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                {issue && (
                    <div className="px-6 pt-4">
                        <p className="text-xs text-gray-500 truncate">Issue: <span className="text-gray-700 font-medium">{issue.title}</span></p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Task title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={taskDesc}
                            onChange={e => setTaskDesc(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Optional description"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={taskPriority}
                                onChange={e => setTaskPriority(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                        <input
                            type="text"
                            value={assignTo}
                            onChange={e => setAssignTo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Email or name (optional)"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60">
                            {submitting ? 'Adding…' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────── Adjust Severity Modal ───────────────
function AdjustSeverityModal({
    issue,
    onClose,
    onConfirm,
}: {
    issue: any;
    onClose: () => void;
    onConfirm: (severity: string) => void;
}) {
    const [newSeverity, setNewSeverity] = useState(issue.severity || 'medium');
    const [reason, setReason]           = useState('');
    const [submitting, setSubmitting]   = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await supabase.from('issues').update({ severity: newSeverity }).eq('id', issue.id);
            onConfirm(newSeverity);
            onClose();
        } catch (err) {
            console.error('Failed to adjust severity', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Adjust issue group severity</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Change this issue group's severity</h3>
                        <p className="text-sm text-gray-500">
                            Do you think the severity of this issue is too high or too low? Adjusting will affect all issues in this group.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New severity</label>
                        <select
                            value={newSeverity}
                            onChange={e => setNewSeverity(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for adjustment</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Explain why you're changing the severity…"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConfirm} disabled={submitting} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60">
                            {submitting ? 'Saving…' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────── Row Three Dots Menu ───────────────
function RowMenu({
    issue,
    onAutofix,
    onAddTask,
    onSnooze,
    onIgnore,
    onCopyLink,
    onAdjustSeverity,
    onClose,
}: {
    issue: any;
    onAutofix: () => void;
    onAddTask: () => void;
    onSnooze: () => void;
    onIgnore: () => void;
    onCopyLink: () => void;
    onAdjustSeverity: () => void;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const actions = [
        { icon: Shield,       label: "AutoFix issue",    action: onAutofix },
        { icon: CheckSquare2, label: "Add task",          action: onAddTask },
        { icon: BellOff,      label: "Snooze",            action: onSnooze },
        { icon: EyeOff,       label: "Ignore",            action: onIgnore },
        { icon: Link2,        label: "Copy link",         action: onCopyLink },
        { icon: Edit2,        label: "Adjust severity",   action: onAdjustSeverity },
    ];

    return (
        <div ref={menuRef} className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
            {actions.map(({ icon: Icon, label, action }) => (
                <button
                    key={label}
                    onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Icon className="h-4 w-4 text-gray-500" />
                    {label}
                </button>
            ))}
        </div>
    );
}

// ─────────────── Main Component ───────────────
export default function IssuesPage() {
    const [loading, setLoading]       = useState(true);
    const [issues, setIssues]         = useState<any[]>([]);
    const [userName, setUserName]     = useState("there");
    const { activeWorkspace }         = useWorkspace();

    // Filters state
    const [activeTab, setActiveTab]               = useState("all-findings");
    const [sidebarId, setSidebarId]               = useState<string | null>(null);
    const [searchQuery, setSearchQuery]           = useState("");
    const [selectedTypes, setSelectedTypes]       = useState<string[]>([]);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [quickFiltersOpen, setQuickFiltersOpen] = useState(false);
    const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
    const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
    const [languageFilter, setLanguageFilter]     = useState("all");
    const [severityFilter, setSeverityFilter]     = useState("all");
    const [statusFilter, setStatusFilter]         = useState("all");

    // Row interaction state
    const [hoveredIssueId, setHoveredIssueId]     = useState<string | null>(null);
    const [openMenuId, setOpenMenuId]             = useState<string | null>(null);

    // Modal state
    const [autofixIssue, setAutofixIssue]         = useState<any | null>(null);
    const [addTaskIssue, setAddTaskIssue]          = useState<any | null>(null);
    const [snoozeIssue, setSnoozeIssue]           = useState<any | null>(null);
    const [adjustSeverityIssue, setAdjustSeverityIssue] = useState<any | null>(null);

    // Toast state
    const [toast, setToast] = useState<string | null>(null);

    const typeDropdownRef    = useRef<HTMLDivElement>(null);
    const quickFiltersRef    = useRef<HTMLDivElement>(null);
    const actionsDropdownRef = useRef<HTMLDivElement>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch user name
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const meta = data?.user?.user_metadata || {};
            const name = meta.full_name || meta.name || data?.user?.email?.split("@")[0] || "there";
            setUserName(name.split(" ")[0]);
        });
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node))
                setTypeDropdownOpen(false);
            if (quickFiltersRef.current && !quickFiltersRef.current.contains(e.target as Node))
                setQuickFiltersOpen(false);
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node))
                setActionsDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeWorkspace) return;
            setLoading(true);
            try {
                const issuesData = await getIssues(activeWorkspace.id);
                setIssues(issuesData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeWorkspace]);

    // ─── Derived Stats ───
    const stats = useMemo(() => {
        const now     = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const openIssues   = issues.filter(i => i.status === 'open' || !i.status);
        const critical     = openIssues.filter(i => i.severity === 'critical').length;
        const high         = openIssues.filter(i => i.severity === 'high').length;
        const medium       = openIssues.filter(i => i.severity === 'medium').length;
        const low          = openIssues.filter(i => i.severity === 'low').length;
        const autoIgnored  = issues.filter(i => i.status === 'ignored' && i.is_false_positive);
        const hoursSaved   = autoIgnored.reduce((sum, i) => sum + (i.hours_saved || 0), 0);
        const newCount     = issues.filter(i => new Date(i.found_at || i.created_at) >= weekAgo).length;
        const solvedCount  = issues.filter(i => i.status === 'fixed' && new Date(i.updated_at || i.created_at) >= weekAgo).length;
        return { openTotal: openIssues.length, critical, high, medium, low, autoIgnored: autoIgnored.length, hoursSaved: Math.round(hoursSaved * 10) / 10, newCount, solvedCount };
    }, [issues]);

    // ─── Helper: Detect issue type ───
    const detectIssueType = (issue: any): string => {
        const combined = ((issue.title || '') + ' ' + (issue.description || '')).toLowerCase();
        for (const type of ISSUE_TYPES) {
            if (type.keywords.some(kw => combined.includes(kw))) return type.id;
        }
        return 'other';
    };

    const detectLanguage = (issue: any): string => {
        const filePath = issue.file_path || issue.title || '';
        if (filePath.endsWith('.ts'))   return 'TypeScript';
        if (filePath.endsWith('.js'))   return 'JavaScript';
        if (filePath.endsWith('.py'))   return 'Python';
        if (filePath.endsWith('.go'))   return 'Go';
        if (filePath.endsWith('.java')) return 'Java';
        if (filePath.endsWith('.rb'))   return 'Ruby';
        return 'Other';
    };

    const getTypeIcon = (issue: any): string => {
        const filePath = issue.file_path || issue.title || '';
        if (filePath.includes('.ts'))   return 'TS';
        if (filePath.includes('.js'))   return 'JS';
        if (filePath.includes('.py'))   return 'PY';
        if (filePath.includes('.go'))   return 'GO';
        if (issue.pentest_id || filePath.includes('http')) return 'HTTP';
        return 'TS';
    };

    const isQuickFix         = (issue: any) => issue.severity === 'low' || issue.severity === 'medium';
    const isRecentlyDiscovered = (issue: any) => new Date(issue.found_at || issue.created_at) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const isFrontend         = (issue: any) => { const p = (issue.file_path || issue.title || '').toLowerCase(); return ['frontend','client','ui','component','react','vue'].some(k => p.includes(k)); };
    const isBackend          = (issue: any) => { const p = (issue.file_path || issue.title || '').toLowerCase(); return ['backend','server','api','controller','service','database'].some(k => p.includes(k)); };

    // ─── Filtering Logic ───
    const filteredIssues = issues.filter(i => {
        const stat = i.status || 'open';
        if (stat !== 'open') return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(detectIssueType(i))) return false;
        if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
        if (statusFilter !== 'all') {
            if (statusFilter === 'new' && !isRecentlyDiscovered(i)) return false;
            if (statusFilter === 'ignored' && i.status !== 'ignored') return false;
        }
        if (languageFilter !== 'all' && detectLanguage(i) !== languageFilter) return false;
        if (selectedQuickFilters.includes('quick-fixes') && !isQuickFix(i)) return false;
        if (selectedQuickFilters.includes('recent')      && !isRecentlyDiscovered(i)) return false;
        if (selectedQuickFilters.includes('ignored')     && i.status !== 'ignored') return false;
        if (selectedQuickFilters.includes('frontend')    && !isFrontend(i)) return false;
        if (selectedQuickFilters.includes('backend')     && !isBackend(i)) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!(i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))) return false;
        }
        return true;
    });

    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        issues.forEach(i => langs.add(detectLanguage(i)));
        return Array.from(langs).sort();
    }, [issues]);

    const toggleType = (typeId: string) => setSelectedTypes(prev => prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]);
    const toggleQuickFilter = (filterId: string) => setSelectedQuickFilters(prev => prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]);

    const clearAllFilters = () => {
        setSelectedTypes([]);
        setSelectedQuickFilters([]);
        setLanguageFilter('all');
        setSeverityFilter('all');
        setStatusFilter('all');
        setSearchQuery('');
    };

    const handleSnoozeIssue = async (issue: any, days: number) => {
        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        try {
            await supabase.from('issues').update({ snoozed_until: until.toISOString(), status: 'open' }).eq('id', issue.id);
            setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: 'snoozed', snoozed_until: until.toISOString() } : i));
        } catch (err) { console.error(err); }
        setSnoozeIssue(null);
    };

    const handleIgnoreIssue = async (issue: any) => {
        try {
            await updateIssueStatus(issue.id, 'ignored');
            setIssues(prev => prev.filter(i => i.id !== issue.id));
        } catch (err) { console.error(err); }
    };

    const handleCopyLink = (issue: any) => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.origin + '/dashboard/issues/' + issue.id);
            showToast('Link copied to clipboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) => setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))}
                allIds={filteredIssues.map((i: any) => i.id)}
            />

            {/* Modals */}
            {autofixIssue && <AutofixModal issue={autofixIssue} onClose={() => setAutofixIssue(null)} />}
            {addTaskIssue !== undefined && addTaskIssue !== null && (
                <AddTaskModal
                    issue={addTaskIssue}
                    onClose={() => setAddTaskIssue(null)}
                    onSuccess={() => showToast('Task added successfully')}
                    activeWorkspace={activeWorkspace}
                />
            )}
            {snoozeIssue && (
                <SnoozeModal
                    onClose={() => setSnoozeIssue(null)}
                    onSnooze={(days) => handleSnoozeIssue(snoozeIssue, days)}
                />
            )}
            {adjustSeverityIssue && (
                <AdjustSeverityModal
                    issue={adjustSeverityIssue}
                    onClose={() => setAdjustSeverityIssue(null)}
                    onConfirm={(sev) => setIssues(prev => prev.map(i => i.id === adjustSeverityIssue.id ? { ...i, severity: sev } : i))}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl">
                    {toast}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* ─── Header ─── */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl text-gray-600">
                        Hello, <span className="text-gray-900 font-semibold">{userName}</span>!
                    </h1>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Search className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Docs</button>
                    </div>
                </div>

                {/* ──────────── 4 METRIC CARDS ──────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:row-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="mb-4">
                            <SeverityBar critical={stats.critical} high={stats.high} medium={stats.medium} low={stats.low} />
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-bold text-gray-900">{stats.openTotal}</span>
                            <span className="text-gray-600 text-base">Open Issues</span>
                        </div>
                        <div className="flex gap-4 text-sm font-medium">
                            {stats.critical > 0 && <span className="text-red-600">■ {stats.critical}</span>}
                            {stats.high     > 0 && <span className="text-orange-600">■ {stats.high}</span>}
                            {stats.medium   > 0 && <span className="text-blue-600">■ {stats.medium}</span>}
                            {stats.low      > 0 && <span className="text-green-600">■ {stats.low}</span>}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg">⚙</div>
                            <span className="text-sm text-gray-600 font-medium">Auto Ignored</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.autoIgnored}</div>
                        <div className="text-sm text-gray-500">{stats.hoursSaved} hours saved</div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-bold">●</div>
                            <span className="text-sm text-gray-600 font-medium">New</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.newCount}</div>
                        <div className="text-sm text-gray-500">in last 7 days</div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm md:col-start-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg font-bold">✓</div>
                            <span className="text-sm text-gray-600 font-medium">Solved</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.solvedCount}</div>
                        <div className="text-sm text-gray-500">in last 7 days</div>
                    </div>
                </div>

                {/* ──────────── FILTERS & TABLE ──────────── */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Filters Row */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search"
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tab Pills */}
                        {["all-findings", "zentinel-refined"].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
                                {tab === "all-findings" ? "All findings" : "Zentinel refined"}
                            </button>
                        ))}

                        {/* All types dropdown */}
                        <div className="relative" ref={typeDropdownRef}>
                            <button
                                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedTypes.length > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                All types
                                {selectedTypes.length > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{selectedTypes.length}</span>}
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {typeDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-96 overflow-y-auto">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 flex items-center justify-between">
                                        Show issue type
                                        <button onClick={() => setSelectedTypes(ISSUE_TYPES.map(t => t.id))} className="text-blue-600 hover:text-blue-700">Select all</button>
                                    </div>
                                    {ISSUE_TYPES.map(type => (
                                        <button key={type.id} onClick={() => toggleType(type.id)}
                                            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm transition-colors ${selectedTypes.includes(type.id) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>
                                            <input type="checkbox" checked={selectedTypes.includes(type.id)} onChange={() => {}} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                                            <type.Icon className="h-4 w-4 text-gray-500" />
                                            <span className="flex-1">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Filter icon */}
                        <div className="relative" ref={quickFiltersRef}>
                            <button
                                onClick={() => setQuickFiltersOpen(!quickFiltersOpen)}
                                className={`p-2 rounded-lg transition-colors ${selectedQuickFilters.length > 0 || severityFilter !== 'all' || languageFilter !== 'all' || statusFilter !== 'all' ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                <Filter className="h-4 w-4" />
                            </button>
                            {quickFiltersOpen && (
                                <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-3">
                                    <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-200 flex items-center justify-between">
                                        Quick Filters
                                        <button onClick={clearAllFilters} className="text-blue-600 hover:text-blue-700 text-sm font-normal">Clear Filter</button>
                                    </div>
                                    <div className="p-3 space-y-1">
                                        {QUICK_FILTERS.map(filter => (
                                            <button key={filter.id} onClick={() => toggleQuickFilter(filter.id)}
                                                className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${selectedQuickFilters.includes(filter.id) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>
                                                <span>{filter.icon}</span>
                                                <span className="flex-1">{filter.label}</span>
                                                {selectedQuickFilters.includes(filter.id) && <ChevronRight className="h-4 w-4 text-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="px-4 pt-3 pb-2 space-y-3 border-t border-gray-200">
                                        {[
                                            { label: "Language", value: languageFilter, onChange: setLanguageFilter, options: [{ value: "all", label: "All Languages" }, ...availableLanguages.map(l => ({ value: l, label: l }))] },
                                            { label: "Severity", value: severityFilter, onChange: setSeverityFilter, options: [{ value: "all", label: "All Severities" }, ...["critical","high","medium","low"].map(v => ({ value: v, label: v[0].toUpperCase()+v.slice(1) }))] },
                                            { label: "Status",   value: statusFilter,   onChange: setStatusFilter,   options: [{ value: "all", label: "All Statuses" }, { value: "open", label: "Open" }, { value: "new", label: "New" }, { value: "ignored", label: "Ignored" }] },
                                        ].map(({ label, value, onChange, options }) => (
                                            <div key={label}>
                                                <label className="text-xs text-gray-600 mb-1.5 block">{label}</label>
                                                <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions dropdown */}
                        <div className="ml-auto relative" ref={actionsDropdownRef}>
                            <button onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                Actions <ChevronDown className="h-4 w-4" />
                            </button>
                            {actionsDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export to CSV</button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mark all as read</button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Bulk ignore</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active filters display */}
                    {(selectedTypes.length > 0 || selectedQuickFilters.length > 0 || searchQuery) && (
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-600 font-medium">Active filters:</span>
                            {selectedTypes.map(typeId => {
                                const type = ISSUE_TYPES.find(t => t.id === typeId);
                                return type ? (
                                    <span key={typeId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                                        <type.Icon className="h-3 w-3" /> {type.label}
                                        <button onClick={() => toggleType(typeId)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                                    </span>
                                ) : null;
                            })}
                            {selectedQuickFilters.map(filterId => {
                                const filter = QUICK_FILTERS.find(f => f.id === filterId);
                                return filter ? (
                                    <span key={filterId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                                        {filter.icon} {filter.label}
                                        <button onClick={() => toggleQuickFilter(filterId)} className="hover:text-purple-900"><X className="h-3 w-3" /></button>
                                    </span>
                                ) : null;
                            })}
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
                                    Search: &quot;{searchQuery}&quot;
                                    <button onClick={() => setSearchQuery('')} className="hover:text-gray-900"><X className="h-3 w-3" /></button>
                                </span>
                            )}
                            <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto">Clear all</button>
                        </div>
                    )}

                    {/* TABLE */}
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500 text-sm">Loading issues...</div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 mb-1">No issues found</h3>
                            <p className="text-xs text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Type</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Name</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Severity</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Location</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Fix time</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Status</th>
                                        <th className="px-2 py-3 w-10" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredIssues.map((issue) => {
                                        const conf      = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
                                        const typeIcon  = getTypeIcon(issue);
                                        const isNew     = isRecentlyDiscovered(issue);
                                        const isAutoIgnored = issue.status === 'ignored' && issue.is_false_positive;
                                        const isHovered = hoveredIssueId === issue.id;
                                        const menuOpen  = openMenuId === issue.id;

                                        let locationName = 'Unknown';
                                        if (issue.repository_id && issue.repositories) locationName = issue.repositories.full_name || 'Repo';
                                        else if (issue.domain_id && issue.domains?.domain) locationName = issue.domains.domain;
                                        else if (issue.pentests?.name) locationName = issue.pentests.name;

                                        const filePath = issue.file_path || issue.title?.split(' ')[0] || 'file.ts';

                                        return (
                                            <tr
                                                key={issue.id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer group relative"
                                                onClick={() => setSidebarId(issue.id)}
                                                onMouseEnter={() => setHoveredIssueId(issue.id)}
                                                onMouseLeave={() => setHoveredIssueId(null)}
                                            >
                                                {/* Type */}
                                                <td className="px-5 py-4">
                                                    <TypeBadge type={typeIcon} />
                                                </td>

                                                {/* Name — with hover card */}
                                                <td className="px-5 py-4 relative">
                                                    <div className="font-medium text-gray-900">{issue.title}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">in {filePath}</div>
                                                    {isHovered && <IssueHoverCard issue={issue} />}
                                                </td>

                                                {/* Severity */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                                        {conf.label}
                                                    </span>
                                                </td>

                                                {/* Location */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                        </svg>
                                                        <span className="text-sm">{locationName}</span>
                                                    </div>
                                                </td>

                                                {/* Fix time */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">{fixTime(issue.severity)}</td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    {isAutoIgnored ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-gray-100">Auto Ignored</span>
                                                    ) : isNew ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-purple-700 bg-purple-100 border border-purple-200">New</span>
                                                    ) : (
                                                        <button
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                                                            onClick={e => { e.stopPropagation(); setAutofixIssue(issue); }}
                                                        >
                                                            View Fix <ChevronRight className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Three dots menu */}
                                                <td className="px-2 py-4 relative" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${isHovered || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                        onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : issue.id); }}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                    {menuOpen && (
                                                        <RowMenu
                                                            issue={issue}
                                                            onAutofix={() => { setAutofixIssue(issue); setOpenMenuId(null); }}
                                                            onAddTask={() => { setAddTaskIssue(issue); setOpenMenuId(null); }}
                                                            onSnooze={() => { setSnoozeIssue(issue); setOpenMenuId(null); }}
                                                            onIgnore={() => { handleIgnoreIssue(issue); setOpenMenuId(null); }}
                                                            onCopyLink={() => { handleCopyLink(issue); setOpenMenuId(null); }}
                                                            onAdjustSeverity={() => { setAdjustSeverityIssue(issue); setOpenMenuId(null); }}
                                                            onClose={() => setOpenMenuId(null)}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
