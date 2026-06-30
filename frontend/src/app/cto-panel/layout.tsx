"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Shield, Loader2, FolderKanban, History, Users, FileText,
    Terminal, ChevronLeft, ChevronRight, Zap, BarChart3, Settings,
    LogOut, Crosshair, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

const CTO_UID = "03a2932b-4f96-4698-bab9-9e1829e2232a";

const NAV_ITEMS = [
    { name: "Projects", href: "/cto-panel", icon: FolderKanban, description: "Pentest engagements" },
    { name: "Live Scans", href: "/cto-panel/live", icon: Terminal, description: "Active scan terminals" },
    { name: "Reports", href: "/cto-panel/reports", icon: FileText, description: "Generated reports" },
    { name: "History", href: "/cto-panel/history", icon: History, description: "Past engagements" },
    { name: "CRM Prospects", href: "/cto-panel/prospects", icon: Users, description: "Pipeline targets" },
    { name: "Attack Surface", href: "/cto-panel/recon", icon: Globe, description: "Katana recon data" },
];

const BOTTOM_ITEMS = [
    { name: "Analytics", href: "/cto-panel/analytics", icon: BarChart3 },
    { name: "Settings", href: "/cto-panel/settings", icon: Settings },
];

export default function CTOPanelLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== CTO_UID) {
                router.replace("/404");
                return;
            }
            setAuthorized(true);
            setLoading(false);
        };
        check();

        // Load saved sidebar state
        const saved = localStorage.getItem("cto-sidebar");
        if (saved === "collapsed") setCollapsed(true);
    }, [router]);

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("cto-sidebar", next ? "collapsed" : "expanded");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-mono">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-[#0f0f12] flex text-gray-100">
            {/* Sidebar */}
            <aside className={cn(
                "sticky top-0 h-screen flex flex-col border-r border-white/[0.06] bg-[#0a0a0e] transition-all duration-300 z-40",
                collapsed ? "w-[60px]" : "w-[240px]"
            )}>
                {/* Logo */}
                <div className={cn(
                    "flex items-center gap-3 border-b border-white/[0.06] h-14 px-4",
                    collapsed && "justify-center px-0"
                )}>
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Crosshair className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-tight">CTO Ops</span>
                            <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider">Super Admin</span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {!collapsed && (
                        <p className="px-3 text-[10px] uppercase tracking-[0.15em] text-gray-600 font-medium mb-2">Operations</p>
                    )}
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/cto-panel" && pathname?.startsWith(item.href));
                        const isExactHome = item.href === "/cto-panel" && pathname === "/cto-panel";
                        const active = isActive || isExactHome;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={collapsed ? item.name : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg transition-all group relative",
                                    collapsed ? "h-10 w-10 mx-auto justify-center" : "px-3 py-2.5",
                                    active
                                        ? "bg-indigo-600/10 text-indigo-400"
                                        : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                                )}
                            >
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500" />
                                )}
                                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-indigo-400")} />
                                {!collapsed && (
                                    <span className="text-[13px] font-medium">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}

                    <div className="h-px bg-white/[0.04] my-4" />

                    {!collapsed && (
                        <p className="px-3 text-[10px] uppercase tracking-[0.15em] text-gray-600 font-medium mb-2">System</p>
                    )}
                    {BOTTOM_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={collapsed ? item.name : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg transition-all",
                                    collapsed ? "h-10 w-10 mx-auto justify-center" : "px-3 py-2.5",
                                    active
                                        ? "bg-white/[0.06] text-white"
                                        : "text-gray-600 hover:text-gray-300 hover:bg-white/[0.03]"
                                )}
                            >
                                <Icon className="h-[18px] w-[18px] shrink-0" />
                                {!collapsed && <span className="text-[13px] font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle + profile */}
                <div className="border-t border-white/[0.06] p-2 space-y-2">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {!collapsed && <span className="text-xs">Collapse</span>}
                    </button>

                    {!collapsed && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-300 truncate">Alvin</p>
                                <p className="text-[10px] text-gray-600 truncate">CTO • Zentinel</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
