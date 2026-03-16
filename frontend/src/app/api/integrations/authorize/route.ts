import { NextResponse } from 'next/server';

const APP_BASE = 'https://app.zentinel.dev';

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
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            redirect_uri: redirectUri,
            scope: 'repo read:org',
            state,
            allow_signup: 'true',
        });
        authUrl = `https://github.com/login/oauth/authorize?${params}`;
    } else if (provider === 'gitlab') {
        const params = new URLSearchParams({
            client_id: process.env.GITLAB_CLIENT_ID!,
            redirect_uri: redirectUri,
            response_type: 'code',
            state,
            // api: full access (MR comments, code suggestions, private repos)
            // write_repository: push access needed for AI-suggested fixes
            scope: 'api read_repository write_repository',
        });
        authUrl = `https://gitlab.com/oauth/authorize?${params}`;
    } else if (provider === 'bitbucket') {
        const params = new URLSearchParams({
            client_id: process.env.BITBUCKET_CLIENT_ID!,
            redirect_uri: redirectUri,
            response_type: 'code',
            // repository:write allows cloning private + pushing fixes
            // pullrequest allows reading PRs. (Removed pullrequest:write to fix invalid_scope error)
            scope: 'repository repository:write pullrequest',
            state,
        });
        authUrl = `https://bitbucket.org/site/oauth2/authorize?${params}`;
    } else {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);
}
