import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
    // Left for backwards compatibility; real connection is handled by /api/integrations/authorize
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
    try {
        const params = await context.params;
        const { provider } = params;
        const body = await req.json();
        const { orgId } = body;

        if (!orgId || !provider) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('access_token, webhook_id')
            .eq('organization_id', orgId)
            .eq('provider', provider)
            .single();

        if (integration && integration.webhook_id && integration.access_token) {
            try {
                const webhookIds = JSON.parse(integration.webhook_id);
                for (const [repoId, webhookId] of Object.entries(webhookIds)) {
                     if (provider === 'github') {
                         await fetch(`https://api.github.com/repos/${repoId}/hooks/${webhookId}`, {
                             method: 'DELETE',
                             headers: {
                                 'Authorization': `Bearer ${integration.access_token}`,
                                 'Accept': 'application/vnd.github+json'
                             }
                         });
                     } else if (provider === 'gitlab') {
                         await fetch(`https://gitlab.com/api/v4/projects/${repoId}/hooks/${webhookId}`, {
                             method: 'DELETE',
                             headers: {
                                 'Authorization': `Bearer ${integration.access_token}`
                             }
                         });
                     } else if (provider === 'bitbucket') {
                         await fetch(`https://api.bitbucket.org/2.0/repositories/${repoId}/hooks/${webhookId}`, {
                             method: 'DELETE',
                             headers: {
                                 'Authorization': `Bearer ${integration.access_token}`
                             }
                         });
                     }
                }
            } catch (err) {
                console.error('Failed to parse or delete webhooks', err);
            }
        }

        const { error: deleteIntegrationError } = await supabaseAdmin
            .from('integrations')
            .delete()
            .eq('organization_id', orgId)
            .eq('provider', provider);

        if (deleteIntegrationError) throw deleteIntegrationError;

        await supabaseAdmin
            .from('repositories')
            .delete()
            .eq('organization_id', orgId)
            .eq('provider', provider);

        return NextResponse.json({ success: true, message: `${provider} disconnected` });
    } catch (err: any) {
        console.error('Failed to disconnect integration:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
