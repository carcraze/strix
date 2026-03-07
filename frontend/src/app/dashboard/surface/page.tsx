"use client";

import { SurfaceCard } from "@/components/ui/surface-card";
import { AttackGraph } from "@/components/ui/attack-graph";
import { Card } from "@/components/ui/zentinel-card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Search, Eye, RefreshCw, Filter } from "lucide-react";

export default function AttackSurfacePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold tracking-tight">Attack Surface</h1>
                    <p className="text-[var(--color-textSecondary)] mt-1 font-mono text-sm">Discovered assets and endpoint inventory.</p>
                </div>
            </div>

            {/* 4 Surface Cards (Larger Context) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SurfaceCard type="API" endpointCount={42} issuesCount={3} coveragePercent={98} onScanClick={() => { }} />
                <SurfaceCard type="Code" endpointCount={14} issuesCount={0} coveragePercent={100} onScanClick={() => { }} />
                <SurfaceCard type="Cloud" endpointCount={8} issuesCount={1} coveragePercent={85} onScanClick={() => { }} />
                <SurfaceCard type="Infra" endpointCount={3} issuesCount={0} coveragePercent={100} onScanClick={() => { }} />
            </div>

            {/* Full Width Attack Graph */}
            <div className="h-[450px]">
                <AttackGraph />
            </div>

            {/* Endpoint Inventory Table */}
            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-syne font-bold text-lg">Endpoint Inventory</h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                            <input
                                type="text"
                                placeholder="Search endpoints..."
                                className="w-full bg-[var(--background)] border border-[var(--color-border)] rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-cyan)] text-[var(--color-textPrimary)]"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="border-[var(--color-border)] hover:bg-white/5">
                            <Filter className="h-4 w-4 text-[var(--color-textSecondary)]" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-[var(--background)]">
                                <th className="px-6 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Severity</th>
                                <th className="px-6 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Method + Path</th>
                                <th className="px-6 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Surface</th>
                                <th className="px-6 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold">Last Scanned</th>
                                <th className="px-6 py-4 text-xs font-mono text-[var(--color-textMuted)] uppercase tracking-wider font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {[
                                { severity: "critical", method: "PUT", path: "/api/v1/users/:id/billing", surface: "API", time: "2h ago" },
                                { severity: "high", method: "GET", path: "s3://zentinel-staging-backups", surface: "Cloud", time: "5h ago" },
                                { severity: "medium", method: "GET", path: "/search?q=", surface: "Web", time: "1d ago" },
                                { severity: "low", method: "POST", path: "/api/v1/webhooks/stripe", surface: "API", time: "1d ago" },
                                { severity: "info", method: "GET", path: "/api/health", surface: "API", time: "12m ago" },
                            ].map((endpoint, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <SeverityBadge severity={endpoint.severity as any} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-mono text-sm">
                                            <span className={
                                                endpoint.method === "GET" ? "text-blue-400" :
                                                    endpoint.method === "POST" ? "text-green-400" :
                                                        endpoint.method === "PUT" ? "text-orange-400" : "text-purple-400"
                                            }>{endpoint.method}</span>
                                            <span className="text-[var(--color-textPrimary)]">{endpoint.path}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Tag color="default">{endpoint.surface}</Tag>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-textSecondary)]">
                                        {endpoint.time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-[var(--color-cyan)]/10 hover:text-[var(--color-cyan)]">
                                                <Eye className="h-3 w-3 mr-2" /> View Finding
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-white/10">
                                                <RefreshCw className="h-3 w-3 mr-2" /> Rescan
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
