"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { href: "/platform", label: "Platform" },
        { href: "/pricing", label: "Pricing" },
        { href: "/demo", label: "Get a Demo" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 pointer-events-none">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between pointer-events-auto">
                {/* Left: Logo + Desktop Links */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                            <img src="/logo.png" alt="Zentinel" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-sm font-black tracking-[0.2em] text-white uppercase group-hover:text-primary transition-colors">
                            Zentinel
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-6">
                        {links.map(l => (
                            <Link key={l.href} href={l.href}
                                className={`text-[13px] font-medium transition-colors ${pathname === l.href ? "text-white" : "text-[#94a3b8] hover:text-white"}`}>
                                {l.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right: Sign In + Get Started */}
                <div className="flex items-center gap-6">
                    <Link href="/sign-in" className="hidden sm:block text-[13px] font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
                        Sign In
                    </Link>
                    <Link href="/sign-up"
                        className="bg-primary text-black text-[11px] font-black px-6 py-2.5 rounded-full hover:bg-primary-dim transition-all shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:scale-[1.05] uppercase tracking-widest">
                        Get started
                    </Link>

                    {/* Mobile toggle */}
                    <button className="lg:hidden text-[#94a3b8] hover:text-white" onClick={() => setMobileOpen(v => !v)}>
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="absolute top-[65px] left-0 right-0 border-b border-white/5 bg-[#020617]/95 backdrop-blur-2xl p-6 flex flex-col gap-4 lg:hidden pointer-events-auto shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                            className="text-lg font-medium text-[#94a3b8] hover:text-white py-2">
                            {l.label}
                        </Link>
                    ))}
                    <div className="pt-4 flex flex-col gap-3 border-t border-white/10">
                        <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                            className="text-[#94a3b8] font-medium py-2">
                            Sign In
                        </Link>
                        <Link href="/sign-up" onClick={() => setMobileOpen(false)}
                            className="bg-[#6366f1] text-white text-center font-bold px-4 py-3 rounded-xl hover:bg-[#4f46e5]">
                            Get started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
