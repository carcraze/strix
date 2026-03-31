import { NextRequest, NextResponse } from 'next/server';
import { notifyPrReviewComplete } from '@/lib/email/notifications';

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-notify-secret');
    if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pr_review_id } = await req.json();
    if (!pr_review_id) return NextResponse.json({ error: 'pr_review_id required' }, { status: 400 });

    await notifyPrReviewComplete(pr_review_id);
    return NextResponse.json({ ok: true });
}
