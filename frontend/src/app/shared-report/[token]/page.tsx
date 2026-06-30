"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Shield, AlertTriangle, CheckCircle2, Clock, Globe, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Use anon key for public access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabasePublic = createBrowserClient(supabaseUrl, supabaseAnonKey);

type Report = {
    id: string;
    title: string;
    status: string;
    report_markdown: string | null;
    findings_summary: any;
    duration_seconds: number | null;
    created_at: string;
    completed_at: string | null;
    cto_projects: {
        name: string;
        company_name: string | null;
        target_domains: string[];
    } | null;
};

export default function SharedReportPage() {
    const params = useParams();
    const token = params.token as string;
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            const { data, error } = await supabasePublic
                .from("cto_scan_reports")
                .select("*, cto_projects(name, company_name, target_domains)")
                .eq("share_token", token)
                .eq("share_enabled", true)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setReport(data as Report);
            }
            setLoading(false);
        };
        if (token) fetchReport();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
                    <p className="text-sm text-gray-500">This report doesn&apos;t exist or sharing has been disabled.</p>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const findings = report.findings_summary || {};
    const totalFindings = (findings.critical || 0) + (findings.high || 0) + (findings.medium || 0) + (findings.low || 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Zentinel Security Report</p>
                            <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        {report.cto_projects?.company_name && (
                            <span className="flex items-center gap-1.5">
                                <Globe className="h-4 w-4" /> {report.cto_projects.company_name}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        {report.duration_seconds && (
                            <span className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4" /> {Math.round(report.duration_seconds / 60)} min scan
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Critical", count: findings.critical || 0, color: "bg-red-50 text-red-700 border-red-200" },
                        { label: "High", count: findings.high || 0, color: "bg-orange-50 text-orange-700 border-orange-200" },
                        { label: "Medium", count: findings.medium || 0, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                        { label: "Low", count: findings.low || 0, color: "bg-green-50 text-green-700 border-green-200" },
                    ].map(s => (
                        <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.color)}>
                            <p className="text-3xl font-bold">{s.count}</p>
                            <p className="text-xs font-medium mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Report Content */}
                {report.report_markdown ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(report.report_markdown) }} />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        {report.status === "running" ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">Scan in progress. Report will appear here when complete.</p>
                            </>
                        ) : report.status === "pending" ? (
                            <>
                                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">Scan queued. Results will appear shortly.</p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">Report content is not yet available.</p>
                            </>
                        )}
                    </div>
                )}

                {/* Targets */}
                {report.cto_projects?.target_domains && report.cto_projects.target_domains.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Targets Tested</p>
                        <div className="flex flex-wrap gap-2">
                            {report.cto_projects.target_domains.map((d, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                    {d}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Shield className="h-4 w-4" />
                        <p className="text-xs">Generated by Zentinel — AI Penetration Testing Platform</p>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">zentinel.dev</p>
                </div>
            </div>
        </div>
    );
}

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
    let html = md
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-xs"><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">$1</code>')
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-6 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-8 mb-3">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
        // Paragraphs
        .replace(/^(?!<[hluprc])(.*\S.*)$/gm, '<p class="text-gray-700 mb-2">$1</p>');

    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-3 space-y-1">${match}</ul>`);

    return html;
}
