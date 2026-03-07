import { ShieldCheck } from "lucide-react";

const logos = ["YC Backed", "SOC2", "GDPR", "ISO 27001"];

export function Trust() {
    return (
        <section className="py-12 border-b border-white/5">
            <div className="max-w-5xl mx-auto px-6">
                <p className="text-center text-xs font-mono text-[#333] uppercase tracking-widest mb-8">Trusted by security-conscious teams</p>
                <div className="flex items-center justify-center gap-10 flex-wrap">
                    {logos.map(l => (
                        <div key={l} className="flex items-center gap-2 text-[#444] text-sm font-mono">
                            <ShieldCheck className="h-4 w-4 text-[#333]" /> {l}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
