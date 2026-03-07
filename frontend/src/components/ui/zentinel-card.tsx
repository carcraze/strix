import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glow?: "cyan" | "amber" | "green" | "red" | "purple" | "yellow" | "none";
}

const glowVariants = {
    cyan: "shadow-[0_0_15px_rgba(0,212,255,0.15)] border-[var(--color-cyan)]/30",
    amber: "shadow-[0_0_15px_rgba(255,107,53,0.15)] border-[var(--color-amber)]/30",
    green: "shadow-[0_0_15px_rgba(0,255,136,0.15)] border-[var(--color-green)]/30",
    red: "shadow-[0_0_15px_rgba(255,45,85,0.15)] border-[var(--color-red)]/30",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.15)] border-[var(--color-purple)]/30",
    yellow: "shadow-[0_0_15px_rgba(255,214,10,0.15)] border-[var(--color-yellow)]/30",
    none: "",
};

export function Card({ className, glow = "none", children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-card text-card-foreground border border-border rounded-xl transition-all duration-300",
                glow !== "none" && glowVariants[glow],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
