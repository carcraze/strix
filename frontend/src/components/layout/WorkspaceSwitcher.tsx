"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Check, Building2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function WorkspaceSwitcher() {
    const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!activeWorkspace) return null;

    const initials = activeWorkspace.name.slice(0, 2).toUpperCase();

    return (
        <div className="px-3 mb-6 relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--color-border)]"
            >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-cyan)] to-purple-500 flex items-center justify-center shrink-0">
                    <span className="text-black font-bold text-xs font-syne">{initials}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-white truncate">{activeWorkspace.name}</div>
                    <div className="text-[10px] text-[var(--color-textMuted)] uppercase tracking-wider font-mono">{activeWorkspace.plan || "Starter"}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--color-textMuted)] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && workspaces && workspaces.length > 0 && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-[#0D1117] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-1.5 space-y-0.5">
                        {workspaces.map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[var(--color-cyan)] to-purple-500 flex items-center justify-center shrink-0">
                                    <span className="text-black font-bold text-[10px]">{ws.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                                <span className="text-sm text-white flex-1 truncate">{ws.name}</span>
                                {ws.id === activeWorkspace.id && <Check className="h-3.5 w-3.5 text-[var(--color-cyan)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
