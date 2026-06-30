"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Terminal, Loader2, Zap, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LiveScansPage() {
    const [runningReports, setRunningReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("cto_scan_reports")
                .select("*, cto_projects(name, company_name)")
                .in("status", ["pending", "running"])
                .order("created_at", { ascending: false });
            setRunningReports(data || []);
            setLoading(false);
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Live Scans</h1>
                <p className="text-sm text-gray-500 mt-1">Active scan terminals streaming in real-time.</p>
            </div>

            {runningReports.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                    <Terminal className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No active scans right now.</p>
                    <p className="text-xs text-gray-600 mt-1">Launch a scan from a project to see live output here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {runningReports.map(report => (
                        <Link
                            key={report.id}
                            href={`/cto-panel/scan/${report.id}`}
                            className="block rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 hover:bg-amber-500/[0.06] transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{report.title}</p>
                                        <p className="text-xs text-gray-500">{report.cto_projects?.company_name || report.cto_projects?.name || "Unknown"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                                        {report.status}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>Started {new Date(report.created_at).toLocaleString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
