import { Card } from "./zentinel-card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp } from "lucide-react";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ReactNode;
    glowColor?: "cyan" | "amber" | "green" | "red" | "purple" | "yellow" | "none";
}

export function MetricCard({
    title,
    value,
    trend,
    trendUp = true,
    icon,
    glowColor = "none",
    className,
    ...props
}: MetricCardProps) {
    return (
        <Card className={cn("p-6 flex flex-col justify-between", className)} glow={glowColor} {...props}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-[var(--color-textSecondary)]">{title}</h3>
                {icon && <div className="text-[var(--color-textSecondary)]">{icon}</div>}
            </div>
            <div>
                <div className="text-3xl font-bold font-syne tracking-tight text-[var(--color-textPrimary)]">
                    {value}
                </div>
                {trend && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-mono">
                        {trendUp ? (
                            <TrendingUp className="h-3 w-3 text-[var(--color-green)]" />
                        ) : (
                            <ArrowUpRight className="h-3 w-3 text-[var(--color-red)] transform rotate-90" />
                        )}
                        <span className={trendUp ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}>
                            {trend}
                        </span>
                        <span className="text-[var(--color-textMuted)] ml-1">vs last scan</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
