"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthListener() {
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                router.push("/sign-in");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    return null;
}
