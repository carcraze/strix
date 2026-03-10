import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Convert local day (0=Sunday...6=Saturday) and time ("HH:MM") to UTC cron string
function localToUtcCron(day: number, time: string, timeZone: string) {
    const [hours, minutes] = time.split(':').map(Number);

    // Get current offset for the targeted timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);

    const getValue = (type: string) => parts.find(p => p.type === type)?.value || '00';

    // Parse as if this string is UTC
    const tzDateStr = `${getValue('year')}-${getValue('month')}-${getValue('day')}T${getValue('hour')}:${getValue('minute')}:${getValue('second')}Z`;
    const tzDate = new Date(tzDateStr);

    // Local minus UTC -> negative for America (e.g. EST is -300)
    const offsetMinutes = Math.round((tzDate.getTime() - now.getTime()) / 60000);

    let utcMinutes = minutes;
    let utcHours = hours;
    let utcDay = day;

    // Apply offset (Subtract offset to get UTC from Local)
    // E.g. local 10:00 (600 mins) with -300 offset -> UTC 15:00 (900 mins)
    utcMinutes -= offsetMinutes;

    while (utcMinutes >= 60) { utcMinutes -= 60; utcHours += 1; }
    while (utcMinutes < 0) { utcMinutes += 60; utcHours -= 1; }

    while (utcHours >= 24) { utcHours -= 24; utcDay = (utcDay + 1) % 7; }
    while (utcHours < 0) { utcHours += 24; utcDay = (utcDay - 1 + 7) % 7; }

    return `${utcMinutes} ${utcHours} * * ${utcDay}`;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: repoId } = await context.params;
        if (!repoId) return NextResponse.json({ error: 'Missing repository ID' }, { status: 400 });

        const body = await request.json();
        const { enabled, day, time, timezone } = body;

        // Ensure we use the service role key to manage cron scheduling
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Update the database table with the user's config
        const { error: updateError } = await adminClient
            .from('repositories')
            .update({
                schedule_enabled: enabled,
                schedule_day: day,
                schedule_time: time,
                schedule_timezone: timezone
            })
            .eq('id', repoId);

        if (updateError) {
            console.error(updateError);
            return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
        }

        // 2. Schedule or Unschedule in pg_cron
        if (enabled) {
            const cronString = localToUtcCron(day, time, timezone);
            const webhookUrl = `https://app.zentinel.dev/api/repos/${repoId}/scan`;

            const { error: rpcError } = await adminClient.rpc('schedule_scan', {
                repo_id: repoId,
                cron_string: cronString,
                webhook_url: webhookUrl
            });

            if (rpcError) {
                console.error('Failed to schedule in pg_cron:', rpcError);
                return NextResponse.json({ error: 'Failed to register cron job' }, { status: 500 });
            }
        } else {
            const { error: rpcError } = await adminClient.rpc('unschedule_scan', {
                repo_id: repoId
            });

            if (rpcError) {
                // If it wasn't scheduled in the first place, it might error, we can ignore or log
                console.warn('Could not unschedule, maybe it text not exist:', rpcError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("Schedule error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
