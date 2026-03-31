import { NextRequest, NextResponse } from 'next/server';
import { notifyScanComplete } from '@/lib/email/notifications';

// Called by Celery tasks.py after a pentest completes
// Protected by shared NOTIFY_SECRET env var
export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-notify-secret');
    if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pentest_id } = await req.json();
    if (!pentest_id) return NextResponse.json({ error: 'pentest_id required' }, { status: 400 });

    await notifyScanComplete(pentest_id);
    return NextResponse.json({ ok: true });
}
