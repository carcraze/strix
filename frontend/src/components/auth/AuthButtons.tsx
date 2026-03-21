import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

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
    if (!ssoUrl) return null;

    return (
        <div className="space-y-3">
            <Button
                type="button"
                onClick={() => window.location.href = ssoUrl}
                className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 transition-all"
            >
                <Globe className="h-4 w-4 mr-2" /> Continue with SSO
            </Button>
        </div>
    );
}
