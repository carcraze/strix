"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AuthCallback() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const token = params.get('token');
            const type = params.get('type') as any;
            const email = params.get('email');

            if (token && type === 'magiclink' && email) {
                // Verify the token and establish Supabase session
                const { error } = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type,
                });

                if (error) {
                    router.push('/login?error=session_failed');
                    return;
                }
            }

            // Session established — redirect to dashboard
            router.push('/dashboard');
        };

        handleCallback();
    }, [params, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-cyan)] border-t-transparent animate-spin"></div>
                <p className="text-[var(--color-textPrimary)] font-mono text-sm">Validating Enterprise Credentials...</p>
            </div>
        </div>
    );
}
