"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
    LayoutGrid,
    Search,
    GitPullRequest,
    ShieldAlert,
    Layers,
    Globe,
    GitBranch,
    Settings,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";

const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
    { icon: Search, label: "Pentests", href: "/dashboard/pentests" },
    { icon: GitPullRequest, label: "PR Reviews", href: "/dashboard/pr-reviews" },
    { icon: ShieldAlert, label: "Issues", href: "/dashboard/issues" },
    { icon: Layers, label: "Repositories", href: "/dashboard/repositories" },
    { icon: Globe, label: "Domains", href: "/dashboard/domains" },
    { icon: GitBranch, label: "Integrations", href: "/dashboard/integrations" },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { activeWorkspace } = useWorkspace();
    const userRole = activeWorkspace?.role || "viewer";
    const isSettingsActive = pathname.startsWith("/dashboard/settings");
    const canSeeBilling = ["owner", "admin"].includes(userRole);

    const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Fetch real user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
                const email = data.user.email || "";
                const meta = data.user.user_metadata || {};
                const name = meta.full_name || meta.name || email.split("@")[0] || "User";
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
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-50 h-[100dvh] w-[240px] border-r border-[var(--color-border)] bg-[var(--background)] flex flex-col py-6 transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>

            <WorkspaceSwitcher />

            <div className="px-4 text-xs font-mono text-[var(--color-textMuted)] font-medium mb-3 tracking-wider">OVERVIEW</div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-0.5 w-full px-3 overflow-y-auto">
                {isSettingsActive ? (
                    <div className="flex flex-col gap-0.5 animate-in slide-in-from-left-2 duration-300">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5 group mb-4"
                        >
                            <Settings className="h-4 w-4 shrink-0 transition-colors rotate-180" />
                            <span className="font-bold">Settings</span>
                            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-[var(--color-textMuted)]">BACK</span>
                            </div>
                        </Link>

                        <div className="px-3 text-[10px] font-mono text-[var(--color-textMuted)] font-medium mb-1 tracking-wider uppercase">General</div>
                        <Link
                            href="/dashboard/settings/general"
                            onClick={() => setIsOpen?.(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                                pathname === "/dashboard/settings/general"
                                    ? "text-white bg-white/5"
                                    : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span>General</span>
                        </Link>
                        <Link
                            href="/dashboard/settings/members"
                            onClick={() => setIsOpen?.(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                                pathname === "/dashboard/settings/members"
                                    ? "text-white bg-white/5"
                                    : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span>Members</span>
                        </Link>
                        {canSeeBilling && (
                            <Link
                                href="/dashboard/settings/billing"
                                onClick={() => setIsOpen?.(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                                    pathname === "/dashboard/settings/billing"
                                        ? "text-white bg-white/5"
                                        : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span>Billing</span>
                            </Link>
                        )}
                        <Link
                            href="/dashboard/settings/notifications"
                            onClick={() => setIsOpen?.(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                                pathname === "/dashboard/settings/notifications"
                                    ? "text-white bg-white/5"
                                    : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span>Notifications</span>
                        </Link>
                        {((activeWorkspace?.plan === "scale" || activeWorkspace?.plan === "enterprise") && ["owner", "admin"].includes(userRole)) && (
                            <Link
                                href="/dashboard/settings/sso"
                                onClick={() => setIsOpen?.(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm",
                                    pathname === "/dashboard/settings/sso"
                                        ? "text-white bg-white/5"
                                        : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span>SSO</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {navItems.map((item) => {
                            const isActive = item.href === "/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen?.(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm group",
                                        isActive
                                            ? "text-white bg-[var(--color-cyan)]/10"
                                            : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[var(--color-cyan)]" : "text-[var(--color-textMuted)] group-hover:text-white")} />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Management Section */}
                        <div className="mt-3 text-xs font-mono text-[var(--color-textMuted)] font-medium mb-1 px-3 tracking-wider">MANAGEMENT</div>


                        <Link
                            href="/dashboard/settings/general"
                            onClick={() => setIsOpen?.(false)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg transition-colors font-medium text-sm group",
                                isSettingsActive
                                    ? "text-white bg-white/5"
                                    : "text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Settings className={cn("h-4 w-4 transition-colors", isSettingsActive ? "text-white" : "text-[var(--color-textMuted)] group-hover:text-white")} />
                                <span>Settings</span>
                            </div>
                        </Link>
                    </>
                )}
            </nav>

            {/* User Footer */}
            <div className="px-3 mt-4 relative" ref={userMenuRef}>
                {/* Logout popup */}
                {showUserMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 mx-0 bg-[#111] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
                        <div className="p-2">
                            <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                                <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-[var(--color-textMuted)] truncate">{user?.email || ""}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-textMuted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                            >
                                <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
                                Log out
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-xl transition-colors text-left border border-transparent hover:border-[var(--color-border)]"
                >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-cyan)] to-[#A855F7] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold font-syne text-xs">{user?.initials || "U"}</span>
                    </div>
                    <div className="flex flex-col truncate min-w-0">
                        <span className="font-medium text-sm text-white truncate">{user?.name || "Loading..."}</span>
                        <span className="text-xs text-[var(--color-textMuted)] truncate">{user?.email || ""}</span>
                    </div>
                </button>
            </div>
        </aside>
    );
}
