"use client";

import { ShieldCheck, Crosshair, Zap, FileCode, FileText, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QualifyModal } from "@/components/QualifyModal";
import { useEffect, useState } from "react";

const topFeatures = [
    { title: "PoC & Exploit Evidence", description: "Every finding includes a PoC and exploit evidence, so you don't deal with false positives.", icon: ShieldCheck },
    { title: "Full Attack Surface Visibility", description: "Scans APIs, web apps, networks, and GitHub/GitLab code.", icon: Crosshair },
    { title: "Elite Pentester Tactics", description: "Launches actual exploits to validate vulnerabilities like elite penetration testers.", icon: Zap },
    { title: "Production-Ready Fixes", description: "Writes detailed reports and generates production-ready fixes automatically.", icon: FileCode },
    { title: "Audit-Ready Reports", description: "Generates detailed reports for SOC 2, ISO 27001, and PCI DSS compliance requirements.", icon: FileText },
    { title: "Seamless Workflow", description: "Integrates with your development workflow and deployment pipelines.", icon: Workflow },
];

const bottomFeatures = [
    { title: "Fully Autonomous", description: "AI agents that reason, adapt, and chain complex attacks from recon to exploitation.", icon: Zap },
    { title: "Venture-Scale Security", description: "Trusted by fast-growing startups to secure their path to Series A. We catch the critical flaws, so you can focus on the roadmap.", icon: ShieldCheck },
    { title: "State of the Art", description: "Top scores on industry benchmarks for detection. Finds what others miss.", icon: Crosshair },
];

export function Features() {
    const [isQualifyOpen, setIsQualifyOpen] = useState(false);

    useEffect(() => {
        (function (C: any, A, L) {
            const p = function (a: any, ar: any) { a.q.push(ar); };
            const d = C.document;
            C.Cal = C.Cal || function () {
                const cal = C.Cal;
                const ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    d.head.appendChild(d.createElement("script")).src = A;
                    cal.loaded = true;
                }
                if (ar[0] === L) {
                    const api: any = function () { p(api, arguments); };
                    const namespace = ar[1];
                    api.q = api.q || [];
                    if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar);
                    return;
                }
                p(cal, ar);
            };
        })(window, "https://app.cal.com/embed/embed.js", "init");

        // @ts-ignore
        Cal("init", "30min", { origin: "https://app.cal.com" });

        // @ts-ignore
        Cal.ns["30min"]("ui", { "hideEventTypeDetails": false, "layout": "month_view" });
    }, []);

    const handleQualifySuccess = () => {
        // Find and click the hidden Cal trigger
        const calTrigger = document.getElementById("cal-trigger-features");
        if (calTrigger) {
            calTrigger.click();
        }
    };

    return (
        <section id="features" className="py-16 md:py-24 bg-black relative z-10">
            <QualifyModal
                isOpen={isQualifyOpen}
                onClose={() => setIsQualifyOpen(false)}
                onSuccess={handleQualifySuccess}
            />
            {/* Hidden Cal Trigger - unique ID for Features */}
            <button
                id="cal-trigger-features"
                className="hidden"
                data-cal-link="alvin-zentinel-ai/30min"
                data-cal-namespace="30min"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* Layer 1: The 3x2 Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-20">
                    {topFeatures.map((feature, index) => (
                        <div key={index} className="p-10 border-white/10 border-b lg:border-r last:border-b-0 hover:bg-white/5 transition-colors">
                            <feature.icon className="h-5 w-5 text-white/40 mb-4" />
                            <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Layer 2: The Rephrased Text (Medium Size) */}
                <div className="text-center my-24 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                            The security team you didn't have to hire <ShieldCheck className="inline-block h-6 w-6 text-white/20 ml-2" />
                        </h2>
                        <p className="text-lg md:text-xl text-white/50 font-medium">
                            Autonomous, validated, and production-ready security audits
                        </p>
                        <div className="mt-8">
                            <Button
                                className="bg-white text-black hover:bg-gray-200 font-bold px-8 h-12 rounded-lg"
                                onClick={() => setIsQualifyOpen(true)}
                            >
                                Secure my stack
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Layer 3: The 3x1 Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/10">
                    {bottomFeatures.map((feature, index) => (
                        <div key={index} className="space-y-4">
                            <h4 className="text-lg font-bold text-white">{feature.title}</h4>
                            <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

