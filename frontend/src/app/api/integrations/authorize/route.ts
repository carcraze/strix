import { NextResponse } from 'next/server';

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider'); // github, gitlab, bitbucket
    const orgId = searchParams.get('state'); // org ID passed as state

    if (!provider || !orgId) {
        return NextResponse.json({ error: 'Missing provider or org ID' }, { status: 400 });
    }

    // Encode state as base64 JSON so callbacks can decode gracefully
    const state = Buffer.from(JSON.stringify({ orgId })).toString('base64');
    const redirectUri = `${APP_BASE}/api/integrations/callback/${provider}`;
    let authUrl = '';

    if (provider === 'github') {
        const clientId = process.env.GITHUB_CLIENT_ID || process.env.GH_OAUTH_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
        }
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'repo read:org',
            state,
            allow_signup: 'true',
        });
        authUrl = `https://github.com/login/oauth/authorize?${params}`;
    } else if (provider === 'gitlab') {
        const clientId = process.env.GITLAB_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: 'GitLab OAuth not configured' }, { status: 500 });
        }
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state,
            scope: 'api read_repository write_repository',
        });
        authUrl = `https://gitlab.com/oauth/authorize?${params}`;
    } else if (provider === 'bitbucket') {
        const clientId = process.env.BITBUCKET_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: 'Bitbucket OAuth not configured' }, { status: 500 });
        }
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'repository repository:write pullrequest',
            state,
        });
        authUrl = `https://bitbucket.org/site/oauth2/authorize?${params}`;
    } else {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);
}
