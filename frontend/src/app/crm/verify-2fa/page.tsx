"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ArrowRight, Lock, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CRMVerify2FA() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);

    useEffect(() => {
        const getFactor = async () => {
            const { data, error } = await supabase.auth.mfa.listFactors();

            if (error) {
                console.error("MFA Error:", error);
                return;
            }

            const verifiedFactor = data.totp?.find(f => f.status === 'verified');

            if (!verifiedFactor) {
                console.warn("No verified TOTP factors found. Redirecting to setup.");
                router.push("/crm/setup-2fa");
                return;
            }

            setFactorId(verifiedFactor.id);
        };
        getFactor();
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6 || !factorId) return;

        setLoading(true);
        try {
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.id,
                code
            });

            if (verifyError) throw verifyError;

            // Success! 
            router.push("/crm");
        } catch (err: any) {
            alert(err.message || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/crm/sign-in");
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-body">
            <div className="max-w-md w-full bg-[#050505] border border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center mb-4">
                        <Lock className="h-7 w-7 text-[var(--color-cyan)]" />
                    </div>
                    <h1 className="text-2xl font-bold font-syne text-white mb-2 uppercase tracking-tight">Identity Verified</h1>
                    <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Enter authentication code to proceed</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            className="bg-white/5 border-white/10 text-white text-center text-3xl h-20 rounded-2xl tracking-[0.5em] font-mono focus:border-[var(--color-cyan)]"
                            autoFocus
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || code.length !== 6 || !factorId}
                        className="w-full h-14 rounded-2xl bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold text-base shadow-[0_4px_15px_rgba(0,212,255,0.2)]"
                    >
                        {loading ? "VERIFYING..." : "UNLOCK CRM ACCESS"}
                        {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 text-[#444] hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Use different account
                    </button>
                </form>

                <div className="mt-10 text-center grayscale opacity-30">
                    <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-white mb-1">
                        <ShieldCheck className="h-3 w-3" /> SECURE LINK ESTABLISHED
                    </div>
                    <p className="text-[8px] font-mono text-white/50 uppercase tracking-[0.2em]">
                        Endpoint: {typeof window !== 'undefined' ? window.location.hostname : 'secure-gate'}
                    </p>
                </div>
            </div>
        </div>
    );
}
