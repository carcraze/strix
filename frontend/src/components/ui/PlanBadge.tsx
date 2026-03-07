import React from 'react';
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
    plan: string;
    className?: string;
}

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
    const plans: Record<string, { label: string, classes: string }> = {
        starter: { label: "Starter", classes: "bg-white/10 text-white" },
        growth: { label: "Growth", classes: "bg-[var(--color-green)]/20 text-[var(--color-green)]" },
        scale: { label: "Scale", classes: "bg-[var(--color-amber)]/20 text-[var(--color-amber)]" },
        enterprise: { label: "Enterprise", classes: "bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30" },
    };

    const p = plans[plan?.toLowerCase()] || plans.starter;

    return (
        <span className={cn(`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider`, p.classes, className)}>
            {p.label}
        </span>
    );
}
