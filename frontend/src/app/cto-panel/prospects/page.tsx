"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Loader2, Globe, Mail, Linkedin, ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CRMProspectsPage() {
    const [prospects, setProspects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const fetch = async () => {
            let query = supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(100);
            if (filter !== "all") query = query.eq("contact_status", filter);
            const { data } = await query;
            setProspects(data || []);
            setLoading(false);
        };
        fetch();
    }, [filter]);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    const FILTERS = [
        { value: "all", label: "All" },
        { value: "prospect_identified", label: "Identified" },
        { value: "contacted", label: "Contacted" },
        { value: "engaged", label: "Engaged" },
        { value: "signed_up", label: "Signed Up" },
        { value: "paid_customer", label: "Paid" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">CRM Prospects</h1>
                    <p className="text-sm text-gray-500 mt-1">Pipeline targets for pentest engagements. {prospects.length} prospects.</p>
                </div>
                <Link href="/crm/prospects/new" target="_blank" className="flex items-center gap-2 bg-white/[0.05] text-gray-300 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/[0.08] hover:text-white border border-white/[0.08] transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add in CRM
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {FILTERS.map(f => (
                    <button key={f.value} onClick={() => { setLoading(true); setFilter(f.value); }}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                            filter === f.value ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/[0.02] text-gray-500 border-white/[0.06] hover:text-white"
                        )}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {prospects.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                    <Users className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No prospects matching filter.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {prospects.map(p => (
                        <div key={p.id} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4 flex items-center justify-between hover:border-white/[0.1] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold text-gray-400 border border-white/[0.06]">
                                    {p.company_name?.[0] || "?"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{p.company_name}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        {p.founder_name && <span>{p.founder_name}</span>}
                                        {p.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.website.replace(/^https?:\/\//, "").slice(0, 25)}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                    p.contact_status === "paid_customer" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                    p.contact_status === "signed_up" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    p.contact_status === "engaged" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                    p.contact_status === "contacted" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                )}>{p.contact_status?.replace("_", " ")}</span>
                                {p.linkedin_profile && <a href={p.linkedin_profile} target="_blank" rel="noopener" className="text-gray-600 hover:text-blue-400"><Linkedin className="h-3.5 w-3.5" /></a>}
                                {p.email && <a href={`mailto:${p.email}`} className="text-gray-600 hover:text-white"><Mail className="h-3.5 w-3.5" /></a>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
