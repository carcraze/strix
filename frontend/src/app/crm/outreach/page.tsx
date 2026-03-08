"use client";

import { useEffect, useState } from "react";
import {
    MessageSquare,
    Search,
    Clock,
    User,
    ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function OutreachLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('outreach_logs')
                .select('*, prospects(company_name), crm_staff(unique_name)')
                .order('created_at', { ascending: false });
            setLogs(data || []);
            setLoading(false);
        };
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-syne font-bold text-white tracking-tight">Outreach Log</h1>
                <p className="text-[#666] mt-1 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">Real-time Feed of All Interactions</p>
            </div>

            <Card className="p-0 overflow-hidden bg-[#050505] border-white/5 shadow-2xl">
                <div className="divide-y divide-white/5">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="p-12 animate-pulse" />
                        ))
                    ) : logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="p-6 hover:bg-white/[0.01] transition-all flex gap-6 group">
                            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-4 w-4 text-[#444] group-hover:text-[var(--color-cyan)] transition-colors" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-white">{log.crm_staff?.unique_name}</span>
                                        <span className="text-[10px] text-[#444] font-mono">contacted</span>
                                        <Link href={`/crm/prospects/${log.prospect_id}`} className="text-sm font-bold text-[var(--color-cyan)] hover:underline">
                                            {log.prospects?.company_name}
                                        </Link>
                                    </div>
                                    <span className="text-[10px] text-[#444] font-mono flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#888] font-mono leading-relaxed truncate max-w-3xl">
                                    {log.content}
                                </div>
                            </div>
                            <Link
                                href={`/crm/prospects/${log.prospect_id}`}
                                className="h-8 w-8 rounded-lg border border-white/5 flex items-center justify-center text-[#333] hover:text-white hover:bg-white/5 transition-all mt-1"
                            >
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )) : (
                        <div className="p-20 text-center text-[#333]">
                            <p className="font-mono text-xs italic uppercase tracking-widest">Feed is empty</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
