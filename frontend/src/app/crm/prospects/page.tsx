"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    ExternalLink,
    Mail,
    Linkedin,
    ChevronDown,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    FileText
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
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

    // Filters
    const [stageFilter, setStageFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sdrFilter, setSdrFilter] = useState("all");

    // Pagination
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
            p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.founder_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStage = stageFilter === "all" || p.contact_status === stageFilter;
        const matchesStatus = statusFilter === "all" || p.outreach_status === statusFilter;
        const matchesSdr = sdrFilter === "all" || p.assigned_to === sdrFilter;

        return matchesSearch && matchesStage && matchesStatus && matchesSdr;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedProspects = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset to page 1 when filters or pageSize change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, stageFilter, statusFilter, sdrFilter, pageSize]);

    const getStageBadge = (stage: string) => {
        const labels: any = {
            prospect_identified: { text: "Identified", color: "text-blue-400 border-blue-400/20 bg-blue-400/10" },
            contacted: { text: "Contacted", color: "text-cyan-400 border-cyan-400/20 bg-cyan-400/10" },
            engaged: { text: "Engaged", color: "text-purple-400 border-purple-400/20 bg-purple-400/10" },
            signed_up: { text: "Signed Up", color: "text-green-400 border-green-400/20 bg-green-400/10" },
            active_user: { text: "Active", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" },
            paid_customer: { text: "Paid", color: "text-[var(--color-cyan)] border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/10" }
        };
        const l = labels[stage] || { text: stage, color: "text-gray-400 border-white/10 bg-white/5" };
        return <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border uppercase tracking-tighter ${l.color}`}>{l.text}</span>;
    };

    const getOutreachBadge = (status: string) => {
        const colors: any = {
            'Not contacted': 'text-[#555] border-white/5 bg-white/[0.02]',
            'Contacted': 'text-orange-400 border-orange-400/20 bg-orange-400/5',
            'Replied': 'text-[var(--color-cyan)] border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5',
            'Archived': 'text-red-400 border-red-400/20 bg-red-400/5'
        };
        return <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-tighter ${colors[status] || 'text-gray-500'}`}>{status}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-white tracking-tight uppercase">Prospects</h1>
                    <p className="text-[#666] mt-1 font-mono text-[10px] uppercase tracking-widest italic leading-none">Database Entry: Active Operations</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/crm/prospects/import"
                        className="flex items-center gap-2 bg-white/5 text-[#888] px-6 py-2.5 rounded-xl font-bold border border-white/10 hover:bg-white/10 hover:text-white transition-all text-xs uppercase tracking-tighter"
                    >
                        <FileText className="h-4 w-4" /> Import from Excel
                    </Link>
                    <Link
                        href="/crm/prospects/new"
                        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all text-xs uppercase tracking-tighter"
                    >
                        <Plus className="h-4 w-4" /> Acquire New Lead
                    </Link>
                </div>
            </div>

            <Card className="p-0 overflow-hidden bg-[#050505] border-white/5 shadow-2xl relative">
                {/* Search & Global Filters */}
                <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                        <input
                            type="text"
                            placeholder="Search by Company or Founder..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-[var(--color-cyan)]/50 transition-all font-mono"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono uppercase text-[#888] focus:border-[var(--color-cyan)]/50 outline-none"
                        >
                            <option value="all">Pipeline: All</option>
                            <option value="prospect_identified">Identified</option>
                            <option value="contacted">Contacted</option>
                            <option value="engaged">Engaged</option>
                            <option value="signed_up">Signed Up</option>
                            <option value="active_user">Active</option>
                            <option value="paid_customer">Paid</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono uppercase text-[#888] focus:border-[var(--color-cyan)]/50 outline-none"
                        >
                            <option value="all">Outreach: All</option>
                            <option value="Not contacted">Not Contacted</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Replied">Replied</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <select
                            value={sdrFilter}
                            onChange={(e) => setSdrFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono uppercase text-[#888] focus:border-[var(--color-cyan)]/50 outline-none"
                        >
                            <option value="all">SDR: All</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.unique_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/40">
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest pl-8">Company</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest">Founders</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest text-center">Stage</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest text-center">POC</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest px-4">Timeline</th>
                                <th className="p-4 text-[10px] font-mono text-[#444] uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="p-10 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : paginatedProspects.length > 0 ? paginatedProspects.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => router.push(`/crm/prospects/${p.id}`)}
                                    className="group hover:bg-white/[0.03] transition-all cursor-pointer relative"
                                >
                                    <td className="p-4 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center font-bold text-white text-sm shadow-inner overflow-hidden">
                                                {p.company_name[0]}
                                                {/* Ambient effect */}
                                                <div className="absolute inset-0 bg-[var(--color-cyan)] opacity-0 group-hover:opacity-10 transition-opacity" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-[var(--color-cyan)] transition-colors leading-tight">{p.company_name}</span>
                                                <span className="text-[10px] text-[#555] font-mono lowercase tracking-tighter hover:text-[#888]">{p.website || 'zentinel.ai'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {p.founders && Array.isArray(p.founders) && p.founders.length > 0 ? p.founders.slice(0, 3).map((f: any, i: number) => (
                                                <div key={i} className="h-7 w-7 rounded-lg border-2 border-black bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 group-hover:translate-y-[-2px] transition-transform duration-300" title={f.name}>
                                                    {f.name?.[0] || 'F'}
                                                </div>
                                            )) : (
                                                <span className="text-[10px] text-[#444] font-mono uppercase tracking-tighter">Unassigned</span>
                                            )}
                                            {p.founders && p.founders.length > 3 && (
                                                <div className="h-7 w-7 rounded-lg border-2 border-black bg-white/5 flex items-center justify-center text-[8px] font-bold text-[#555]">
                                                    +{p.founders.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStageBadge(p.contact_status)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getOutreachBadge(p.outreach_status)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "text-[10px] font-mono px-2 py-0.5 rounded uppercase",
                                            p.poc_sent ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-[#333] border border-white/5"
                                        )}>
                                            {p.poc_sent ? 'SENT' : 'NO'}
                                        </span>
                                    </td>
                                    <td className="p-4 px-4">
                                        <div className="flex flex-col gap-1 min-w-[120px]">
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#555]">
                                                <Clock className="h-3 w-3" />
                                                <span className="uppercase tracking-tighter">Due:</span>
                                                <span className="text-white/60">{p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#444]">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span className="uppercase tracking-tighter text-[8px]">SDR:</span>
                                                <span className="text-[#646464]">{p.crm_staff?.unique_name || 'UNASSIGNED'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 pr-8 text-right">
                                        <button className="h-8 w-8 rounded-lg border border-white/5 flex items-center justify-center text-[#444] group-hover:text-[var(--color-cyan)] group-hover:border-[var(--color-cyan)]/30 transition-all bg-white/0 group-hover:bg-[var(--color-cyan)]/5">
                                            <ChevronDown className="h-4 w-4 group-hover:rotate-0 -rotate-90 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-10">
                                            <Users className="h-16 w-16" />
                                            <p className="font-mono text-xs tracking-[0.4em] uppercase">No Assets Located</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Page Size</span>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            {[25, 50].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setPageSize(size)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-[10px] font-mono transition-all",
                                        pageSize === size
                                            ? "bg-[var(--color-cyan)] text-black font-bold shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                                            : "text-[#666] hover:text-[#888]"
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                            Showing <span className="text-white">{(currentPage - 1) * pageSize + 1}</span> - <span className="text-white">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="text-white">{filtered.length}</span> Assets
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-24 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase text-[#666] hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                Previous
                            </button>
                            <div className="text-[10px] font-mono text-white px-4">
                                {currentPage} / {Math.max(1, totalPages)}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-24 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase text-[#666] hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
