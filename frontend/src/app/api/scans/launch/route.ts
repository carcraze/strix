import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allowlist of valid one-time scan types
const ONE_TIME_SCAN_TYPES = ['quick', 'web_api', 'full_stack', 'compliance'];
const SUBSCRIPTION_SCAN_TYPE = 'deep';

export async function POST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Authenticate user from bearer token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { organization_id, scan_type, ...rest } = body;

    if (!organization_id) {
        return NextResponse.json({ error: 'Missing organization_id' }, { status: 400 });
    }

    // Fetch org to verify subscription + plan
    const { data: org } = await adminClient
        .from('organizations')
        .select('plan, subscription_active, scan_credits')
        .eq('id', organization_id)
        .single();

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const isSubscriber = org.subscription_active || false;
    let resolvedScanType = scan_type;

    if (isSubscriber) {
        // Subscribers ALWAYS get deep scan — cannot choose another type
        resolvedScanType = SUBSCRIPTION_SCAN_TYPE;
    } else {
        // One-time buyers: must have a valid single-use scan type
        if (!ONE_TIME_SCAN_TYPES.includes(scan_type)) {
            return NextResponse.json({ error: 'Invalid scan type' }, { status: 400 });
        }

        // Validate and consume the credit atomically via RPC
        const { data: creditResult, error: creditError } = await adminClient.rpc('consume_scan_credit', {
            org_id: organization_id,
            credit_type: scan_type,
        });

        if (creditError) {
            console.error('consume_scan_credit error:', creditError);
            return NextResponse.json({ error: 'Failed to validate scan credit' }, { status: 500 });
        }

        if (creditResult !== 'ok') {
            if (creditResult === 'no_credit') {
                return NextResponse.json({
                    error: 'You do not have a credit for this scan type. Please purchase a scan to continue.',
                    code: 'NO_CREDIT',
                }, { status: 403 });
            }

            return NextResponse.json({ error: 'Scan authorization failed', code: creditResult }, { status: 403 });
        }
    }

    // Forward to the actual scan backend (Python/Cloud Run) with the resolved & validated scan type
    const scannerUrl = process.env.SCANNER_BACKEND_URL;

    if (!scannerUrl) {
        // No scanner URL configured — return a mock success for dev/testing
        console.warn('[scans/launch] SCANNER_BACKEND_URL not set. Returning mock pentest ID.');
        const { data: pentest } = await adminClient.from('pentests').insert({
            organization_id,
            name: rest.name || 'Unnamed Scan',
            scan_type: resolvedScanType,
            status: 'queued',
            domains: rest.domains || [],
            repositories: rest.repos || [],
            app_description: rest.app_description || '',
            tech_stack: rest.tech_stack || '',
            testing_focus: rest.testing_focus || '',
            credentials: rest.credentials || [],
            custom_headers: rest.custom_headers || [],
        }).select('id').single();

        return NextResponse.json({ pentest_id: pentest?.id || 'mock-id', status: 'queued' });
    }

    // Real backend forward
    const response = await fetch(`${scannerUrl}/api/scans/launch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Service-Token': supabaseServiceKey,
        },
        body: JSON.stringify({
            organization_id,
            scan_type: resolvedScanType, // Always the server-validated type
            ...rest,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
}
