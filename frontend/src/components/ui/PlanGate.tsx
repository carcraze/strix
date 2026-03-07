"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import { canUseFeature, PlanLimits } from '@/lib/plans';

interface PlanGateProps {
    currentPlan?: string;
    feature: keyof PlanLimits;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showBadge?: boolean;
}

export function PlanGate({
    currentPlan = 'starter',
    feature,
    children,
    fallback,
    showBadge = true
}: PlanGateProps) {
    const allowed = canUseFeature(currentPlan, feature);

    if (allowed) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-(--color-border) rounded-xl bg-[var(--background)]/30 backdrop-blur-sm shadow-inner">
            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Lock className="h-5 w-5 text-[var(--color-textMuted)]" />
            </div>
            <h4 className="text-white font-syne font-bold text-lg mb-2">Upgrade Required</h4>
            <p className="text-sm text-[var(--color-textSecondary)] mb-6 text-center max-w-sm">
                This feature is not available on your current plan. Please upgrade to unlock it.
            </p>
            {showBadge && (
                <button className="px-5 py-2.5 text-sm font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
                    Upgrade to Growth
                </button>
            )}
        </div>
    );
}
