"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
    LayoutGrid, Search, GitPullRequest, ShieldAlert,
    Layers, Globe, Settings, LogOut, Sun, Moon,
    ChevronLeft, ChevronRight, Wrench, FileText,
    BellOff, EyeOff, CheckCircle2, Plug, BarChart2,
    Package, Cloud, Code2, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV = [
    {
        section: "FEED",
        items: [
            {
                icon: LayoutGrid, label: "Feed", href: "/dashboard",
                exact: true,
                children: [
                    { label: "Snoozed", href: "/dashboard/issues?tab=snoozed", icon: BellOff },
                    { label: "Ignored",  href: "/dashboard/issues?tab=ignored",  icon: EyeOff },
                    { label: "Solved",   href: "/dashboard/issues?tab=fixed",    icon: CheckCircle2 },
                ],
            },
            { icon: Wrench, label: "AutoFix", href: "/dashboard/issues?tab=open#autofix" },
        ],
    },
    {
        section: "ASSETS",
        items: [
            { icon: Layers, label: "Repositories", href: "/dashboard/repositories" },
            { icon: Package, label: "Containers",   href: "/dashboard/containers",  comingSoon: true },
            { icon: Cloud,   label: "Clouds",        href: "/dashboard/clouds",      comingSoon: true },
            { icon: Globe,   label: "Domains & APIs", href: "/dashboard/domains" },
        ],
    },
    {
        section: "SECURITY",
        items: [
            { icon: Search,      label: "Pentests",   href: "/dashboard/pentests" },
            { icon: GitPullRequest, label: "PR Reviews", href: "/dashboard/pr-reviews" },
            { icon: ShieldAlert, label: "Issues",     href: "/dashboard/issues" },
            { icon: Code2,       label: "Code Quality", href: "/dashboard/code-quality", comingSoon: true },
            { icon: BarChart2,   label: "Reports",    href: "/dashboard/reports",    comingSoon: true },
        ],
    },
    {
        section: "MANAGE",
        items: [
            { icon: Plug,     label: "Integrations", href: "/dashboard/integrations" },
            { icon: Settings, label: "Settings",     href: "/dashboard/settings/general" },
        ],
    },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
    const pathname = usePathname();
    const router   = useRouter();
    const { activeWorkspace } = useWorkspace();
    const userMenuRef = useRef<HTMLDivElement>(null);

    const [collapsed, setCollapsed]     = useState(false);
    const [user, setUser]               = useState<{ name: string; email: string; initials: string } | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLight, setIsLight]         = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Feed: true });

    // Load theme
    useEffect(() => {
        const saved = localStorage.getItem("zentinel-theme");
        const preferLight = saved === "light" || (!saved); // default to light
        if (preferLight) { document.documentElement.classList.add("light"); setIsLight(true); }
        else             { document.documentElement.classList.remove("light"); setIsLight(false); }
    }, []);

    // Load collapsed state
    useEffect(() => {
        const saved = localStorage.getItem("zentinel-sidebar");
        if (saved === "collapsed") setCollapsed(true);
    }, []);

    // Load user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
                const email = data.user.email || "";
                const meta  = data.user.user_metadata || {};
                const name  = meta.full_name || meta.name || email.split("@")[0] || "User";
                const parts = name.trim().split(" ");
                const initials = parts.length >= 2
                    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    : name.slice(0, 2).toUpperCase();
                setUser({ name, email, initials });
            }
        });
    }, []);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
                setShowUserMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleTheme = () => {
        const next = !isLight;
        setIsLight(next);
        if (next) { document.documentElement.classList.add("light"); localStorage.setItem("zentinel-theme", "light"); }
        else       { document.documentElement.classList.remove("light"); localStorage.setItem("zentinel-theme", "dark"); }
    };

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("zentinel-sidebar", next ? "collapsed" : "open");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    const isActive = (href: string, exact = false) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsOpen?.(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-[100dvh] flex flex-col transition-all duration-300 ease-in-out",
                "bg-[#1e1f2e] border-r border-white/8",
                collapsed ? "w-[60px]" : "w-[240px]",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>

                {/* ── Logo + collapse toggle ── */}
                <div className={cn("flex items-center h-14 border-b border-white/8 shrink-0 px-3", collapsed ? "justify-center" : "justify-between")}>
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-[#00E5FF] flex items-center justify-center shrink-0">
                                <span className="text-black font-black text-sm">Z</span>
                            </div>
                            <span className="text-white font-black text-base tracking-tight">Zentinel</span>
                        </Link>
                    )}
                    {collapsed && (
                        <Link href="/dashboard">
                            <div className="h-7 w-7 rounded-lg bg-[#00E5FF] flex items-center justify-center">
                                <span className="text-black font-black text-sm">Z</span>
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className={cn("p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors hidden lg:flex", collapsed && "absolute -right-3 top-5 bg-[#1e1f2e] border border-white/20 rounded-full p-0.5 shadow-lg")}
                    >
                        {collapsed
                            ? <ChevronRight className="h-3.5 w-3.5" />
                            : <ChevronLeft className="h-3.5 w-3.5" />}
                    </button>
                </div>

                {/* ── Workspace switcher ── */}
                {!collapsed && (
                    <div className="px-3 py-2 border-b border-white/8 shrink-0">
                        <WorkspaceSwitcher />
                    </div>
                )}

                {/* ── Nav ── */}
                <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
                    {NAV.map((group) => (
                        <div key={group.section} className="mb-1">
                            {/* Section label */}
                            {!collapsed && (
                                <div className="px-2 pt-3 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em]">
                                    {group.section}
                                </div>
                            )}
                            {collapsed && <div className="h-2" />}

                            {group.items.map((item) => {
                                const active = isActive(item.href, (item as any).exact);
                                const hasChildren = 'children' in item && item.children && item.children.length > 0;
                                const sectionOpen = openSections[item.label] !== false;

                                return (
                                    <div key={item.href}>
                                        <Link
                                            href={(item as any).comingSoon ? "#" : item.href}
                                            onClick={hasChildren && !collapsed ? (e) => { e.preventDefault(); toggleSection(item.label); } : undefined}
                                            className={cn(
                                                "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors group relative",
                                                collapsed ? "justify-center" : "",
                                                active
                                                    ? "bg-[#00E5FF]/15 text-[#00E5FF]"
                                                    : "text-white/60 hover:text-white hover:bg-white/8",
                                                (item as any).comingSoon && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <item.icon className={cn("shrink-0 h-4 w-4", active ? "text-[#00E5FF]" : "text-white/50 group-hover:text-white")} />
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-1 font-medium truncate">{item.label}</span>
                                                    {(item as any).comingSoon && (
                                                        <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Soon</span>
                                                    )}
                                                    {hasChildren && (
                                                        <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform", sectionOpen ? "" : "-rotate-90")} />
                                                    )}
                                                </>
                                            )}
                                            {/* Tooltip when collapsed */}
                                            {collapsed && (
                                                <div className="absolute left-full ml-2 px-2 py-1 bg-[#111] text-white text-xs rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                                                    {item.label}
                                                    {(item as any).comingSoon && " (Coming soon)"}
                                                </div>
                                            )}
                                        </Link>

                                        {/* Sub-items */}
                                        {hasChildren && !collapsed && sectionOpen && (
                                            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                                                {(item as any).children.map((child: any) => (
                                                    <Link key={child.href} href={child.href}
                                                        className={cn(
                                                            "flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors",
                                                            pathname === child.href
                                                                ? "text-[#00E5FF] bg-[#00E5FF]/10"
                                                                : "text-white/40 hover:text-white/80 hover:bg-white/5"
                                                        )}>
                                                        <child.icon className="h-3 w-3 shrink-0" />
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* ── Bottom: theme + user ── */}
                <div className="shrink-0 border-t border-white/8 p-2 space-y-1">
                    {/* Theme toggle */}
                    <button onClick={toggleTheme}
                        className={cn("flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 transition-colors", collapsed && "justify-center")}>
                        {isLight
                            ? <Moon className="h-4 w-4 shrink-0" />
                            : <Sun  className="h-4 w-4 shrink-0" />}
                        {!collapsed && <span>{isLight ? "Dark mode" : "Light mode"}</span>}
                    </button>

                    {/* User */}
                    <div className="relative" ref={userMenuRef}>
                        {showUserMenu && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="px-3 py-2.5 border-b border-white/8">
                                    <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-white/40 truncate">{user?.email}</p>
                                </div>
                                <button onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                    <LogOut className="h-3.5 w-3.5" /> Log out
                                </button>
                            </div>
                        )}
                        <button onClick={() => setShowUserMenu(v => !v)}
                            className={cn("flex items-center gap-2.5 w-full p-1.5 rounded-lg hover:bg-white/8 transition-colors text-left", collapsed && "justify-center")}>
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#A855F7] flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-[11px]">{user?.initials || "U"}</span>
                            </div>
                            {!collapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-white truncate">{user?.name || "…"}</p>
                                    <p className="text-[10px] text-white/40 truncate">{user?.email || ""}</p>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
