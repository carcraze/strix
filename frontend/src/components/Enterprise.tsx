"use client";

import { useEffect, useState } from "react";
import { Zap, Bot, Rocket, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QualifyModal } from "@/components/QualifyModal";

export function Enterprise() {
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
        const calTrigger = document.getElementById("cal-trigger-btn");
        if (calTrigger) {
            calTrigger.click();
        }
    };

    return (
        <section className="py-16 md:py-24 bg-black border-t border-white/10 relative">
            <QualifyModal
                isOpen={isQualifyOpen}
                onClose={() => setIsQualifyOpen(false)}
                onSuccess={handleQualifySuccess}
            />
            {/* Hidden Cal Trigger */}
            <button
                id="cal-trigger-btn"
                className="hidden"
                data-cal-link="alvin-zentinel-ai/30min"
                data-cal-namespace="30min"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Heading & CTA */}
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl font-sans">
                            Hyperscale Security Infrastructure
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
                            Tailored solutions for high-growth startups and global enterprises.
                            Flexible pricing, custom deployment, and deep integration options.
                        </p>
                        <Button
                            className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8 rounded-lg text-base mt-2"
                            onClick={() => setIsQualifyOpen(true)}
                        >
                            Book a Demo
                        </Button>
                    </div>

                    {/* Right Column: Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden">

                        <div className="bg-black/40 p-6 md:p-8 space-y-3 md:space-y-4 hover:bg-white/5 transition-colors group h-full">
                            <div className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors">
                                <Zap className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white">Continuous Pentesting</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Move beyond point-in-time assessments. Security testing at the speed of AI that runs with every commit, every deploy, every day.
                            </p>
                        </div>

                        <div className="bg-black/40 p-6 md:p-8 space-y-3 md:space-y-4 hover:bg-white/5 transition-colors group border-b md:border-b-0 md:border-l border-white/10 h-full">
                            <div className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors">
                                <Bot className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white">Fully Autonomous</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                AI agents that reason, adapt, and chain complex attacks from recon to exploitation.
                            </p>
                        </div>

                        <div className="bg-black/40 p-6 md:p-8 space-y-3 md:space-y-4 hover:bg-white/5 transition-colors group border-t border-white/10 h-full">
                            <div className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors">
                                <Rocket className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white">Venture-Scale Security</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Trusted by fast-growing startups to secure their path to Series A. We catch the critical flaws, so you can focus on the roadmap.
                            </p>
                        </div>

                        <div className="bg-black/40 p-6 md:p-8 space-y-3 md:space-y-4 hover:bg-white/5 transition-colors group border-t md:border-l border-white/10 h-full">
                            <div className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors">
                                <Trophy className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white">State of the Art</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Top scores on industry benchmarks for detection. Finds what others miss.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
