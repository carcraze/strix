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
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-indigo-800/30 transition-colors"
            >
                <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-white truncate">{activeWorkspace.name}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-indigo-300/60 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && workspaces && workspaces.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden mx-2">
                    <div className="p-2 space-y-1">
                        {workspaces.map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
                            >
                                <span className="text-sm text-white flex-1 truncate">{ws.name}</span>
                                {ws.id === activeWorkspace.id && <Check className="h-4 w-4 text-sky-400" />}
                            </button>
                        ))}
                        <div className="border-t border-gray-700 mt-1 pt-1">
                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left text-sm text-gray-300">
                                <Plus className="h-4 w-4" />
                                Add new workspace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
