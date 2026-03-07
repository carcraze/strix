import { Button } from "@/components/ui/button";
import { Chrome, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthButtons({
    checkingSSO,
    ssoUrl,
    loading,
    setLoading
}: {
    checkingSSO: boolean;
    ssoUrl: string | null;
    loading: boolean;
    setLoading: (val: boolean) => void;
}) {
    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Important: we redirect back to the app so they can finish onboarding
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (error) {
                alert(error.message);
                setLoading(false);
            }
        } catch (err) {
            console.error("Google sign in error:", err);
            alert("An error occurred during Google sign in");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            {ssoUrl ? (
                <Button
                    type="button"
                    onClick={() => window.location.href = ssoUrl}
                    className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 transition-all"
                >
                    <Globe className="h-4 w-4 mr-2" /> Continue with SSO
                </Button>
            ) : (
                <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || checkingSSO}
                    variant="outline"
                    className="w-full bg-[var(--background)] border border-[var(--color-border)] text-white hover:bg-white/5 h-11"
                >
                    <Chrome className="h-4 w-4 mr-2" /> Continue with Google
                </Button>
            )}
        </div>
    );
}
