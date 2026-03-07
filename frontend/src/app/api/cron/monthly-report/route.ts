import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Set up via AWS EventBridge or Google Cloud Scheduler (HTTP Target):
// Schedule: "0 9 1 * *" (1st of every month 9am UTC)
// Target URL: https://[your-domain]/api/cron/monthly-report
// Headers: Authorization: Bearer [CRON_SECRET]

export async function GET(request: Request) {
    // 1. Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 2. Get all users with monthly report enabled
        const { data: prefs, error: prefsError } = await supabase
            .from('notification_preferences')
            .select('user_id, organization_id')
            .eq('email_monthly_report', true);

        if (prefsError) throw prefsError;

        const results = [];

        for (const pref of prefs || []) {
            // 3. Get month's stats for their org
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const { data: issues, error: issuesError } = await supabase
                .from('issues')
                .select('severity, status')
                .eq('organization_id', pref.organization_id)
                .gte('created_at', monthAgo);

            if (issuesError) {
                console.error(`Error fetching issues for org ${pref.organization_id}:`, issuesError);
                continue;
            }

            // 4. Send monthly report email (calling our sender)
            // Note: In a real production setup, we'd need to fetch the user's email too
            // For this implementation, we'll log the intention
            console.log(`Monthly report generated for org ${pref.organization_id}. ${issues?.length || 0} issues found.`);
            results.push({ orgId: pref.organization_id, issuesCount: issues?.length || 0 });
        }

        return NextResponse.json({ success: true, processed: results.length });
    } catch (err: any) {
        console.error('Monthly report cron failed:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
