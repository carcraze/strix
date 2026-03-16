"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to send reset email");
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
                    <ShieldCheck className="h-10 w-10 text-[var(--color-cyan)]" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-syne font-bold text-white tracking-tight">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm font-mono text-[var(--color-textSecondary)]">
                    Enter your email to receive a secure reset link
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-[#0D1117] py-8 px-4 shadow-2xl border border-[var(--color-border)] sm:rounded-2xl sm:px-10 relative overflow-hidden">
                    {success ? (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold font-syne text-white">Check Your Email</h3>
                            <p className="text-sm font-mono text-[var(--color-textSecondary)]">
                                We've sent password reset instructions to <span className="text-white">{email}</span>.
                            </p>
                            <div className="pt-4">
                                <Link href="/sign-in">
                                    <Button className="w-full bg-[var(--color-border)] text-white hover:bg-[#2A303C]">
                                        Back to Sign In
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
                                <label htmlFor="email" className="block text-sm font-mono font-medium text-[var(--color-textSecondary)] mb-2">
                                    Email Address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-[#050505] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-textSecondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent sm:text-sm font-mono transition-all duration-200"
                                        placeholder="founder@startup.com"
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
                                            Send Reset Link
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-sm font-mono text-[var(--color-textSecondary)]">
                                    Remembered your password?{" "}
                                    <Link href="/sign-in" className="font-medium text-[var(--color-cyan)] hover:text-cyan-400 transition-colors">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
