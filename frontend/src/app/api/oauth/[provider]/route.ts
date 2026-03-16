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

        const { error } = await supabaseAdmin
            .from('integrations')
            .delete()
            .eq('organization_id', orgId)
            .eq('provider', provider);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Failed to disconnect integration:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
