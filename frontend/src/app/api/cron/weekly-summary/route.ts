import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Using supabase public for now, but in real setup use supabaseAdmin for server-side auth bypass if needed

// Set up via AWS EventBridge or Google Cloud Scheduler (HTTP Target):
// Schedule: "0 9 * * 1" (Every Monday 9am UTC)
// Target URL: https://[your-domain]/api/cron/weekly-summary
// Headers: Authorization: Bearer [CRON_SECRET]

export async function GET(request: Request) {
    // 1. Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 2. Get all users with weekly summary enabled
        const { data: prefs, error: prefsError } = await supabase
            .from('notification_preferences')
            .select('user_id, organization_id')
            .eq('email_weekly_summary', true);

        if (prefsError) throw prefsError;

        const results = [];

        for (const pref of prefs || []) {
            // 3. Get week's stats for their org
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: issues, error: issuesError } = await supabase
                .from('issues')
                .select('severity, status')
                .eq('organization_id', pref.organization_id)
                .gte('created_at', weekAgo); // Assuming created_at for issues

            if (issuesError) {
                console.error(`Error fetching issues for org ${pref.organization_id}:`, issuesError);
                continue;
            }

            // 4. Send weekly summary email (calling our sender)
            // Note: In a real production setup, we'd need to fetch the user's email too
            // For this implementation, we'll log the intention
            console.log(`Weekly summary generated for org ${pref.organization_id}. ${issues?.length || 0} issues found.`);
            results.push({ orgId: pref.organization_id, issuesCount: issues?.length || 0 });
        }

        return NextResponse.json({ success: true, processed: results.length });
    } catch (err: any) {
        console.error('Weekly summary cron failed:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
