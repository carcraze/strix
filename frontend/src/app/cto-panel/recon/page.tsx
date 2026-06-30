"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Globe, Loader2, Code2, Shield, Key, FileCode, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttackSurfacePage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("cto_scan_reports")
                .select("id, title, katana_output, created_at, cto_projects(name, company_name)")
                .not("katana_output", "eq", "{}")
                .order("created_at", { ascending: false });
            setReports(data || []);
            if (data && data.length > 0) setSelectedReport(data[0]);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    const katana = selectedReport?.katana_output || {};
    const summary = katana.summary || {};

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Attack Surface</h1>
                <p className="text-sm text-gray-500 mt-1">Katana recon data from past scans.</p>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                    <Globe className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No recon data yet. Launch a scan with Katana to see results here.</p>
                </div>
            ) : (
                <>
                    {/* Report selector */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {reports.map(r => (
                            <button key={r.id} onClick={() => setSelectedReport(r)}
                                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors",
                                    selectedReport?.id === r.id ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/[0.02] text-gray-500 border-white/[0.06] hover:text-white"
                                )}>
                                {r.cto_projects?.company_name || r.title}
                            </button>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                            { label: "Endpoints", value: summary.total_endpoints || 0, icon: Globe },
                            { label: "Subdomains", value: summary.total_subdomains || 0, icon: Server },
                            { label: "JS Files", value: summary.total_js_files || 0, icon: FileCode },
                            { label: "Forms", value: summary.total_forms || 0, icon: Code2 },
                            { label: "Technologies", value: summary.total_technologies || 0, icon: Shield },
                            { label: "Secrets", value: summary.total_secrets || 0, icon: Key },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4 text-center">
                                <s.icon className="h-4 w-4 text-gray-600 mx-auto mb-2" />
                                <p className="text-lg font-bold text-white">{s.value}</p>
                                <p className="text-[10px] text-gray-600 uppercase">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Data sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {katana.subdomains?.length > 0 && (
                            <DataSection title="Subdomains" items={katana.subdomains} icon={Server} />
                        )}
                        {katana.technologies?.length > 0 && (
                            <DataSection title="Technologies" items={katana.technologies} icon={Shield} />
                        )}
                        {katana.js_files?.length > 0 && (
                            <DataSection title="JavaScript Files" items={katana.js_files.slice(0, 50)} icon={FileCode} />
                        )}
                        {katana.secrets?.length > 0 && (
                            <DataSection title="Secrets Found" items={katana.secrets} icon={Key} color="text-red-400" />
                        )}
                    </div>

                    {katana.endpoints_sample?.length > 0 && (
                        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Discovered Endpoints (sample)</p>
                            <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
                                {katana.endpoints_sample.slice(0, 100).map((ep: string, i: number) => (
                                    <p key={i} className="text-gray-400 truncate hover:text-white transition-colors">{ep}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DataSection({ title, items, icon: Icon, color = "text-gray-400" }: { title: string; items: string[]; icon: any; color?: string }) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4">
            <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("h-4 w-4", color)} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title} ({items.length})</p>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
                {items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-400 font-mono truncate">{item}</p>
                ))}
            </div>
        </div>
    );
}
