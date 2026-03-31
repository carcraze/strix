import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Hours saved per severity (average fix time in hours) ─────────────────────
const HOURS_BY_SEV: Record<string, number> = {
    critical: 6, high: 3, medium: 1.5, low: 0.5,
};

// ── Rule-based false positive detection ──────────────────────────────────────
// Runs instantly — no LLM call needed for obvious patterns.
// Mirrors what Aikido calls "AI assessed finding as false positive."
function detectFalsePositive(issue: any): string | null {
    const title = (issue.title || '').toLowerCase();
    const desc  = (issue.description || '').toLowerCase();
    const poc   = (issue.poc_request || '').toLowerCase();
    const combined = title + ' ' + desc + ' ' + poc;

    // DoS that only affects end-user browser performance
    if (/attacker can trigger dos.{0,40}(browser|client.side|user.side|front.?end)/i.test(combined))
        return 'Exploit affects only end-user browser speed — no server-side impact.';

    // Open redirect with internal/safe destination
    if (/open redirect/i.test(title) && /allowlist|allowlisted|trusted domain/i.test(combined))
        return 'Open redirect destination is controlled by an allowlist.';

    // Prototype pollution in test-only code
    if (/prototype pollution/i.test(title) && /(test|spec|__tests__|jest|mocha)/i.test(poc))
        return 'Vulnerability only reachable in test code — not in production.';

    // Expired/rotated secrets already known to be inactive
    if (/expired token|revoked key|rotated secret/i.test(combined))
        return 'Secret is expired or already rotated — no active risk.';

    // Self-XSS (requires attacker to control their own browser)
    if (/self.?xss|dom.based xss/i.test(title) && /attacker.{0,20}(their own|controls their)/i.test(combined))
        return 'Self-XSS — requires attacker to inject into their own browser session.';

    // CVE with CVSS < 4 that only affects dev dependencies
    if (/dev.?depend|devdependenc/i.test(combined) && issue.severity === 'low')
        return 'Vulnerability in dev-only dependency — not shipped to production.';

    // ReDoS with negligible input size in practice
    if (/redos|regex.*dos|regular expression.*denial/i.test(title) && /negligible|impractical|extremely large/i.test(combined))
        return 'ReDoS attack requires impractically large input — negligible real-world risk.';

    return null; // Not a false positive
}

// ── Extract code subissues from description / poc ────────────────────────────
export function extractSubissues(issue: any): { file: string; line?: string; snippet?: string }[] {
    const sources = [issue.poc_request, issue.description, issue.poc_response, issue.fix_description]
        .filter(Boolean).join('\n');

    const results: { file: string; line?: string; snippet?: string }[] = [];
    const seen = new Set<string>();

    // Match: path/to/file.ext:123 or path/to/file.ext line 123
    const fileLineRe = /([a-zA-Z0-9_\-./]+\.(ts|js|py|go|rb|java|rs|tsx|jsx|vue|php|cs))[:\s]+(?:line\s+)?(\d+)/gi;
    let m;
    while ((m = fileLineRe.exec(sources)) !== null) {
        const file = m[1];
        const line = m[3];
        const key  = `${file}:${line}`;
        if (!seen.has(key)) {
            seen.add(key);
            results.push({ file, line });
        }
        if (results.length >= 8) break;
    }

    // If no file:line found, try bare file paths
    if (results.length === 0) {
        const fileRe = /\b([a-zA-Z0-9_\-./]+\.(ts|js|py|go|rb|java|rs|tsx|jsx|vue|php|cs))\b/gi;
        while ((m = fileRe.exec(sources)) !== null) {
            const file = m[1];
            if (!seen.has(file) && !file.startsWith('http')) {
                seen.add(file);
                results.push({ file });
            }
            if (results.length >= 5) break;
        }
    }

    return results;
}

export async function POST(req: NextRequest) {
    const { data: { user } } = await adminClient.auth.getUser(
        req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { issue_id } = await req.json();
    if (!issue_id) return NextResponse.json({ error: 'issue_id required' }, { status: 400 });

    const { data: issue } = await adminClient
        .from('issues')
        .select('*')
        .eq('id', issue_id)
        .single();

    if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reason     = detectFalsePositive(issue);
    const subissues  = extractSubissues(issue);
    const hoursSaved = reason ? (HOURS_BY_SEV[issue.severity] ?? 1) : 0;

    if (reason) {
        // Auto-ignore it
        await adminClient.from('issues').update({
            status:             'ignored',
            is_false_positive:  true,
            auto_ignore_reason: reason,
            hours_saved:        hoursSaved,
        }).eq('id', issue_id);
    }

    return NextResponse.json({
        is_false_positive:  !!reason,
        auto_ignore_reason: reason,
        subissues,
        hours_saved:        hoursSaved,
    });
}
