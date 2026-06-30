"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Loader2, Share2, Link2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("cto_scan_reports")
                .select("*, cto_projects(name, company_name)")
                .order("created_at", { ascending: false });
            setReports(data || []);
            setLoading(false);
        };
        fetch();
    }, []);

    const toggleShare = async (id: string, enabled: boolean) => {
        await supabase.from("cto_scan_reports").update({ share_enabled: enabled }).eq("id", id);
        setReports(prev => prev.map(r => r.id === id ? { ...r, share_enabled: enabled } : r));
    };

    const copyLink = (token: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/shared-report/${token}`);
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">All generated pentest reports. Share with prospects.</p>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                    <FileText className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No reports yet. Launch a scan to generate one.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map(report => (
                        <div key={report.id} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center",
                                    report.status === "completed" ? "bg-green-500/10 text-green-400" :
                                    report.status === "running" ? "bg-amber-500/10 text-amber-400" :
                                    report.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-gray-500/10 text-gray-500"
                                )}>
                                    {report.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                     report.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                                     report.status === "failed" ? <XCircle className="h-4 w-4" /> :
                                     <Clock className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{report.title}</p>
                                    <p className="text-xs text-gray-600">{report.cto_projects?.company_name || report.cto_projects?.name} • {new Date(report.created_at).toLocaleDateString()}{report.duration_seconds ? ` • ${Math.round(report.duration_seconds / 60)}m` : ""}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {report.findings_summary && (
                                    <div className="flex gap-1 text-xs">
                                        {report.findings_summary.critical > 0 && <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">{report.findings_summary.critical}C</span>}
                                        {report.findings_summary.high > 0 && <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">{report.findings_summary.high}H</span>}
                                        {report.findings_summary.medium > 0 && <span className="bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">{report.findings_summary.medium}M</span>}
                                    </div>
                                )}
                                {report.status === "completed" && (
                                    <>
                                        <button onClick={() => toggleShare(report.id, !report.share_enabled)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors", report.share_enabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/[0.03] text-gray-500 border-white/[0.06] hover:text-white")}>
                                            <Share2 className="h-3 w-3" /> {report.share_enabled ? "Shared" : "Share"}
                                        </button>
                                        {report.share_enabled && (
                                            <button onClick={() => copyLink(report.share_token)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                                <Link2 className="h-3 w-3" /> Copy
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
