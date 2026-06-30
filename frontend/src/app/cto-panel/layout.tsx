"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Shield, Loader2, FolderKanban, History, Users, FileText,
    Terminal, ChevronLeft, ChevronRight, Zap, BarChart3, Settings,
    LogOut, Crosshair, Globe, Sun, Moon
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
    const [isDark, setIsDark] = useState(true);

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

        // Load saved theme
        const savedTheme = localStorage.getItem("cto-theme");
        if (savedTheme === "light") setIsDark(false);
    }, [router]);

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("cto-sidebar", next ? "collapsed" : "expanded");
    };

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem("cto-theme", next ? "dark" : "light");
    };

    if (loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#0f0f12]" : "bg-gray-50")}>
                <div className="flex flex-col items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl border flex items-center justify-center", isDark ? "bg-indigo-600/20 border-indigo-500/30" : "bg-indigo-50 border-indigo-200")}>
                        <Loader2 className={cn("h-5 w-5 animate-spin", isDark ? "text-indigo-400" : "text-indigo-600")} />
                    </div>
                    <p className={cn("text-sm font-mono", isDark ? "text-gray-500" : "text-gray-400")}>Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    // Theme tokens
    const t = isDark ? {
        bg: "bg-[#0f0f12]",
        sidebarBg: "bg-[#0a0a0e]",
        sidebarBorder: "border-white/[0.06]",
        text: "text-gray-100",
        textMuted: "text-gray-500",
        textDim: "text-gray-600",
        navActive: "bg-indigo-600/10 text-indigo-400",
        navInactive: "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]",
        navIndicator: "bg-indigo-500",
        divider: "bg-white/[0.04]",
        sectionLabel: "text-gray-600",
        profileBg: "bg-white/[0.02]",
        profileName: "text-gray-300",
        profileRole: "text-gray-600",
        toggleText: "text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]",
    } : {
        bg: "bg-gray-50",
        sidebarBg: "bg-white",
        sidebarBorder: "border-gray-200",
        text: "text-gray-900",
        textMuted: "text-gray-500",
        textDim: "text-gray-400",
        navActive: "bg-indigo-50 text-indigo-700",
        navInactive: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
        navIndicator: "bg-indigo-600",
        divider: "bg-gray-200",
        sectionLabel: "text-gray-400",
        profileBg: "bg-gray-50",
        profileName: "text-gray-700",
        profileRole: "text-gray-400",
        toggleText: "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
    };

    return (
        <div className={cn("min-h-screen flex", t.bg, t.text)}>
            {/* Sidebar */}
            <aside className={cn(
                "sticky top-0 h-screen flex flex-col border-r transition-all duration-300 z-40",
                t.sidebarBg, t.sidebarBorder,
                collapsed ? "w-[60px]" : "w-[240px]"
            )}>
                {/* Logo */}
                <div className={cn(
                    "flex items-center gap-3 border-b h-14 px-4",
                    t.sidebarBorder,
                    collapsed && "justify-center px-0"
                )}>
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Crosshair className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>CTO Ops</span>
                            <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider">Super Admin</span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {!collapsed && (
                        <p className={cn("px-3 text-[10px] uppercase tracking-[0.15em] font-medium mb-2", t.sectionLabel)}>Operations</p>
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
                                    active ? t.navActive : t.navInactive
                                )}
                            >
                                {active && (
                                    <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full", t.navIndicator)} />
                                )}
                                <Icon className="h-[18px] w-[18px] shrink-0" />
                                {!collapsed && (
                                    <span className="text-[13px] font-medium">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}

                    <div className={cn("h-px my-4", t.divider)} />

                    {!collapsed && (
                        <p className={cn("px-3 text-[10px] uppercase tracking-[0.15em] font-medium mb-2", t.sectionLabel)}>System</p>
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
                                    active ? t.navActive : t.navInactive
                                )}
                            >
                                <Icon className="h-[18px] w-[18px] shrink-0" />
                                {!collapsed && <span className="text-[13px] font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: theme toggle + collapse + profile */}
                <div className={cn("border-t p-2 space-y-2", t.sidebarBorder)}>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 h-9 rounded-lg transition-colors",
                            t.toggleText
                        )}
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {!collapsed && <span className="text-xs">{isDark ? "Light Mode" : "Dark Mode"}</span>}
                    </button>

                    {/* Collapse toggle */}
                    <button
                        onClick={toggleSidebar}
                        className={cn("w-full flex items-center justify-center gap-2 h-9 rounded-lg transition-colors", t.toggleText)}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {!collapsed && <span className="text-xs">Collapse</span>}
                    </button>

                    {!collapsed && (
                        <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", t.profileBg)}>
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-xs font-medium truncate", t.profileName)}>Alvin</p>
                                <p className={cn("text-[10px] truncate", t.profileRole)}>CTO • Zentinel</p>
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
