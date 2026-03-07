import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface Step3Props {
    formData: any;
    updateData: (data: any) => void;
}

const PLATFORMS = [
    { id: "github", label: "GitHub" },
    { id: "gitlab", label: "GitLab" },
    { id: "bitbucket", label: "Bitbucket" },
    { id: "azure", label: "Azure DevOps" },
];

const CONCERNS = [
    { id: "api_security", label: "API Security" },
    { id: "cloud_misconfigs", label: "Cloud Misconfigs" },
    { id: "dependency_vulns", label: "Dependency Vulns" },
    { id: "compliance", label: "Compliance (SOC2/ISO)" },
];

export function Step3Stack({ formData, updateData }: Step3Props) {
    const togglePlatform = (id: string) => {
        const current = new Set(formData.codePlatforms);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        updateData({ codePlatforms: Array.from(current) });
    };

    const toggleConcern = (id: string) => {
        const current = new Set(formData.concerns);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        updateData({ concerns: Array.from(current) });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
                <Label className="text-[var(--color-textSecondary)] text-xs font-mono block">WHERE IS YOUR CODE?</Label>
                <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => {
                        const isSelected = formData.codePlatforms.includes(platform.id);
                        return (
                            <button
                                key={platform.id}
                                type="button"
                                onClick={() => togglePlatform(platform.id)}
                                className={`flex items-center justify-between p-3 rounded-md border text-sm transition-all ${isSelected
                                        ? "bg-[var(--color-cyan)]/10 border-[var(--color-cyan)] text-white"
                                        : "bg-[var(--background)] border-[var(--color-border)] text-[var(--color-textSecondary)] hover:border-white/20 hover:text-white"
                                    }`}
                            >
                                {platform.label}
                                {isSelected && <Check className="h-4 w-4 text-[var(--color-cyan)]" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-[var(--color-textSecondary)] text-xs font-mono block">WHAT ARE YOU MOST WORRIED ABOUT?</Label>
                <div className="grid grid-cols-2 gap-3">
                    {CONCERNS.map((concern) => {
                        const isSelected = formData.concerns.includes(concern.id);
                        return (
                            <button
                                key={concern.id}
                                type="button"
                                onClick={() => toggleConcern(concern.id)}
                                className={`flex items-center justify-between p-3 rounded-md border text-sm transition-all ${isSelected
                                        ? "bg-[var(--color-cyan)]/10 border-[var(--color-cyan)] text-white"
                                        : "bg-[var(--background)] border-[var(--color-border)] text-[var(--color-textSecondary)] hover:border-white/20 hover:text-white"
                                    }`}
                            >
                                {concern.label}
                                {isSelected && <Check className="h-4 w-4 text-[var(--color-cyan)]" />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
