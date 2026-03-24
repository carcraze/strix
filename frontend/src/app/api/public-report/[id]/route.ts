import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Fetch the scan record using service role (bypasses RLS)
    const { data: review, error } = await supabaseAdmin
        .from('pr_reviews')
        .select('id, status, pr_title, pr_url, pr_number, provider, trigger_source, completed_at, created_at, issues_found, critical_count, high_count, medium_count, strix_duration_seconds, final_report, raw_logs, repository_id, commit_sha, author_username')
        .eq('id', id)
        .single();

    if (error || !review) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch repo name
    let repoName = '';
    if (review.repository_id) {
        const { data: repo } = await supabaseAdmin
            .from('repositories')
            .select('full_name, name')
            .eq('id', review.repository_id)
            .single();
        repoName = repo?.full_name || repo?.name || '';
    }

    return NextResponse.json({ ...review, _repoName: repoName });
}
