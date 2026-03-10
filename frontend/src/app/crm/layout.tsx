"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BarChart3,
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
            const { data: matchingStaff, error: findError } = await supabase
                .from('crm_staff')
                .select('*')
                .eq('tag', claimTag.toUpperCase())
                .is('user_id', null)
                .maybeSingle();
            if (findError) throw findError;
            if (!matchingStaff) throw new Error("Invalid tag or identity already claimed.");
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
        return <div className="min-h-screen bg-white">{children}</div>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-xs text-[#6b7280] tracking-widest uppercase animate-pulse">
                Loading...
            </div>
        );
    }

    if (staff && !staff.is_active) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-6">
                    <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#0a0a0a] mb-3">Account Suspended</h1>
                <p className="text-[#6b7280] text-sm max-w-sm mb-8">
                    Your access to Zentinel CRM has been suspended. Contact an administrator for assistance.
                </p>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1f1f1f] transition-colors"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </button>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-8">
                <div className="max-w-md w-full bg-white border border-[#e5e7eb] rounded-2xl p-10 shadow-sm">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="h-12 w-12 rounded-xl bg-[#0a0a0a] flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-[#0a0a0a]">Claim Your Identity</h2>
                        <p className="text-[#6b7280] text-sm mt-1">Enter your staff tag to access the CRM</p>
                    </div>
                    <form onSubmit={handleClaimIdentity} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">Staff Tag</label>
                            <input
                                type="text"
                                required
                                value={claimTag}
                                onChange={(e) => setClaimTag(e.target.value)}
                                placeholder="e.g. ALPHA-1"
                                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-2.5 px-4 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder:text-[#9ca3af]"
                            />
                        </div>
                        {claimError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                                {claimError}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={claiming}
                            className="w-full h-11 rounded-lg bg-[#0a0a0a] text-white font-semibold text-sm hover:bg-[#1f1f1f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Claim Identity <ChevronRight className="h-4 w-4" /></>}
                        </button>
                        <button
                            type="button"
                            onClick={() => supabase.auth.signOut()}
                            className="w-full text-xs text-[#9ca3af] hover:text-[#6b7280] transition-colors pt-2"
                        >
                            Sign out of session
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex font-body">
            {/* CRM Sidebar — stays dark */}
            <aside className="w-60 bg-[#0a0a0a] flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
                <div className="p-5 border-b border-[#1f1f1f] flex items-center gap-3">
                    <div className="h-7 w-7 bg-white rounded-md flex items-center justify-center">
                        <Shield className="h-4 w-4 text-[#0a0a0a]" />
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">CRM</span>
                </div>

                <nav className="px-3 py-5 flex-1 space-y-1">
                    <p className="px-3 text-[10px] uppercase tracking-widest text-[#9ca3af] mb-3">Operations</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/crm' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm",
                                    isActive
                                        ? "bg-white text-[#0a0a0a] font-semibold"
                                        : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}

                    {staff?.is_admin && (
                        <div className="pt-4 mt-4 border-t border-[#1f1f1f] space-y-1">
                            <p className="px-3 text-[10px] uppercase tracking-widest text-[#9ca3af] mb-3">Administration</p>
                            <Link
                                href="/crm/team"
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm",
                                    pathname === "/crm/team"
                                        ? "bg-white text-[#0a0a0a] font-semibold"
                                        : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Shield className="h-4 w-4 shrink-0" />
                                <span>Manage Team</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Staff Profile */}
                <div className="p-3 border-t border-[#1f1f1f]">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {staff?.unique_name?.[0] || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{staff?.unique_name || "SDR"}</p>
                            <p className="text-[11px] text-[#9ca3af] truncate">#{staff?.tag || "STAFF"}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-[#9ca3af] hover:text-[#dc2626] transition-colors rounded-lg hover:bg-white/5 mt-1"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content Area — light */}
            <main className="flex-1 overflow-y-auto bg-white">
                {/* Top search bar */}
                <header className="h-14 border-b border-[#e5e7eb] bg-white flex items-center px-6 sticky top-0 z-40">
                    <div className="max-w-sm w-full relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="w-full bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg py-1.5 pl-9 pr-4 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder:text-[#9ca3af]"
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
