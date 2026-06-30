"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Plus, FolderOpen, Globe, GitBranch, Crosshair, Clock,
    CheckCircle2, XCircle, Play, Share2, Link2,
    FileText, Loader2, Search, Users, Zap, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type CTOProject = {
    id: string;
    prospect_id: string | null;
    name: string;
    company_name: string | null;
    target_domains: string[];
    target_repos: string[];
    status: "active" | "scanning" | "completed" | "closed";
    notes: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
};

type CTOReport = {
    id: string;
    project_id: string;
    pentest_id: string | null;
    title: string;
    status: "pending" | "running" | "completed" | "failed";
    share_token: string;
    share_enabled: boolean;
    findings_summary: any;
    duration_seconds: number | null;
    created_at: string;
    completed_at: string | null;
};

type Prospect = {
    id: string;
    company_name: string;
    website: string | null;
    founder_name: string | null;
    contact_status: string;
};

const STATUS_STYLES: Record<string, string> = {
    active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    scanning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function CTOPanelPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<CTOProject[]>([]);
    const [reports, setReports] = useState<CTOReport[]>([]);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewProject, setShowNewProject] = useState(false);
    const [selectedProject, setSelectedProject] = useState<CTOProject | null>(null);
    const [showLaunchScan, setShowLaunchScan] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [projRes, prospectsRes] = await Promise.all([
            supabase.from("cto_projects").select("*").order("created_at", { ascending: false }),
            supabase.from("prospects").select("id, company_name, website, founder_name, contact_status").order("company_name"),
        ]);
        setProjects(projRes.data || []);
        setProspects(prospectsRes.data || []);
        setLoading(false);
    }, []);

    const fetchReports = useCallback(async (projectId: string) => {
        const { data } = await supabase
            .from("cto_scan_reports")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });
        setReports(data || []);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        if (selectedProject) fetchReports(selectedProject.id);
    }, [selectedProject, fetchReports]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Offensive Testing</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Full pentest engagements. Katana recon → Strix deep scan. No gates.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewProject(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                    <Plus className="h-4 w-4" /> New Project
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Active", count: projects.filter(p => p.status === "active").length, icon: Crosshair, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                    { label: "Scanning", count: projects.filter(p => p.status === "scanning").length, icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                    { label: "Completed", count: projects.filter(p => p.status === "completed").length, icon: CheckCircle2, color: "text-green-400 bg-green-500/10 border-green-500/20" },
                    { label: "Closed", count: projects.filter(p => p.status === "closed").length, icon: XCircle, color: "text-gray-500 bg-gray-500/10 border-gray-500/20" },
                ].map(s => (
                    <div key={s.label} className={cn("rounded-xl border p-4 flex items-center gap-3", s.color)}>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/[0.04]">
                            <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{s.count}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Project List + Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project List */}
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.15em] px-1">Projects</p>
                    {projects.length === 0 ? (
                        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-8 text-center">
                            <FolderOpen className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No projects yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                            {projects.map(proj => (
                                <button
                                    key={proj.id}
                                    onClick={() => setSelectedProject(proj)}
                                    className={cn(
                                        "w-full text-left rounded-xl border p-4 transition-all",
                                        selectedProject?.id === proj.id
                                            ? "border-indigo-500/40 bg-indigo-500/[0.04]"
                                            : "border-white/[0.06] bg-[#0a0a0e] hover:border-white/[0.1] hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-white">{proj.name}</p>
                                            {proj.company_name && (
                                                <p className="text-xs text-gray-500">{proj.company_name}</p>
                                            )}
                                        </div>
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", STATUS_STYLES[proj.status])}>
                                            {proj.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                        {proj.target_domains.length > 0 && (
                                            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {proj.target_domains.length}</span>
                                        )}
                                        {proj.target_repos.length > 0 && (
                                            <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {proj.target_repos.length}</span>
                                        )}
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(proj.created_at).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Detail */}
                <div className="lg:col-span-2">
                    {selectedProject ? (
                        <ProjectDetail
                            project={selectedProject}
                            reports={reports}
                            onRefresh={() => { fetchData(); if (selectedProject) fetchReports(selectedProject.id); }}
                            onLaunchScan={() => setShowLaunchScan(true)}
                        />
                    ) : (
                        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-12 text-center">
                            <Crosshair className="h-10 w-10 text-gray-700 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">Select a project to view details and launch scans.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showNewProject && (
                <NewProjectModal prospects={prospects} onClose={() => setShowNewProject(false)} onCreated={() => { setShowNewProject(false); fetchData(); }} />
            )}
            {showLaunchScan && selectedProject && (
                <LaunchScanModal project={selectedProject} onClose={() => setShowLaunchScan(false)} onLaunched={() => { setShowLaunchScan(false); if (selectedProject) fetchReports(selectedProject.id); fetchData(); }} />
            )}
        </div>
    );
}


// ─── Project Detail ──────────────────────────────────────────────────────────
function ProjectDetail({ project, reports, onRefresh, onLaunchScan }: {
    project: CTOProject; reports: CTOReport[]; onRefresh: () => void; onLaunchScan: () => void;
}) {
    const router = useRouter();
    const [closing, setClosing] = useState(false);

    const handleClose = async () => {
        setClosing(true);
        await supabase.from("cto_projects").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", project.id);
        setClosing(false);
        onRefresh();
    };

    const handleToggleShare = async (reportId: string, enabled: boolean) => {
        await supabase.from("cto_scan_reports").update({ share_enabled: enabled }).eq("id", reportId);
        onRefresh();
    };

    const copyShareLink = (token: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/shared-report/${token}`);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">{project.name}</h2>
                        {project.company_name && <p className="text-sm text-gray-500 mt-0.5">{project.company_name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onLaunchScan} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-500 transition-colors">
                            <Play className="h-3.5 w-3.5" /> Launch Scan
                        </button>
                        {project.status !== "closed" && (
                            <button onClick={handleClose} disabled={closing} className="flex items-center gap-2 bg-white/[0.05] text-gray-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-50">
                                {closing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Close
                            </button>
                        )}
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wider mb-2">Targets</p>
                        {project.target_domains.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300 bg-white/[0.03] rounded-lg px-3 py-1.5 mb-1 border border-white/[0.05]">
                                <Globe className="h-3.5 w-3.5 text-gray-600" /> {d}
                            </div>
                        ))}
                        {project.target_domains.length === 0 && <p className="text-xs text-gray-600 italic">No domains</p>}
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wider mb-2">Repos</p>
                        {project.target_repos.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300 bg-white/[0.03] rounded-lg px-3 py-1.5 mb-1 border border-white/[0.05]">
                                <GitBranch className="h-3.5 w-3.5 text-gray-600" /> {r}
                            </div>
                        ))}
                        {project.target_repos.length === 0 && <p className="text-xs text-gray-600 italic">No repos</p>}
                    </div>
                </div>
                {project.notes && (
                    <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <p className="text-xs text-amber-400">{project.notes}</p>
                    </div>
                )}
            </div>

            {/* Reports */}
            <div>
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.15em] mb-3 px-1">Scan Reports ({reports.length})</p>
                {reports.length === 0 ? (
                    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-8 text-center">
                        <FileText className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No scans yet. Launch one.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {reports.map(report => (
                            <div key={report.id} className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center",
                                        report.status === "completed" ? "bg-green-500/10 text-green-400" :
                                        report.status === "running" ? "bg-amber-500/10 text-amber-400" :
                                        report.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-gray-500/10 text-gray-500"
                                    )}>
                                        {report.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{report.title}</p>
                                        <p className="text-xs text-gray-600">{new Date(report.created_at).toLocaleString()}{report.duration_seconds ? ` • ${Math.round(report.duration_seconds / 60)}m` : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {report.status === "running" && (
                                        <button onClick={() => router.push(`/cto-panel/scan/${report.id}`)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
                                            <Zap className="h-3 w-3" /> Live
                                        </button>
                                    )}
                                    {report.status === "completed" && (
                                        <>
                                            <button onClick={() => handleToggleShare(report.id, !report.share_enabled)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors", report.share_enabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/[0.03] text-gray-500 border-white/[0.06] hover:text-white")}>
                                                <Share2 className="h-3 w-3" /> {report.share_enabled ? "Shared" : "Share"}
                                            </button>
                                            {report.share_enabled && (
                                                <button onClick={() => copyShareLink(report.share_token)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                                    <Link2 className="h-3 w-3" /> Copy
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {report.findings_summary && Object.keys(report.findings_summary).length > 0 && (
                                        <div className="flex items-center gap-1 text-xs">
                                            {report.findings_summary.critical > 0 && <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">{report.findings_summary.critical}C</span>}
                                            {report.findings_summary.high > 0 && <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">{report.findings_summary.high}H</span>}
                                            {report.findings_summary.medium > 0 && <span className="bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">{report.findings_summary.medium}M</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── New Project Modal ───────────────────────────────────────────────────────
function NewProjectModal({ prospects, onClose, onCreated }: { prospects: Prospect[]; onClose: () => void; onCreated: () => void; }) {
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [domains, setDomains] = useState("");
    const [repos, setRepos] = useState("");
    const [notes, setNotes] = useState("");
    const [prospectId, setProspectId] = useState<string | null>(null);
    const [prospectSearch, setProspectSearch] = useState("");
    const [creating, setCreating] = useState(false);

    const filteredProspects = prospects.filter(p =>
        p.company_name.toLowerCase().includes(prospectSearch.toLowerCase()) ||
        (p.founder_name && p.founder_name.toLowerCase().includes(prospectSearch.toLowerCase()))
    ).slice(0, 8);

    const handleSelectProspect = (p: Prospect) => {
        setProspectId(p.id); setCompanyName(p.company_name);
        if (p.website) setDomains(p.website.replace(/^https?:\/\//, "").replace(/\/$/, ""));
        setName(`${p.company_name} Pentest`); setProspectSearch("");
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setCreating(true);
        await supabase.from("cto_projects").insert({
            name: name.trim(), company_name: companyName.trim() || null, prospect_id: prospectId,
            target_domains: domains.split(/[,\n]/).map(d => d.trim()).filter(Boolean),
            target_repos: repos.split(/[,\n]/).map(r => r.trim()).filter(Boolean),
            notes: notes.trim() || null,
        });
        setCreating(false); onCreated();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#111114] rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-white/[0.06] shrink-0">
                    <h2 className="text-lg font-bold text-white">New Project</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Link to a CRM prospect or create standalone.</p>
                </div>
                <div className="p-5 space-y-3 overflow-y-auto flex-1">
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Link Prospect</label>
                        <div className="relative mt-1">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input type="text" value={prospectSearch} onChange={e => setProspectSearch(e.target.value)} placeholder="Search prospects..."
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50" />
                        </div>
                        {prospectSearch && filteredProspects.length > 0 && (
                            <div className="mt-1 max-h-28 overflow-y-auto bg-[#0a0a0e] border border-white/[0.08] rounded-lg">
                                {filteredProspects.map(p => (
                                    <button key={p.id} onClick={() => handleSelectProspect(p)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/[0.04] flex justify-between">
                                        <span className="text-white">{p.company_name}</span>
                                        <span className="text-gray-600 text-xs">{p.founder_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {prospectId && <p className="text-xs text-green-400 mt-1">✓ Linked: {companyName}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Project Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp Pentest"
                            className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Company</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name"
                            className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Target Domains</label>
                        <textarea value={domains} onChange={e => setDomains(e.target.value)} placeholder={"example.com\napi.example.com"} rows={2}
                            className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Repos (optional)</label>
                        <textarea value={repos} onChange={e => setRepos(e.target.value)} placeholder="org/repo" rows={1}
                            className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context..." rows={1}
                            className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    </div>
                </div>
                <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleCreate} disabled={!name.trim() || creating} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Launch Scan Modal ───────────────────────────────────────────────────────
function LaunchScanModal({ project, onClose, onLaunched }: { project: CTOProject; onClose: () => void; onLaunched: () => void; }) {
    const router = useRouter();
    const [title, setTitle] = useState(`Full Pentest — ${new Date().toLocaleDateString()}`);
    const [customContext, setCustomContext] = useState("");
    const [credentials, setCredentials] = useState("");
    const [launching, setLaunching] = useState(false);

    const handleLaunch = async () => {
        setLaunching(true);
        const { data: report, error } = await supabase.from("cto_scan_reports").insert({
            project_id: project.id, title: title.trim(), status: "pending",
            strix_config: { scan_mode: "deep", katana_enrichment: true, domains: project.target_domains, repos: project.target_repos, custom_context: customContext, credentials },
        }).select().single();

        if (error || !report) { setLaunching(false); return; }

        await supabase.from("cto_projects").update({ status: "scanning", updated_at: new Date().toISOString() }).eq("id", project.id);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const strixInstruction = buildStrixInstruction(project, customContext, credentials);
            await fetch(`${process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "https://zentinel-api-666780032513.us-central1.run.app"}/api/cto/launch-scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                body: JSON.stringify({
                    report_id: report.id, project_id: project.id, name: title,
                    domains: project.target_domains, repos: project.target_repos.map(r => ({ full_name: r, branch: "main" })),
                    strix_instruction: strixInstruction, app_description: customContext || `Pentest for ${project.company_name || project.name}`,
                    testing_focus: "Maximum coverage - all attack vectors",
                }),
            });
        } catch (e) { console.error("Launch error:", e); }

        setLaunching(false); onLaunched();
        router.push(`/cto-panel/scan/${report.id}`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#111114] rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/[0.06]">
                    <h2 className="text-lg font-bold text-white">Launch Full Pentest</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Katana recon → Strix deep scan. All specialists, no limits.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
                        <p className="text-[10px] font-medium text-indigo-400 uppercase mb-1">Targets</p>
                        <p className="text-sm text-indigo-300">{project.target_domains.join(", ") || "None"}{project.target_repos.length > 0 ? ` + ${project.target_repos.length} repo(s)` : ""}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Scan Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full mt-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Context (tech stack, auth flow, etc.)</label>
                        <textarea value={customContext} onChange={e => setCustomContext(e.target.value)} placeholder="e.g. Next.js + Supabase, JWT auth, REST API at /api/v1" rows={3}
                            className="w-full mt-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Credentials</label>
                        <textarea value={credentials} onChange={e => setCredentials(e.target.value)} placeholder="admin:pass123" rows={2}
                            className="w-full mt-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 px-3 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <span>• Mode: <strong className="text-white">Deep</strong></span>
                        <span>• Katana: <strong className="text-white">Headless</strong></span>
                        <span>• Specialists: <strong className="text-white">All</strong></span>
                        <span>• SQLi/XSS/SSRF: <strong className="text-white">Yes</strong></span>
                    </div>
                </div>
                <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleLaunch} disabled={launching} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors">
                        {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Launch Offensive Scan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Strix Instruction Builder ───────────────────────────────────────────────
function buildStrixInstruction(project: CTOProject, context: string, creds: string): string {
    return `## CTO PENTEST — FULL OFFENSIVE MODE
### Target: ${project.name} (${project.company_name || "N/A"})
### Domains: ${project.target_domains.map(d => `\n- ${d}`).join("") || "None"}
### Repos: ${project.target_repos.map(r => `\n- ${r}`).join("") || "None"}
### Rules:
- AUTHORIZED full-scope penetration test. Test EVERYTHING.
- Use Katana output to attack ALL discovered endpoints.
- Run ALL specialists: SQLi, XSS, SSRF, IDOR, Auth Bypass, API abuse, Subdomain takeover, Secrets, CSRF, RCE, LFI/RFI.
- For each vuln: full PoC (curl), severity, impact, remediation.
- Generate professional pentest report.
### Context: ${context || "Discover via recon."}
### Credentials: ${creds || "None. Test unauthenticated + auth bypass."}
### Config: Deep mode, all tools, all specialists, max timeout, Katana headless crawl depth=5.`.trim();
}
