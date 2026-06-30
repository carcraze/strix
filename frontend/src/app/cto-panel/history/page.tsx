"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { History, Loader2, CheckCircle2, XCircle, Globe, GitBranch, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("cto_projects")
                .select("*")
                .in("status", ["completed", "closed"])
                .order("closed_at", { ascending: false });
            setProjects(data || []);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">History</h1>
                <p className="text-sm text-gray-500 mt-1">Completed and closed pentest engagements.</p>
            </div>

            {projects.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                    <History className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No completed projects yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {projects.map(proj => (
                        <div key={proj.id} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">{proj.name}</p>
                                    <p className="text-xs text-gray-500">{proj.company_name}</p>
                                </div>
                                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                    proj.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                )}>{proj.status}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                {proj.target_domains?.length > 0 && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {proj.target_domains.length} domains</span>}
                                {proj.target_repos?.length > 0 && <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {proj.target_repos.length} repos</span>}
                                {proj.closed_at && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Closed {new Date(proj.closed_at).toLocaleDateString()}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
