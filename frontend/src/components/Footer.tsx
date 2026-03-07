import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="h-7 w-7 rounded-lg bg-[var(--color-cyan)] flex items-center justify-center">
                                <span className="text-black font-black text-xs font-syne">Z</span>
                            </div>
                            <span className="font-syne font-black text-lg text-white">Zentinel</span>
                        </div>
                        <p className="text-sm text-[#555] leading-relaxed">
                            The AI pentester that finds real bugs and fixes them automatically.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#444] mb-4">Product</h4>
                        <nav className="flex flex-col gap-3">
                            {[["Pricing", "/pricing"], ["Sample Report", "/demo"]].map(([l, h]) => (
                                <Link key={h} href={h} className="text-sm text-[#666] hover:text-white transition-colors">{l}</Link>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#444] mb-4">Legal</h4>
                        <nav className="flex flex-col gap-3">
                            {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([l, h]) => (
                                <Link key={h} href={h} className="text-sm text-[#666] hover:text-white transition-colors">{l}</Link>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#444] mb-4">Account</h4>
                        <nav className="flex flex-col gap-3">
                            {[["Sign In", "/sign-in"], ["Sign Up", "/sign-up"]].map(([l, h]) => (
                                <Link key={h} href={h} className="text-sm text-[#666] hover:text-white transition-colors">{l}</Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#333]">© {new Date().getFullYear()} Zentinel. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
