"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, BellOff, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getIssues } from "@/lib/queries";
import { IssueSidebar, fixTime } from "@/components/issues/IssueSidebar";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500",    label: "Critical" },
    high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", label: "High"     },
    medium:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500",   label: "Medium"   },
    low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Low"      },
};

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

export default function SnoozedPage() {
    const [loading, setLoading]         = useState(true);
    const [allIssues, setAllIssues]     = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarId, setSidebarId]     = useState<string | null>(null);
    const { activeWorkspace }           = useWorkspace();

    useEffect(() => {
        if (!activeWorkspace) return;
        setLoading(true);
        getIssues(activeWorkspace.id).then(data => {
            setAllIssues(data || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [activeWorkspace]);

    const filteredIssues = useMemo(() => {
        const now = new Date();
        return allIssues.filter(i => {
            const isSnoozed = i.status === 'snoozed' || (i.snoozed_until && new Date(i.snoozed_until) > now);
            if (!isSnoozed) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
            }
            return true;
        });
    }, [allIssues, searchQuery]);

    const getTypeIcon = (issue: any): string => {
        const fp = issue.file_path || issue.title || '';
        if (fp.includes('.ts'))   return 'TS';
        if (fp.includes('.js'))   return 'JS';
        if (fp.includes('.py'))   return 'PY';
        if (fp.includes('.go'))   return 'GO';
        if (issue.pentest_id || fp.includes('http')) return 'HTTP';
        return 'TS';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <IssueSidebar
                issueId={sidebarId}
                onClose={() => setSidebarId(null)}
                onStatusChange={(id, status) => setAllIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))}
                allIds={filteredIssues.map(i => i.id)}
            />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <BellOff className="h-6 w-6 text-gray-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Snoozed Issues</h1>
                    <span className="ml-auto text-sm text-gray-500">{filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search snoozed issues"
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500 text-sm">Loading…</div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <BellOff className="h-10 w-10 text-gray-300 mb-4" />
                            <h3 className="text-sm font-medium text-gray-600 mb-1">No snoozed issues</h3>
                            <p className="text-xs text-gray-500">Issues you snooze will appear here</p>
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
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Snoozed Until</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredIssues.map(issue => {
                                        const conf = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
                                        const typeIcon = getTypeIcon(issue);
                                        let locationName = 'Unknown';
                                        if (issue.repository_id && issue.repositories) locationName = issue.repositories.full_name || 'Repo';
                                        else if (issue.domain_id && issue.domains?.domain) locationName = issue.domains.domain;
                                        else if (issue.pentests?.name) locationName = issue.pentests.name;
                                        const filePath = issue.file_path || issue.title?.split(' ')[0] || 'file.ts';
                                        const until = issue.snoozed_until ? new Date(issue.snoozed_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                                        return (
                                            <tr key={issue.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSidebarId(issue.id)}>
                                                <td className="px-5 py-4"><TypeBadge type={typeIcon} /></td>
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-gray-900">{issue.title}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">in {filePath}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />{conf.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-700 text-sm">{locationName}</td>
                                                <td className="px-5 py-4 text-gray-600 text-sm">{fixTime(issue.severity)}</td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200">
                                                        <BellOff className="h-3.5 w-3.5" /> {until}
                                                    </span>
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
