"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
    { name: "Dashboard", href: "/crm", icon: LayoutDashboard },
    { name: "Prospects", href: "/crm/prospects", icon: Users },
    { name: "Outreach Log", href: "/crm/outreach", icon: MessageSquare },
    { name: "Performance", href: "/crm/performance", icon: BarChart3 },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [claimTag, setClaimTag] = useState("");
    const [claimError, setClaimError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaff = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('crm_staff')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                setStaff(data);
            }
            setLoading(false);
        };
        fetchStaff();
    }, [pathname]);

    const handleClaimIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setClaiming(true);
        setClaimError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            // Find unlinked staff member with this tag
            const { data: matchingStaff, error: findError } = await supabase
                .from('crm_staff')
                .select('*')
                .eq('tag', claimTag.toUpperCase())
                .is('user_id', null)
                .maybeSingle();

            if (findError) throw findError;
            if (!matchingStaff) throw new Error("Invalid tag or identity already claimed.");

            // Link them
            const { data: linkedStaff, error: linkError } = await supabase
                .from('crm_staff')
                .update({ user_id: user.id })
                .eq('id', matchingStaff.id)
                .select()
                .single();

            if (linkError) throw linkError;

            setStaff(linkedStaff);
            setClaimTag("");
        } catch (err: any) {
            setClaimError(err.message);
        } finally {
            setClaiming(false);
        }
    };

    const isAuthPage = pathname?.startsWith("/crm/sign-in") ||
        pathname?.startsWith("/crm/setup-2fa") ||
        pathname?.startsWith("/crm/verify-2fa");

    if (isAuthPage) {
        return <div className="min-h-screen bg-black">{children}</div>;
    }

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-[#444] animate-pulse">Syncing Personnel Data...</div>;
    }

    // Access Blocking: Deactivated
    if (staff && !staff.is_active) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center font-body">
                <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
                    <Shield className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-syne font-bold text-white uppercase tracking-tighter mb-4">Account Suspended</h1>
                <p className="text-[#666] max-w-md font-mono text-xs uppercase tracking-widest leading-relaxed mb-8">
                    Your access to Zentinel CRM operations has been revoked by Command.<br />
                    Contact Super Admin for clearance.
                </p>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-tighter text-[#888] hover:text-white transition-all"
                >
                    <LogOut className="h-4 w-4" /> End Session
                </button>
            </div>
        );
    }

    // Access Blocking: Unlinked/Deleted Identity
    if (!staff) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-body">
                <div className="max-w-md w-full bg-[#050505] border border-white/5 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyan)]/5 rounded-full blur-3xl -mr-16 -mt-16" />

                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center mb-4">
                            <Shield className="h-7 w-7 text-[var(--color-cyan)]" />
                        </div>
                        <h2 className="text-2xl font-bold font-syne text-white uppercase tracking-tight">Identity Required</h2>
                        <p className="text-[#666] text-[10px] font-mono uppercase tracking-widest mt-2">Claim your operative profile to continue</p>
                    </div>

                    <form onSubmit={handleClaimIdentity} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Digital callsigh / Tag</label>
                            <input
                                type="text"
                                required
                                value={claimTag}
                                onChange={(e) => setClaimTag(e.target.value)}
                                placeholder="e.g. ALPHA-1"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:border-[var(--color-cyan)]/50 transition-all font-mono text-white"
                            />
                        </div>

                        {claimError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-mono uppercase text-center">
                                {claimError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={claiming}
                            className="w-full h-12 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-tighter hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-2"
                        >
                            {claiming ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "Link Identify"}
                            {!claiming && <ChevronRight className="h-4 w-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => supabase.auth.signOut()}
                            className="w-full text-[10px] font-mono text-[#444] hover:text-[#888] uppercase tracking-widest pt-4"
                        >
                            Sign out of session
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex font-body">
            {/* CRM Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-[#050505] flex flex-col sticky top-0 h-screen overflow-y-auto">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 bg-[var(--color-cyan)] rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                            <Shield className="h-5 w-5 text-black" />
                        </div>
                        <span className="font-syne font-bold text-xl tracking-tight text-white group-hover:text-[var(--color-cyan)] transition-colors">CRM</span>
                    </Link>
                    <div className="h-2 w-2 rounded-full bg-[var(--color-cyan)] animate-pulse" />
                </div>

                <div className="px-4 py-8 flex-1 space-y-2">
                    <p className="px-2 text-[10px] uppercase tracking-widest text-[#666] font-mono mb-4">Operations</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] border border-[var(--color-cyan)]/20"
                                        : "text-[#888] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-[var(--color-cyan)]" : "text-[#555] group-hover:text-white")} />
                                <span className="text-sm font-medium">{item.name}</span>
                                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />}
                            </Link>
                        );
                    })}

                    {staff?.is_admin && (
                        <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                            <p className="px-2 text-[10px] uppercase tracking-widest text-[#666] font-mono mb-4">Administration</p>
                            <Link
                                href="/crm/team"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                                    pathname === "/crm/team"
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                        : "text-[#888] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Shield className={cn("h-4.5 w-4.5", pathname === "/crm/team" ? "text-purple-400" : "text-[#555] group-hover:text-white")} />
                                <span className="text-sm font-medium">Manage Team</span>
                                {pathname === "/crm/team" && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Staff Profile Area */}
                <div className="p-4 mt-auto">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] flex items-center justify-center font-bold text-black border border-white/10">
                                {staff?.unique_name?.[0] || "S"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-none mb-1">{staff?.unique_name || "SDR Team"}</span>
                                <span className="text-[10px] font-mono text-[var(--color-cyan)] px-1.5 py-0.5 rounded bg-[var(--color-cyan)]/10 w-fit">
                                    #{staff?.tag || "STAFF"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#666] hover:text-[var(--color-red)] transition-colors"
                        >
                            <LogOut className="h-3.5 w-3.5" /> Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {/* Search Header */}
                <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center px-8 sticky top-0 z-50">
                    <div className="max-w-md w-full relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            type="text"
                            placeholder="Quick search prospects..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-cyan)]/50 focus:bg-white/10 transition-all font-mono"
                        />
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
