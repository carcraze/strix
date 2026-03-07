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

    console.log('[GitHub CB] code:', !!code, 'state:', stateParam);

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
            console.error('[GitHub CB] Failed to decode state param');
        }
    }

    console.log('[GitHub CB] orgId from state:', orgId);

    if (!orgId) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=no_org`);
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });
        const tokenData = await tokenRes.json();
        console.log('[GitHub CB] token result:', tokenData.error || 'ok', 'scope:', tokenData.scope);

        if (tokenData.error || !tokenData.access_token) {
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=token_exchange`);
        }

        // Fetch GitHub user info
        const ghRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const ghUser = await ghRes.json();
        console.log('[GitHub CB] GitHub user:', ghUser.login);

        // Save to Supabase
        const { error: upsertError } = await supabaseAdmin.from('integrations').upsert({
            organization_id: orgId,
            provider: 'github',
            access_token: tokenData.access_token,
            provider_user_id: String(ghUser.id),
            provider_username: ghUser.login,
            scope: tokenData.scope,
            metadata: { avatar_url: ghUser.avatar_url, html_url: ghUser.html_url },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,provider' });

        if (upsertError) {
            console.error('[GitHub CB] upsert error:', upsertError);
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=db_error`);
        }

        console.log('[GitHub CB] ✅ Connected GitHub for org:', orgId);
        return NextResponse.redirect(`${origin}/dashboard/integrations?connected=github`);

    } catch (err) {
        console.error('[GitHub CB] Unexpected error:', err);
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=server`);
    }
}
