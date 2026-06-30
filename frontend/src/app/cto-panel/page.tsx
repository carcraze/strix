"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Plus, FolderOpen, Globe, GitBranch, Crosshair, Clock,
    CheckCircle2, XCircle, Play, Share2, Trash2, Link2,
    FileText, Loader2, ChevronRight, Search, Users
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

const STATUS_STYLES = {
    active: "bg-blue-50 text-blue-700 border-blue-200",
    scanning: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function CTOPanelPage() {
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
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Offensive Testing Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Full pentest engagements for prospects. No limits, no verification, max power.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewProject(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" /> New Project
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Active", count: projects.filter(p => p.status === "active").length, icon: Crosshair, color: "text-blue-600 bg-blue-50" },
                    { label: "Scanning", count: projects.filter(p => p.status === "scanning").length, icon: Play, color: "text-amber-600 bg-amber-50" },
                    { label: "Completed", count: projects.filter(p => p.status === "completed").length, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
                    { label: "Closed", count: projects.filter(p => p.status === "closed").length, icon: XCircle, color: "text-gray-600 bg-gray-100" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.color)}>
                            <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Project List + Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project List */}
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Projects</p>
                    {projects.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <FolderOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No projects yet. Create one to start testing.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {projects.map(proj => (
                                <button
                                    key={proj.id}
                                    onClick={() => setSelectedProject(proj)}
                                    className={cn(
                                        "w-full text-left bg-white rounded-xl border p-4 transition-all hover:shadow-sm",
                                        selectedProject?.id === proj.id
                                            ? "border-indigo-300 ring-2 ring-indigo-100"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-900">{proj.name}</p>
                                            {proj.company_name && (
                                                <p className="text-xs text-gray-500">{proj.company_name}</p>
                                            )}
                                        </div>
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", STATUS_STYLES[proj.status])}>
                                            {proj.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                        {proj.target_domains.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3" /> {proj.target_domains.length}
                                            </span>
                                        )}
                                        {proj.target_repos.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <GitBranch className="h-3 w-3" /> {proj.target_repos.length}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {new Date(proj.created_at).toLocaleDateString()}
                                        </span>
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
                            onRefresh={() => {
                                fetchData();
                                fetchReports(selectedProject.id);
                            }}
                            onLaunchScan={() => setShowLaunchScan(true)}
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Crosshair className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">Select a project to view details and launch scans.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Project Modal */}
            {showNewProject && (
                <NewProjectModal
                    prospects={prospects}
                    onClose={() => setShowNewProject(false)}
                    onCreated={() => { setShowNewProject(false); fetchData(); }}
                />
            )}

            {/* Launch Scan Modal */}
            {showLaunchScan && selectedProject && (
                <LaunchScanModal
                    project={selectedProject}
                    onClose={() => setShowLaunchScan(false)}
                    onLaunched={() => {
                        setShowLaunchScan(false);
                        fetchReports(selectedProject.id);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}


// ─── Project Detail Component ────────────────────────────────────────────────
function ProjectDetail({
    project,
    reports,
    onRefresh,
    onLaunchScan,
}: {
    project: CTOProject;
    reports: CTOReport[];
    onRefresh: () => void;
    onLaunchScan: () => void;
}) {
    const [closing, setClosing] = useState(false);

    const handleClose = async () => {
        setClosing(true);
        await supabase
            .from("cto_projects")
            .update({ status: "closed", closed_at: new Date().toISOString() })
            .eq("id", project.id);
        setClosing(false);
        onRefresh();
    };

    const handleToggleShare = async (reportId: string, enabled: boolean) => {
        await supabase
            .from("cto_scan_reports")
            .update({ share_enabled: enabled })
            .eq("id", reportId);
        onRefresh();
    };

    const copyShareLink = (token: string) => {
        const url = `${window.location.origin}/shared-report/${token}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <div className="space-y-6">
            {/* Project Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{project.name}</h2>
                        {project.company_name && (
                            <p className="text-sm text-gray-500 mt-0.5">{project.company_name}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onLaunchScan}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Play className="h-3.5 w-3.5" /> Launch Scan
                        </button>
                        {project.status !== "closed" && (
                            <button
                                onClick={handleClose}
                                disabled={closing}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {closing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Close Project
                            </button>
                        )}
                    </div>
                </div>

                {/* Targets */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Target Domains</p>
                        <div className="space-y-1">
                            {project.target_domains.length > 0 ? project.target_domains.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
                                    <Globe className="h-3.5 w-3.5 text-gray-400" /> {d}
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 italic">No domains added</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Target Repos</p>
                        <div className="space-y-1">
                            {project.target_repos.length > 0 ? project.target_repos.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
                                    <GitBranch className="h-3.5 w-3.5 text-gray-400" /> {r}
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 italic">No repos added</p>
                            )}
                        </div>
                    </div>
                </div>

                {project.notes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                        <p className="text-sm text-amber-900">{project.notes}</p>
                    </div>
                )}
            </div>

            {/* Reports */}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
                    Scan Reports ({reports.length})
                </p>
                {reports.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No scans yet. Launch one to generate a report.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map(report => (
                            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center",
                                            report.status === "completed" ? "bg-green-50 text-green-600" :
                                            report.status === "running" ? "bg-amber-50 text-amber-600" :
                                            report.status === "failed" ? "bg-red-50 text-red-600" :
                                            "bg-gray-50 text-gray-400"
                                        )}>
                                            {report.status === "running" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{report.title}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(report.created_at).toLocaleString()}
                                                {report.duration_seconds && ` • ${Math.round(report.duration_seconds / 60)}m`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {report.status === "completed" && (
                                            <>
                                                <button
                                                    onClick={() => handleToggleShare(report.id, !report.share_enabled)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                        report.share_enabled
                                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    )}
                                                >
                                                    <Share2 className="h-3 w-3" />
                                                    {report.share_enabled ? "Shared" : "Share"}
                                                </button>
                                                {report.share_enabled && (
                                                    <button
                                                        onClick={() => copyShareLink(report.share_token)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Link2 className="h-3 w-3" /> Copy Link
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {report.findings_summary && Object.keys(report.findings_summary).length > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                {report.findings_summary.critical > 0 && (
                                                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                                                        {report.findings_summary.critical}C
                                                    </span>
                                                )}
                                                {report.findings_summary.high > 0 && (
                                                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                                        {report.findings_summary.high}H
                                                    </span>
                                                )}
                                                {report.findings_summary.medium > 0 && (
                                                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                                                        {report.findings_summary.medium}M
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
function NewProjectModal({
    prospects,
    onClose,
    onCreated,
}: {
    prospects: Prospect[];
    onClose: () => void;
    onCreated: () => void;
}) {
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
        setProspectId(p.id);
        setCompanyName(p.company_name);
        if (p.website) {
            setDomains(p.website.replace(/^https?:\/\//, "").replace(/\/$/, ""));
        }
        setName(`${p.company_name} Pentest`);
        setProspectSearch("");
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setCreating(true);
        const domainList = domains.split(/[,\n]/).map(d => d.trim()).filter(Boolean);
        const repoList = repos.split(/[,\n]/).map(r => r.trim()).filter(Boolean);

        await supabase.from("cto_projects").insert({
            name: name.trim(),
            company_name: companyName.trim() || null,
            prospect_id: prospectId,
            target_domains: domainList,
            target_repos: repoList,
            notes: notes.trim() || null,
        });

        setCreating(false);
        onCreated();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">New Pentest Project</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Link to a CRM prospect or create standalone.</p>
                </div>
                <div className="p-6 space-y-4">
                    {/* Prospect Link */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Link to Prospect (optional)</label>
                        <div className="relative mt-1.5">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={prospectSearch}
                                onChange={e => setProspectSearch(e.target.value)}
                                placeholder="Search prospects..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                        {prospectSearch && (
                            <div className="mt-2 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                {filteredProspects.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectProspect(p)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between"
                                    >
                                        <span className="font-medium text-gray-900">{p.company_name}</span>
                                        <span className="text-xs text-gray-400">{p.founder_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {prospectId && (
                            <p className="text-xs text-green-600 mt-1">✓ Linked to: {companyName}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Corp Pentest"
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Target Domains (one per line or comma-separated)</label>
                        <textarea
                            value={domains}
                            onChange={e => setDomains(e.target.value)}
                            placeholder={"example.com\napi.example.com"}
                            rows={3}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Target Repos (optional, one per line)</label>
                        <textarea
                            value={repos}
                            onChange={e => setRepos(e.target.value)}
                            placeholder={"org/repo-name"}
                            rows={2}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Context about the engagement..."
                            rows={2}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || creating}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Launch Scan Modal ───────────────────────────────────────────────────────
function LaunchScanModal({
    project,
    onClose,
    onLaunched,
}: {
    project: CTOProject;
    onClose: () => void;
    onLaunched: () => void;
}) {
    const router = useRouter();
    const [title, setTitle] = useState(`Full Pentest — ${new Date().toLocaleDateString()}`);
    const [customContext, setCustomContext] = useState("");
    const [credentials, setCredentials] = useState("");
    const [launching, setLaunching] = useState(false);

    const handleLaunch = async () => {
        setLaunching(true);

        // 1. Create the report record
        const { data: report, error: reportErr } = await supabase
            .from("cto_scan_reports")
            .insert({
                project_id: project.id,
                title: title.trim(),
                status: "pending",
                strix_config: {
                    scan_mode: "deep",
                    max_specialists: "all",
                    katana_enrichment: true,
                    domains: project.target_domains,
                    repos: project.target_repos,
                    custom_context: customContext,
                    credentials: credentials,
                },
            })
            .select()
            .single();

        if (reportErr || !report) {
            setLaunching(false);
            return;
        }

        // 2. Update project status
        await supabase
            .from("cto_projects")
            .update({ status: "scanning", updated_at: new Date().toISOString() })
            .eq("id", project.id);

        // 3. Call CTO-specific backend endpoint (bypasses all gates)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const strixInstruction = buildStrixInstruction(project, customContext, credentials);

            await fetch(`${process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "https://zentinel-api-666780032513.us-central1.run.app"}/api/cto/launch-scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    report_id: report.id,
                    project_id: project.id,
                    name: title,
                    domains: project.target_domains,
                    repos: project.target_repos.map(r => ({ full_name: r, branch: "main" })),
                    strix_instruction: strixInstruction,
                    app_description: customContext || `Full offensive pentest for ${project.company_name || project.name}`,
                    testing_focus: "Maximum coverage - all attack vectors, SQL injection, XSS, SSRF, IDOR, auth bypass, API attacks, subdomain takeover, secrets exposure",
                }),
            });
        } catch (e) {
            // Non-blocking — scan will be picked up by worker
            console.error("Launch call failed (non-blocking):", e);
        }

        setLaunching(false);
        onLaunched();
        // Navigate to live scan view
        router.push(`/cto-panel/scan/${report.id}`);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Launch Full Pentest</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Katana recon → Strix deep scan. All specialists, no limits.
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    {/* Targets summary */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider mb-1">Targets</p>
                        <div className="text-sm text-indigo-900">
                            {project.target_domains.length > 0 && (
                                <p>Domains: {project.target_domains.join(", ")}</p>
                            )}
                            {project.target_repos.length > 0 && (
                                <p>Repos: {project.target_repos.join(", ")}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Scan Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Additional Context (app description, tech stack, auth flow, etc.)
                        </label>
                        <textarea
                            value={customContext}
                            onChange={e => setCustomContext(e.target.value)}
                            placeholder="e.g. Next.js app with Supabase auth, REST API at /api/v1, uses JWT tokens..."
                            rows={4}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Credentials (optional — username:password or API keys)
                        </label>
                        <textarea
                            value={credentials}
                            onChange={e => setCredentials(e.target.value)}
                            placeholder={"admin:password123\nAPI-Key: sk-live-abc123"}
                            rows={2}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none font-mono text-xs"
                        />
                    </div>

                    {/* Config summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Scan Configuration</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <span>• Mode: <strong>Deep</strong></span>
                            <span>• Specialists: <strong>All</strong></span>
                            <span>• Katana Recon: <strong>Enabled</strong></span>
                            <span>• SQL Injection: <strong>Yes</strong></span>
                            <span>• XSS/CSRF: <strong>Yes</strong></span>
                            <span>• SSRF/IDOR: <strong>Yes</strong></span>
                            <span>• Auth Bypass: <strong>Yes</strong></span>
                            <span>• API Attacks: <strong>Yes</strong></span>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleLaunch}
                        disabled={launching}
                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                        Launch Offensive Scan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Build the full Strix instruction for maximum-power scanning ─────────────
function buildStrixInstruction(project: CTOProject, context: string, creds: string): string {
    return `
## CTO PENTEST — FULL OFFENSIVE MODE

### Target: ${project.name} (${project.company_name || "N/A"})

### Domains to Attack:
${project.target_domains.map(d => `- ${d}`).join("\n") || "None"}

### Repositories to Audit:
${project.target_repos.map(r => `- ${r}`).join("\n") || "None"}

### Engagement Rules:
- This is an AUTHORIZED full-scope penetration test.
- NO restrictions on attack surface. Test EVERYTHING.
- Use Katana crawling output to discover ALL endpoints, JS files, API routes, forms, hidden params.
- Run ALL specialist agents: SQLi, XSS, SSRF, IDOR, Auth Bypass, API abuse, Subdomain takeover, Secrets exposure, CSRF, Open Redirect, RCE, LFI/RFI.
- For each vulnerability found: provide full PoC (curl command or request), severity, impact, and remediation.
- Generate a professional pentest report suitable for sharing with the prospect's engineering team.

### Additional Context:
${context || "No additional context provided. Discover everything through recon."}

### Credentials:
${creds || "No credentials provided. Test unauthenticated first, then attempt auth bypass."}

### Output Requirements:
- Executive summary with risk score
- Detailed findings with severity (Critical/High/Medium/Low)
- Each finding must have: title, description, proof of concept, impact, remediation
- Attack surface map (all discovered endpoints, subdomains, technologies)
- Compliance implications (SOC 2, ISO 27001 if applicable)

### Scan Configuration:
- Mode: DEEP
- Timeout: Maximum (no time limit)
- All tools enabled
- All specialists deployed
- Katana crawling: depth=5, headless=true, js-crawl=true, tech-detect=true, form-fill=true
`.trim();
}
