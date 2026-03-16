"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });
            if (updateError) throw updateError;
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-cyan)] opacity-[0.03] blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-purple)] opacity-[0.03] blur-[120px] rounded-full"></div>
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 flex flex-col items-center">
                <div className="flex bg-[#0D1117] p-3 rounded-2xl border border-[var(--color-border)] shadow-xl mb-6">
                    <Lock className="h-10 w-10 text-[var(--color-cyan)]" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-syne font-bold text-white tracking-tight">
                    Set a new password
                </h2>
                <p className="mt-2 text-center text-sm font-mono text-[var(--color-textSecondary)]">
                    Please securely enter your new password below
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-[#0D1117] py-8 px-4 shadow-2xl border border-[var(--color-border)] sm:rounded-2xl sm:px-10 relative overflow-hidden">
                    {success ? (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold font-syne text-white">Password Updated</h3>
                            <p className="text-sm font-mono text-[var(--color-textSecondary)]">
                                Your password has been successfully reset.
                            </p>
                            <div className="pt-4">
                                <Link href="https://app.zentinel.dev/dashboard">
                                    <Button className="w-full bg-[var(--color-cyan)] text-black hover:bg-cyan-400 font-bold border-none">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 font-mono text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-mono font-medium text-[var(--color-textSecondary)] mb-2">
                                    New Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-[#050505] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-textSecondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent sm:text-sm font-mono transition-all duration-200"
                                        placeholder="Min 8 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold font-syne text-black bg-[var(--color-cyan)] hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-[#050505] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin h-5 w-5 text-black" />
                                    ) : (
                                        <span className="flex items-center">
                                            Update Password
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
