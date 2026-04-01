"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronDown, Check, Plus, UserPlus, Settings, Zap, Github
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
    const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!activeWorkspace) return null;

    const plan = activeWorkspace.plan || "free";
    const isPro = plan === "growth" || plan === "scale" || plan === "enterprise";
    const isTrial = plan === "starter";

    const planLabel = isPro ? plan.charAt(0).toUpperCase() + plan.slice(1) :
                     isTrial ? "Pro trial" : "Free";
    const showUpgrade = !isPro;

    return (
        <div className="space-y-1.5" ref={ref}>
            {/* ── Plan Badge ── */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                    <Zap className="h-3 w-3 text-sky-400" />
                    <span className="text-[11px] font-semibold text-sky-300">{planLabel}</span>
                </div>
                {showUpgrade && (
                    <button
                        onClick={() => router.push("/dashboard/settings/billing")}
                        className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                        Upgrade
                    </button>
                )}
            </div>

            {/* ── Dropdown Trigger ── */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/30 transition-colors"
            >
                <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px]">
                        {activeWorkspace.name.slice(0, 1).toUpperCase()}
                    </span>
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-white truncate">
                    {activeWorkspace.name}
                </span>
                <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-indigo-300/60 transition-transform shrink-0",
                    open && "rotate-180"
                )} />
            </button>

            {/* ── Dropdown Panel ── */}
            {open && (
                <div className="absolute left-3 right-3 mt-1 bg-[#161330] border border-indigo-800/50 rounded-xl shadow-2xl z-[60] overflow-hidden">

                    {/* Workspaces list */}
                    <div className="p-2">
                        {(workspaces || []).map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-indigo-800/30 transition-colors text-left group"
                            >
                                <div className="h-6 w-6 rounded bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
                                    <span className="text-white font-black text-[10px]">
                                        {ws.name.slice(0, 1).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{ws.name}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Github className="h-3 w-3 text-indigo-400" />
                                        <span className="text-[11px] text-indigo-400">GitHub Server</span>
                                    </div>
                                </div>
                                {ws.id === activeWorkspace.id && (
                                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Trial info */}
                    {showUpgrade && (
                        <div className="mx-3 mb-2 px-3 py-2.5 bg-indigo-900/30 border border-indigo-700/30 rounded-lg">
                            <p className="text-[11px] text-indigo-300 leading-relaxed">
                                This workspace is on the{" "}
                                <span className="text-sky-300 font-semibold">{planLabel}</span>.{" "}
                                <button
                                    onClick={() => { router.push("/dashboard/settings/billing"); setOpen(false); }}
                                    className="underline text-sky-400 hover:text-sky-300"
                                >
                                    Learn More
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Divider + Actions */}
                    <div className="border-t border-indigo-800/40 p-2 space-y-0.5">
                        <button
                            onClick={() => { router.push("/dashboard/settings/members"); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-800/30 transition-colors text-left"
                        >
                            <UserPlus className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">Invite people to your team</span>
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-800/30 transition-colors text-left"
                        >
                            <Plus className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">Add another workspace</span>
                        </button>
                        <button
                            onClick={() => { router.push("/dashboard/settings"); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-800/30 transition-colors text-left"
                        >
                            <Settings className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">Organization settings</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
