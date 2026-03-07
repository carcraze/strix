import { cn } from "@/lib/utils";

export type AgentType = "recon" | "exploit" | "validate" | "fix" | "idle";

interface AgentDotProps extends React.HTMLAttributes<HTMLSpanElement> {
    type: AgentType;
    animate?: boolean;
}

const agentColors: Record<AgentType, string> = {
    recon: "bg-[var(--color-cyan)]",
    exploit: "bg-[var(--color-red)]",
    validate: "bg-[var(--color-amber)]",
    fix: "bg-[var(--color-green)]",
    idle: "bg-muted-foreground",
};

const agentGlows: Record<AgentType, string> = {
    recon: "shadow-[0_0_8px_var(--color-cyan)]",
    exploit: "shadow-[0_0_8px_var(--color-red)]",
    validate: "shadow-[0_0_8px_var(--color-amber)]",
    fix: "shadow-[0_0_8px_var(--color-green)]",
    idle: "",
};

export function AgentDot({ className, type, animate = true, ...props }: AgentDotProps) {
    return (
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            {animate && type !== "idle" && (
                <span
                    className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        agentColors[type]
                    )}
                ></span>
            )}
            <span
                className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    agentColors[type],
                    type !== "idle" && agentGlows[type],
                    className
                )}
                {...props}
            ></span>
        </span>
    );
}
