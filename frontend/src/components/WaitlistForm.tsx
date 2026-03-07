"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await supabase.from("waitlist").insert({ email });
        setSubmitted(true);
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="text-center py-4">
                <p className="text-[var(--color-cyan)] font-mono text-sm">✓ You&apos;re on the list! We&apos;ll be in touch.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[var(--color-cyan)]/50"
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-[var(--color-cyan)] text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-[var(--color-cyan)]/90 disabled:opacity-60 transition-colors"
            >
                {loading ? "..." : "Join"}
            </button>
        </form>
    );
}
