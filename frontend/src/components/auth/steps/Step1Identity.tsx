import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { AuthButtons } from "../AuthButtons";
import { useState } from "react";
import { detectSSO } from "@/lib/auth/detect-sso";

interface Step1Props {
    formData: any;
    updateData: (data: any) => void;
    loading: boolean;
    setLoading: (l: boolean) => void;
}

export function Step1Identity({ formData, updateData, loading, setLoading }: Step1Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [checkingSSO, setCheckingSSO] = useState(false);
    const [ssoUrl, setSsoUrl] = useState<string | null>(null);

    const handleEmailBlur = async () => {
        const email = formData.email;
        if (!email || !email.includes('@')) return;
        setCheckingSSO(true);
        try {
            const domain = email.split('@')[1];
            if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
                setSsoUrl(null);
                setCheckingSSO(false);
                return;
            }
            const result = await detectSSO(email);
            if (result.ssoEnabled && result.redirectUrl) {
                setSsoUrl(result.redirectUrl);
            } else {
                setSsoUrl(null);
            }
        } catch (e) {
            setSsoUrl(null);
        } finally {
            setCheckingSSO(false);
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <AuthButtons checkingSSO={checkingSSO} ssoUrl={ssoUrl} loading={loading} setLoading={setLoading} />

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[var(--color-border)]"></div>
                <span className="shrink-0 mx-4 text-xs font-mono text-[var(--color-textMuted)]">OR</span>
                <div className="flex-grow border-t border-[var(--color-border)]"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                    <Label className="text-[var(--color-textSecondary)] text-xs font-mono">FIRST NAME</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                        <Input
                            required
                            placeholder="Alice"
                            value={formData.firstName}
                            onChange={(e) => updateData({ firstName: e.target.value })}
                            className="pl-10 h-11 bg-[var(--background)] border-[var(--color-border)]"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[var(--color-textSecondary)] text-xs font-mono">LAST NAME</Label>
                    <Input
                        required
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={(e) => updateData({ lastName: e.target.value })}
                        className="h-11 bg-[var(--background)] border-[var(--color-border)]"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-[var(--color-textSecondary)] text-xs font-mono">EMAIL ADDRESS</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                    <Input
                        required
                        type="email"
                        placeholder="alice@company.com"
                        value={formData.email}
                        onChange={(e) => updateData({ email: e.target.value })}
                        onBlur={handleEmailBlur}
                        className="pl-10 h-11 bg-[var(--background)] border-[var(--color-border)]"
                    />
                    {checkingSSO && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-[var(--color-cyan)] border-t-transparent animate-spin" />
                    )}
                </div>
            </div>

            {!ssoUrl && (
                <div className="space-y-1">
                    <Label className="text-[var(--color-textSecondary)] text-xs font-mono">PASSWORD</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                        <Input
                            required
                            minLength={8}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => updateData({ password: e.target.value })}
                            className="pl-10 pr-10 h-11 bg-[var(--background)] border-[var(--color-border)]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)] hover:text-white"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-[var(--color-textMuted)] font-mono ml-1 mt-1">Must be at least 8 characters long</p>
                </div>
            )}
        </div>
    );
}
