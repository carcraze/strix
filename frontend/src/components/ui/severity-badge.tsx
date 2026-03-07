import { Tag } from "./tag";
import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    severity: Severity;
}

const severityConfig: Record<Severity, { label: string; color: "red" | "amber" | "yellow" | "green" | "purple" }> = {
    critical: { label: "Critical", color: "red" },
    high: { label: "High", color: "amber" },
    medium: { label: "Medium", color: "yellow" },
    low: { label: "Low", color: "green" },
    info: { label: "Info", color: "purple" },
};

export function SeverityBadge({ severity, className, ...props }: SeverityBadgeProps) {
    const config = severityConfig[severity];

    return (
        <Tag color={config.color as any} className={cn("uppercase tracking-wider text-[10px]", className)} {...props}>
            {config.label}
        </Tag>
    );
}
