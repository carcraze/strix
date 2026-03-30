"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import SecurityCheck from "@/components/SecurityCheck";

import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <SecurityCheck>
            <WorkspaceProvider>
                <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--background)] sticky top-0 z-30">
                        <div className="flex items-center gap-2">
                           <img src="/logo.png" alt="Zentinel" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
                           <span className="text-sm font-black tracking-[0.2em] text-white uppercase">Zentinel</span>
                        </div>
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="print:hidden">
                        <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />
                    </div>
                    
                    {/* Main content area */}
                    <div className="flex-1 w-full lg:pl-[240px] print:pl-0 flex flex-col min-w-0">
                        {children}
                    </div>

                    {/* Mobile Overlay */}
                    {isMobileSidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                    )}
                </div>
            </WorkspaceProvider>
        </SecurityCheck>
    );
}

