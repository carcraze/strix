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

    console.log('[GitLab CB] code:', !!code, 'state:', stateParam);

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
            console.error('[GitLab CB] Failed to decode state param');
        }
    }

    console.log('[GitLab CB] orgId from state:', orgId);

    if (!orgId) {
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=no_org`);
    }

    try {
        const callback = `${origin}/api/oauth/gitlab/callback`;

        const tokenRes = await fetch('https://gitlab.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITLAB_CLIENT_ID,
                client_secret: process.env.GITLAB_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: callback,
            }),
        });
        const tokenData = await tokenRes.json();
        console.log('[GitLab CB] token result:', tokenData.error || 'ok');

        if (!tokenData.access_token) {
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=token_exchange`);
        }

        // Fetch GitLab user info
        const glRes = await fetch('https://gitlab.com/api/v4/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const glUser = await glRes.json();
        console.log('[GitLab CB] GitLab user:', glUser.username);

        // Save to Supabase
        const { error: upsertError } = await supabaseAdmin.from('integrations').upsert({
            organization_id: orgId,
            provider: 'gitlab',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            provider_user_id: String(glUser.id),
            provider_username: glUser.username,
            metadata: { avatar_url: glUser.avatar_url, web_url: glUser.web_url },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,provider' });

        if (upsertError) {
            console.error('[GitLab CB] upsert error:', upsertError);
            return NextResponse.redirect(`${origin}/dashboard/integrations?error=db_error`);
        }

        console.log('[GitLab CB] ✅ Connected GitLab for org:', orgId);
        return NextResponse.redirect(`${origin}/dashboard/integrations?connected=gitlab`);

    } catch (err) {
        console.error('[GitLab CB] Unexpected error:', err);
        return NextResponse.redirect(`${origin}/dashboard/integrations?error=server`);
    }
}
