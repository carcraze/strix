"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { href: "/pricing", label: "Pricing" },
        { href: "/demo", label: "Sample Report" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="h-7 w-7 rounded-lg bg-[var(--color-cyan)] flex items-center justify-center">
                        <span className="text-black font-black text-xs font-syne">Z</span>
                    </div>
                    <span className="font-syne font-black text-lg text-white tracking-tight">Zentinel</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {links.map(l => (
                        <Link key={l.href} href={l.href}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === l.href ? "text-white bg-white/5" : "text-[#888] hover:text-white hover:bg-white/5"}`}>
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/sign-in" className="text-sm text-[#888] hover:text-white transition-colors">
                        Sign in
                    </Link>
                    <Link href="/sign-up"
                        className="bg-[var(--color-cyan)] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-cyan)]/90 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                        Get Started Now
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button className="md:hidden text-[#888] hover:text-white" onClick={() => setMobileOpen(v => !v)}>
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/5 bg-black px-4 py-4 space-y-2">
                    {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2.5 rounded-lg text-sm text-[#888] hover:text-white hover:bg-white/5 transition-colors">
                            {l.label}
                        </Link>
                    ))}
                    <div className="pt-2 flex flex-col gap-2">
                        <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                            className="block text-center px-4 py-2.5 rounded-lg text-sm text-[#888] hover:text-white hover:bg-white/5 border border-white/10">
                            Sign in
                        </Link>
                        <Link href="/sign-up" onClick={() => setMobileOpen(false)}
                            className="block text-center bg-[var(--color-cyan)] text-black text-sm font-bold px-4 py-2.5 rounded-lg">
                            Get Started Now
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
