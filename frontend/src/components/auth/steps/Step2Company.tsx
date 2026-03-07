import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step2Props {
    formData: any;
    updateData: (data: any) => void;
}

export function Step2Company({ formData, updateData }: Step2Props) {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
                <Label className="text-[var(--color-textSecondary)] text-xs font-mono mb-1 block">COMPANY NAME</Label>
                <Input
                    required
                    placeholder="Acme Corp"
                    value={formData.companyName}
                    onChange={(e) => updateData({ companyName: e.target.value })}
                    className="h-11 bg-[var(--background)] border-[var(--color-border)]"
                />
            </div>

            <div className="space-y-1">
                <Label className="text-[var(--color-textSecondary)] text-xs font-mono mb-1 block">COMPANY WEBSITE</Label>
                <Input
                    required
                    type="url"
                    placeholder="acme.com"
                    value={formData.companyWebsite}
                    onChange={(e) => updateData({ companyWebsite: e.target.value })}
                    className="h-11 bg-[var(--background)] border-[var(--color-border)]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-[var(--color-textSecondary)] text-xs font-mono mb-1 block">YOUR ROLE</Label>
                    <select
                        required
                        value={formData.role}
                        onChange={(e) => updateData({ role: e.target.value })}
                        className="w-full h-11 px-3 bg-[var(--background)] border border-[var(--color-border)] rounded-md text-sm text-white focus:outline-none focus:border-[var(--color-cyan)]"
                    >
                        <option value="" disabled>Select role...</option>
                        <option value="Founder">Founder</option>
                        <option value="CTO">CTO</option>
                        <option value="Security Lead">Security Lead</option>
                        <option value="Developer">Developer</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <Label className="text-[var(--color-textSecondary)] text-xs font-mono mb-1 block">COMPANY SIZE</Label>
                    <select
                        required
                        value={formData.companySize}
                        onChange={(e) => updateData({ companySize: e.target.value })}
                        className="w-full h-11 px-3 bg-[var(--background)] border border-[var(--color-border)] rounded-md text-sm text-white focus:outline-none focus:border-[var(--color-cyan)]"
                    >
                        <option value="" disabled>Select size...</option>
                        <option value="1-10">1–10</option>
                        <option value="11-50">11–50</option>
                        <option value="51-200">51–200</option>
                        <option value="200+">200+</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
