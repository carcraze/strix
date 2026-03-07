"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Globe, GitBranch, ShieldAlert } from "lucide-react";

export function ActionHub() {
    return (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
            <h2 className="text-base font-syne font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/pentests/new" className="flex flex-col gap-2 p-4 bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 rounded-xl hover:bg-[var(--color-cyan)]/20 transition-colors group">
                    <Search className="h-5 w-5 text-[var(--color-cyan)]" />
                    <span className="text-sm font-medium text-white">New Pentest</span>
                    <span className="text-xs text-[var(--color-textMuted)]">Start a security scan</span>
                </Link>
                <Link href="/dashboard/domains" className="flex flex-col gap-2 p-4 bg-white/5 border border-[var(--color-border)] rounded-xl hover:bg-white/10 transition-colors group">
                    <Globe className="h-5 w-5 text-[var(--color-textMuted)] group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-white">Add Domain</span>
                    <span className="text-xs text-[var(--color-textMuted)]">Monitor attack surfaces</span>
                </Link>
                <Link href="/dashboard/repositories" className="flex flex-col gap-2 p-4 bg-white/5 border border-[var(--color-border)] rounded-xl hover:bg-white/10 transition-colors group">
                    <GitBranch className="h-5 w-5 text-[var(--color-textMuted)] group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-white">Connect Repo</span>
                    <span className="text-xs text-[var(--color-textMuted)]">Enable PR scanning</span>
                </Link>
                <Link href="/dashboard/issues" className="flex flex-col gap-2 p-4 bg-white/5 border border-[var(--color-border)] rounded-xl hover:bg-white/10 transition-colors group">
                    <ShieldAlert className="h-5 w-5 text-[var(--color-textMuted)] group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-white">View Issues</span>
                    <span className="text-xs text-[var(--color-textMuted)]">Review findings</span>
                </Link>
            </div>
        </div>
    );
}
