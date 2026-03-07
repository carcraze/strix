"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SecurityCheck({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace("/sign-in");
            } else {
                setChecking(false);
            }
        });
    }, [router]);

    if (checking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-cyan)] border-t-transparent animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
