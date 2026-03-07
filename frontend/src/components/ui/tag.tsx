import { cn } from "@/lib/utils";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: "cyan" | "amber" | "green" | "red" | "purple" | "yellow" | "default";
}

const colorStyles = {
    cyan: "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] border-[var(--color-cyan)]/20",
    amber: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
    green: "bg-[var(--color-green)]/10 text-[var(--color-green)] border-[var(--color-green)]/20",
    red: "bg-[var(--color-red)]/10 text-[var(--color-red)] border-[var(--color-red)]/20",
    purple: "bg-[var(--color-purple)]/10 text-[var(--color-purple)] border-[var(--color-purple)]/20",
    yellow: "bg-[var(--color-yellow)]/10 text-[var(--color-yellow)] border-[var(--color-yellow)]/20",
    default: "bg-muted text-muted-foreground border-border",
};

export function Tag({ className, color = "default", children, ...props }: TagProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                colorStyles[color],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
