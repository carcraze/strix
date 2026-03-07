import { Card } from "./zentinel-card";

export function AttackGraph() {
    return (
        <Card className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background" glow="cyan">
            <div className="absolute inset-0 pattern-dots pattern-blue-500 pattern-bg-transparent pattern-size-4 pattern-opacity-10" />

            {/* Placeholder SVG for the Attack Graph */}
            <svg className="w-full h-full absolute inset-0 z-10 opacity-70" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                {/* Edges */}
                <path d="M 100 200 C 250 200, 250 100, 400 100" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                <path d="M 100 200 C 250 200, 250 300, 400 300" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                <path d="M 400 100 C 550 100, 550 200, 700 200" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                <path d="M 400 300 C 550 300, 550 200, 700 200" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />

                {/* Nodes */}
                {/* Entry Point */}
                <circle cx="100" cy="200" r="8" fill="var(--color-cyan)" className="animate-ping" />
                <circle cx="100" cy="200" r="6" fill="var(--color-cyan)" />
                <text x="100" y="225" fill="var(--color-textSecondary)" fontSize="12" textAnchor="middle" className="font-mono">Public API</text>

                {/* Vulnerabilities */}
                <rect x="380" y="80" width="40" height="40" rx="8" fill="var(--background)" stroke="var(--color-amber)" strokeWidth="2" />
                <text x="400" y="105" fill="var(--color-amber)" fontSize="14" textAnchor="middle" className="font-bold">IDOR</text>

                <rect x="380" y="280" width="40" height="40" rx="8" fill="var(--background)" stroke="var(--color-red)" strokeWidth="2" />
                <text x="400" y="305" fill="var(--color-red)" fontSize="14" textAnchor="middle" className="font-bold">SQLi</text>

                {/* Impact */}
                <circle cx="700" cy="200" r="16" fill="var(--background)" stroke="var(--color-red)" strokeWidth="3" />
                <text x="700" y="205" fill="var(--color-red)" fontSize="18" textAnchor="middle" className="font-bold">!</text>
                <text x="700" y="235" fill="var(--color-textPrimary)" fontSize="12" textAnchor="middle" className="font-bold">Data Breach</text>
            </svg>
        </Card>
    );
}
