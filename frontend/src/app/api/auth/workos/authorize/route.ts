import { NextResponse } from 'next/server';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID || '';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const connection = searchParams.get('connection');
    const email = searchParams.get('email') || undefined;

    if (!connection) {
        return NextResponse.json({ error: 'Missing connection ID' }, { status: 400 });
    }

    if (!process.env.WORKOS_API_KEY) {
        return NextResponse.json({ error: 'WorkOS API key not configured' }, { status: 500 });
    }

    const authorizationUrl = workos.sso.getAuthorizationUrl({
        connection,
        clientId,
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/workos/callback`,
        loginHint: email,
    });

    return NextResponse.redirect(authorizationUrl);
}

export async function POST(request: Request) {
    return GET(request);
}
