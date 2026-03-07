import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const stateParam = req.nextUrl.searchParams.get('state');
    const origin = req.nextUrl.origin;

    console.log('[Bitbucket CB] code:', !!code, 'state:', stateParam);

    if (!code) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=no_code`);
    }

    // Decode org_id from OAuth state
    let orgId: string | null = null;
    if (stateParam) {
        try {
            const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
            orgId = decoded.orgId || null;
        } catch {
            console.error('[Bitbucket CB] Failed to decode state param');
        }
    }

    console.log('[Bitbucket CB] orgId from state:', orgId);

    if (!orgId) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=no_org`);
    }

    try {
        const callback = `${origin}/api/oauth/bitbucket/callback`;

        // Bitbucket uses Basic auth (client_id:client_secret) for token exchange
        const credentials = Buffer.from(
            `${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`
        ).toString('base64');

        const tokenRes = await fetch('https://bitbucket.org/site/oauth2/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: callback,
            }),
        });
        const tokenData = await tokenRes.json();
        console.log('[Bitbucket CB] token result:', tokenData.error || 'ok');

        if (!tokenData.access_token) {
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=token_exchange`);
        }

        // Fetch Bitbucket user info
        const bbRes = await fetch('https://api.bitbucket.org/2.0/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const bbUser = await bbRes.json();
        console.log('[Bitbucket CB] Bitbucket user:', bbUser.username);

        // Save to Supabase
        const { error: upsertError } = await supabaseAdmin.from('integrations').upsert({
            organization_id: orgId,
            provider: 'bitbucket',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            provider_user_id: String(bbUser.account_id),
            provider_username: bbUser.username,
            metadata: {
                display_name: bbUser.display_name,
                avatar_url: bbUser.links?.avatar?.href,
            },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,provider' });

        if (upsertError) {
            console.error('[Bitbucket CB] upsert error:', upsertError);
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=db_error`);
        }

        console.log('[Bitbucket CB] ✅ Connected Bitbucket for org:', orgId);
        return NextResponse.redirect(`${origin}/dashboard/integrations?connected=bitbucket`);

    } catch (err) {
        console.error('[Bitbucket CB] Unexpected error:', err);
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=server`);
    }
}
