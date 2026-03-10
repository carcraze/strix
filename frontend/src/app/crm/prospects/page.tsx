"use client";

import { useEffect, useState } from "react";
import {
    Users, Search, Plus, ChevronRight, Clock, CheckCircle2, FileText
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProspectsPage() {
    const router = useRouter();
    const [prospects, setProspects] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sdrFilter, setSdrFilter] = useState("all");
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [prospectsRes, staffRes] = await Promise.all([
                supabase.from('prospects').select('*, crm_staff(unique_name)').order('created_at', { ascending: false }),
                supabase.from('crm_staff').select('*').eq('is_active', true)
            ]);
            setProspects(prospectsRes.data || []);
            setStaffList(staffRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filtered = prospects.filter(p => {
        const matchesSearch =
            p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.founders?.some((f: any) => f.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStage = stageFilter === "all" || p.contact_status === stageFilter;
        const matchesStatus = statusFilter === "all" || p.outreach_status === statusFilter;
        const matchesSdr = sdrFilter === "all" || p.assigned_to === sdrFilter;
        return matchesSearch && matchesStage && matchesStatus && matchesSdr;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, stageFilter, statusFilter, sdrFilter, pageSize]);

    const getStageBadge = (stage: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            prospect_identified: { label: 'Identified', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
            contacted: { label: 'Contacted', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
            engaged: { label: 'Engaged', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
            signed_up: { label: 'Signed Up', cls: 'bg-green-50 text-[#16a34a] border-green-200' },
            active_user: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            paid_customer: { label: 'Paid', cls: 'bg-[#0a0a0a] text-white border-[#0a0a0a]' },
        };
        const m = map[stage] || { label: stage, cls: 'bg-[#f1f3f5] text-[#6b7280] border-[#e5e7eb]' };
        return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${m.cls}`}>{m.label}</span>;
    };

    const getOutreachBadge = (status: string) => {
        const map: Record<string, string> = {
            'Not contacted': 'bg-[#f1f3f5] text-[#9ca3af] border-[#e5e7eb]',
            'Contacted': 'bg-amber-50 text-amber-700 border-amber-200',
            'Replied': 'bg-green-50 text-[#16a34a] border-green-200',
            'Archived': 'bg-red-50 text-[#dc2626] border-red-200',
        };
        return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status] || 'bg-[#f1f3f5] text-[#9ca3af] border-[#e5e7eb]'}`}>{status || '—'}</span>;
    };

    const selectCls = "bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a0a0a]">Prospects</h1>
                    <p className="text-sm text-[#6b7280] mt-0.5">{prospects.length} total prospects</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/crm/prospects/import"
                        className="flex items-center gap-2 border border-[#e5e7eb] text-[#6b7280] px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#f1f3f5] hover:text-[#0a0a0a] transition-colors"
                    >
                        <FileText className="h-4 w-4" /> Import Excel
                    </Link>
                    <Link
                        href="/crm/prospects/new"
                        className="flex items-center gap-2 bg-[#0a0a0a] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#1f1f1f] transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Add Prospect
                    </Link>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-[#e5e7eb] flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            type="text"
                            placeholder="Search by company or founder..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg py-2 pl-9 pr-4 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder:text-[#9ca3af]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className={selectCls}>
                            <option value="all">Pipeline: All</option>
                            <option value="prospect_identified">Identified</option>
                            <option value="contacted">Contacted</option>
                            <option value="engaged">Engaged</option>
                            <option value="signed_up">Signed Up</option>
                            <option value="active_user">Active</option>
                            <option value="paid_customer">Paid</option>
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                            <option value="all">Outreach: All</option>
                            <option value="Not contacted">Not Contacted</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Replied">Replied</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <select value={sdrFilter} onChange={e => setSdrFilter(e.target.value)} className={selectCls}>
                            <option value="all">SDR: All</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.unique_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-[#f8f9fa] border-b border-[#e5e7eb]">
                                <th className="px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Company</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Founders</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider text-center">Stage</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider text-center">Outreach</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider text-center">POC</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">SDR</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Due</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f3f5]">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-5 py-4">
                                            <div className="h-4 bg-[#f1f3f5] rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginated.length > 0 ? paginated.map(p => (
                                <tr
                                    key={p.id}
                                    onClick={() => router.push(`/crm/prospects/${p.id}`)}
                                    className="hover:bg-[#f8f9fa] cursor-pointer transition-colors group"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                {p.company_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#0a0a0a] group-hover:text-[#0a0a0a]">{p.company_name}</p>
                                                <p className="text-xs text-[#9ca3af] truncate max-w-[180px]">{p.website || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex -space-x-1.5">
                                            {p.founders && p.founders.length > 0 ? p.founders.slice(0, 3).map((f: any, i: number) => (
                                                <div key={i} title={f.name} className="h-7 w-7 rounded-full bg-[#f1f3f5] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#6b7280]">
                                                    {f.name?.[0] || 'F'}
                                                </div>
                                            )) : <span className="text-xs text-[#9ca3af]">—</span>}
                                            {p.founders?.length > 3 && (
                                                <div className="h-7 w-7 rounded-full bg-[#f1f3f5] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#9ca3af]">
                                                    +{p.founders.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">{getStageBadge(p.contact_status)}</td>
                                    <td className="px-4 py-3 text-center">{getOutreachBadge(p.outreach_status)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn(
                                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                            p.poc_sent ? "bg-green-50 text-[#16a34a] border-green-200" : "bg-[#f1f3f5] text-[#9ca3af] border-[#e5e7eb]"
                                        )}>
                                            {p.poc_sent ? 'Sent' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-[#6b7280]">{p.crm_staff?.unique_name || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-[#6b7280]">{p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight className="h-4 w-4 text-[#9ca3af] group-hover:text-[#0a0a0a] transition-colors ml-auto" />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <Users className="h-10 w-10 text-[#e5e7eb] mx-auto mb-3" />
                                        <p className="text-sm text-[#9ca3af]">No prospects found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between">
                    <span className="text-xs text-[#6b7280]">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs text-[#6b7280] hover:bg-white hover:text-[#0a0a0a] disabled:opacity-30 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-[#6b7280]">{currentPage} / {Math.max(1, totalPages)}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs text-[#6b7280] hover:bg-white hover:text-[#0a0a0a] disabled:opacity-30 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
