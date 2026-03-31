import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWeeklySummary } from '@/lib/email/notifications';

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Schedule: "0 9 * * 1" — Every Monday 9am UTC
// Auth header: Authorization: Bearer [CRON_SECRET]
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { data: prefs } = await adminClient
        .from('notification_preferences')
        .select('user_id, organization_id')
        .eq('email_weekly_summary', true);

    let sent = 0;
    for (const pref of prefs || []) {
        await sendWeeklySummary(pref.organization_id, pref.user_id);
        sent++;
    }

    return NextResponse.json({ ok: true, sent });
}
