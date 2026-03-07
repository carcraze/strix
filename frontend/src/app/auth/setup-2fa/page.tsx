import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Setup2FAPage() {
    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
                <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="h-7 w-7 text-[var(--color-cyan)]" />
                </div>
                <h1 className="text-2xl font-syne font-bold text-white mb-2">Set Up Two-Factor Auth</h1>
                <p className="text-[#666] text-sm mb-8">Add an extra layer of security to your account.</p>
                <Link href="/dashboard" className="block w-full bg-[var(--color-cyan)] text-black font-bold py-3 rounded-xl hover:bg-[var(--color-cyan)]/90 transition-colors">
                    Skip for now
                </Link>
            </div>
        </main>
    );
}
