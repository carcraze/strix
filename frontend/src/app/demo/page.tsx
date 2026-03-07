import Link from "next/link";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center">
                <div className="inline-flex h-16 w-16 bg-white/5 border border-white/10 rounded-2xl items-center justify-center mb-8">
                    <FileText className="h-8 w-8 text-[#00E5FF]" />
                </div>

                <h1 className="text-4xl font-syne font-bold mb-4">Sample Pentest Report</h1>
                <p className="text-[#888] text-lg mb-10 max-w-xl mx-auto">
                    This is what a real report looks like. Our autonomous AI pentester finds real vulnerabilities, validates them with proof-of-concept exploits, and writes complete remediation steps.
                </p>

                <div className="bg-[#070707] border border-[#161616] rounded-2xl p-8 mb-10 text-left relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-b from-[#00E5FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold font-syne text-white mb-2">Zentinel_Report_AcmeCorp.pdf</h3>
                            <p className="text-sm text-[#666] font-mono">1.2 MB • Generated in ~42m</p>
                        </div>
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            2 Critical
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-[#aaa]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></div> Cover: OWASP Top 10 + API Logic
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#aaa]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></div> Proof-of-Concept included
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#aaa]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></div> Exact code fixes and references
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <Link href="/pricing">
                        <Button variant="ghost" className="text-[#888] hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to pricing
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
