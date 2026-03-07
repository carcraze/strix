import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider'); // github, gitlab, bitbucket
    const orgId = searchParams.get('state'); // pass org ID through state to link it back

    if (!provider || !orgId) {
        return NextResponse.json({ error: 'Missing provider or org ID' }, { status: 400 });
    }

    let authUrl = '';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback/${provider}`;

    if (provider === 'github') {
        authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:org&state=${orgId}`;
    } else if (provider === 'gitlab') {
        authUrl = `https://gitlab.com/oauth/authorize?client_id=${process.env.GITLAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${orgId}&scope=api`;
    } else if (provider === 'bitbucket') {
        authUrl = `https://bitbucket.org/site/oauth2/authorize?client_id=${process.env.BITBUCKET_CLIENT_ID}&response_type=code&state=${orgId}`;
    } else {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);
}
