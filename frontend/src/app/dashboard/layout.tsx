"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import SecurityCheck from "@/components/SecurityCheck";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Sync collapsed state for layout offset
    useEffect(() => {
        const check = () => {
            const saved = localStorage.getItem("zentinel-sidebar");
            setSidebarCollapsed(saved === "collapsed");
        };
        check();
        window.addEventListener("storage", check);
        // Also poll — sidebar toggles localStorage directly
        const interval = setInterval(check, 300);
        return () => { window.removeEventListener("storage", check); clearInterval(interval); };
    }, []);

    // Force light mode in dashboard — restore dark on leaving (for landing page)
    useEffect(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        return () => {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
        };
    }, []);

    return (
        <SecurityCheck>
            <WorkspaceProvider>
                <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">

                    {/* Mobile header - Aikido navy */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-[#1e1b4b] border-b border-indigo-900/30">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center">
                                <span className="text-white font-black text-sm">Z</span>
                            </div>
                            <span className="text-white font-black text-base tracking-tight">Zentinel</span>
                        </div>
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 text-indigo-200/70 hover:text-white">
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Sidebar */}
                    <div className="print:hidden">
                        <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />
                    </div>

                    {/* Main content — offset by sidebar width */}
                    <main className={cn(
                        "flex-1 min-w-0 transition-all duration-300 pt-14 lg:pt-0",
                        sidebarCollapsed ? "lg:pl-[60px]" : "lg:pl-[240px]",
                        "print:pl-0"
                    )}>
                        {children}
                    </main>
                </div>
            </WorkspaceProvider>
        </SecurityCheck>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
