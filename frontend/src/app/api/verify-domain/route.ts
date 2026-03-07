import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promises as dns } from 'dns';

// Admin client to be able to update verified status
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { domainId } = await req.json();

        if (!domainId) {
            return NextResponse.json({ success: false, error: 'Missing domainId' }, { status: 400 });
        }

        // 1. Fetch domain from DB
        const { data: domain, error: fetchErr } = await supabaseAdmin
            .from('domains')
            .select('id, domain, verification_token, verified')
            .eq('id', domainId)
            .single();

        if (fetchErr || !domain) {
            return NextResponse.json({ success: false, error: 'Domain not found' }, { status: 404 });
        }

        if (domain.verified) {
            return NextResponse.json({ success: true, message: 'Already verified', method: 'none' });
        }

        const { domain: domainName, verification_token } = domain;

        if (!verification_token) {
            return NextResponse.json({ success: false, error: 'No verification token found' }, { status: 400 });
        }

        // 2. Try DNS TXT record check
        let verified = false;
        let method = '';

        try {
            const txtRecord = `_zentinel-verification.${domainName}`;
            const records = await dns.resolveTxt(txtRecord);
            // records is string[][], flatten it
            const flat = records.map(r => r.join('')).join('');
            if (flat.includes(verification_token)) {
                verified = true;
                method = 'dns';
            }
        } catch {
            // DNS lookup failed or record not found – try next
        }

        // 3. Try file upload check
        if (!verified) {
            try {
                const fileUrl = `https://${domainName}/.well-known/zentinel-verify.txt`;
                const res = await fetch(fileUrl, { signal: AbortSignal.timeout(5000) });
                if (res.ok) {
                    const text = await res.text();
                    if (text.trim().includes(verification_token)) {
                        verified = true;
                        method = 'file';
                    }
                }
            } catch {
                // File check failed – try next
            }
        }

        // 4. Try meta tag check
        if (!verified) {
            try {
                const res = await fetch(`https://${domainName}`, { signal: AbortSignal.timeout(8000) });
                if (res.ok) {
                    const html = await res.text();
                    if (html.includes(`name="zentinel-verification"`) && html.includes(verification_token)) {
                        verified = true;
                        method = 'meta';
                    }
                }
            } catch {
                // Meta check failed
            }
        }

        if (!verified) {
            return NextResponse.json({
                success: false,
                error: `Verification token not found. Ensure the DNS TXT record "_zentinel-verification.${domainName}" contains "${verification_token}", or your file/meta tag is correctly deployed.`
            });
        }

        // 5. Mark as verified in DB
        const { error: updateErr } = await supabaseAdmin
            .from('domains')
            .update({ verified: true, verification_method: method, verified_at: new Date().toISOString() })
            .eq('id', domainId);

        if (updateErr) {
            return NextResponse.json({ success: false, error: 'Verified but failed to update database: ' + updateErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, method, message: `Domain verified via ${method}!` });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
    }
}
