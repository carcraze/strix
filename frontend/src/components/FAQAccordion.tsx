"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = {
    question: string;
    answer: string;
};

export const generalFaqs: FAQItem[] = [
    {
        question: "How does Zentinel know which alerts are relevant?",
        answer: "We've built a rule engine that takes the context of your environment into account. This allows us to easily adapt the criticality score for your environment & filter out false positives. If we're not sure, the algorithm always reverts to the safest option.",
    },
    {
        question: "What happens to my data?",
        answer: "We clone the repositories inside of temporary environments (such as Docker containers unique to you). Those containers are disposed of after analysis. The duration of the test and scans takes about 1-5 mins. All the clones and containers are then auto-removed after that, always, every time, for every customer.",
    },
    {
        question: "Does Zentinel make changes to my codebase?",
        answer: "We can't & won't, this is guaranteed by read-only access. AutoFix generates patches for you to review and merge manually.",
    },
    {
        question: "I don't want to connect my repository. Can I try it with a test account?",
        answer: "Of course! When you sign up with your Git account, don't give access to any repo & select the demo repo instead!",
    },
    {
        question: "How is Zentinel different?",
        answer: "Zentinel combines features from lots of different platforms in one. By bringing together multiple tools in one platform, we're able to contextualize vulnerabilities, filter out false positives, and reduce noise by 95%.",
    },
    {
        question: "How can I trust Zentinel?",
        answer: "We're doing everything we can to be fully secure & compliant. Zentinel has been examined to attest that its system and the suitability of the design of controls meets the AICPA's SOC 2 Type II & ISO 27001:2022 requirements.",
    },
];

export const pricingFaqs: FAQItem[] = [
    {
        question: "Do I need to pay upfront to start a pentest?",
        answer: "No. Start the pentest with 'Skip payment.' When it's done, you'll see the results summary. High/critical issues and the full report unlock only if you decide to pay. No upfront cost. No risk to try.",
    },
    {
        question: "How does AI pentesting compare to a human pentest?",
        answer: "For web applications, AI Pentesting delivers coverage comparable to a traditional human-led pentest, with results available in hours instead of weeks. In side-by-side evaluations, autonomous agents have matched and in some cases exceeded human coverage by exploring more paths consistently. Human testers remain valuable for non-web targets and highly contextual edge cases.",
    },
    {
        question: "How is scope and safety enforced?",
        answer: "You define which domains can be attacked and which are only reachable. All traffic is enforced through strict guardrails, with pre-flight checks before the run and a panic button that stops all agents instantly.",
    },
    {
        question: "What kinds of vulnerabilities can AI Pentesting find?",
        answer: "AI Pentesting covers everything expected from a penetration test, including injection flaws, access control issues, authentication weaknesses, and unsafe API behavior. It also detects business logic and authorization issues such as IDOR and cross-tenant access by reasoning about how the application is supposed to behave.",
    },
    {
        question: "How does Zentinel prevent false positives?",
        answer: "Findings are only reported after they are successfully exploited and confirmed against the live target. If an attack attempt cannot be validated, it is discarded and never shown in the results.",
    },
    {
        question: "Do I need to give access to my source code?",
        answer: "No, but providing code access significantly improves results. When repositories are connected, agents understand application logic, roles, and data flows, which leads to deeper coverage and more accurate findings.",
    },
    {
        question: "What role does AutoFix play?",
        answer: "Because Zentinel already understands your code and environment, AutoFix generates targeted code changes for confirmed vulnerabilities. Once applied, the issue can be immediately retested to verify that it is fully resolved.",
    },
    {
        question: "Can I use it for compliance or audit reports?",
        answer: "Yes. Every run produces an audit-ready penetration test report with validated findings, proof-of-exploit details, and remediation guidance, structured to meet SOC 2 and ISO 27001 requirements.",
    },
    {
        question: "How fast can I get results?",
        answer: "Usually within minutes. Connect your target, define scope, and the system starts testing immediately - no coordination, no back-and-forth. Almost 100% of AI pentests find actual vulnerabilities.",
    },
    {
        question: "How is it different from a traditional pentest?",
        answer: "Traditional pentests take weeks to schedule and deliver. AI Pentesting runs instantly, scales to your full environment, and gives reproducible, detailed results in minutes.",
    },
    {
        question: "What is AI Pentesting?",
        answer: "AI Pentesting simulates real-world attacks on your app or API using AI models trained on thousands of real exploits. It finds and validates vulnerabilities automatically - no waiting for a human pentester to start.",
    },
];

export function FAQAccordion({ items, title = "Frequently Asked Questions" }: { items: FAQItem[], title?: string }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-20 bg-[#070707] border-y border-[#161616]">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight mb-4">{title}</h2>
                    <p className="text-[#888888]">Everything you need to know about Zentinel and how it works.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    {items.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div 
                                key={index} 
                                className="bg-[#0c0c0c] border border-[#161616] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#2a2a2a]"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <span className="font-semibold text-white/90 text-base">{item.question}</span>
                                    <ChevronDown 
                                        className={`h-5 w-5 text-[#888888] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-white" : ""}`} 
                                    />
                                </button>
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 pb-5" : "max-h-0 opacity-0"}`}
                                >
                                    <p className="text-[#888888] text-[15px] leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
