import { Card } from "./zentinel-card";
import { Button } from "./button";
import { Server, Globe, Box, GitBranch } from "lucide-react";

export type SurfaceType = "API" | "Cloud" | "Infra" | "Code";

interface SurfaceCardProps {
    type: SurfaceType;
    endpointCount: number;
    issuesCount: number;
    coveragePercent: number;
    onScanClick?: () => void;
}

const surfaceConfig: Record<SurfaceType, { title: string; icon: React.ReactNode; color: string }> = {
    API: { title: "APIs & Web Apps", icon: <Globe className="h-5 w-5" />, color: "var(--color-cyan)" },
    Cloud: { title: "Cloud", icon: <Box className="h-5 w-5" />, color: "var(--color-purple)" },
    Infra: { title: "Infrastructure", icon: <Server className="h-5 w-5" />, color: "var(--color-amber)" },
    Code: { title: "Code & PRs", icon: <GitBranch className="h-5 w-5" />, color: "var(--color-green)" },
};

export function SurfaceCard({ type, endpointCount, issuesCount, coveragePercent, onScanClick }: SurfaceCardProps) {
    const config = surfaceConfig[type];

    return (
        <Card className="p-5 flex flex-col justify-between group hover:border-white/10" glow="none">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-lg bg-black/50 border border-white/5"
                        style={{ color: config.color }}
                    >
                        {config.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-textPrimary)]">{config.title}</h3>
                        <p className="text-xs text-[var(--color-textMuted)] font-mono">{endpointCount} targets</p>
                    </div>
                </div>
                {onScanClick && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs border border-white/10 hover:bg-white/5"
                        onClick={onScanClick}
                    >
                        Scan Now
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <span className="text-2xl font-bold font-syne tracking-tight" style={{ color: issuesCount > 0 ? "var(--color-red)" : "var(--color-textPrimary)" }}>
                            {issuesCount}
                        </span>
                        <p className="text-xs text-[var(--color-textSecondary)]">Open Issues</p>
                    </div>
                    <div className="text-right space-y-1">
                        <span className="text-lg font-bold font-syne text-[var(--color-textPrimary)]">{coveragePercent}%</span>
                        <p className="text-xs text-[var(--color-textSecondary)]">Coverage</p>
                    </div>
                </div>

                {/* Coverage Progress Bar */}
                <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${coveragePercent}%`,
                            backgroundColor: config.color,
                            boxShadow: `0 0 10px ${config.color}`
                        }}
                    />
                </div>
            </div>
        </Card>
    );
}
