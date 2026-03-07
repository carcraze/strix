import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import { Webhook } from 'standardwebhooks';

const PRICE_TO_CREDIT: Record<string, string> = {
    'pdt_0NZvMfJ8eFm1HyRw8utQ8': 'quick',
    'pdt_0NZvPO3EAz3DKXHlxwKW2': 'web_api',
    'pdt_0NZvQoAV3whvNYvM76J54': 'full_stack',
    'pdt_0NZvSLeuF1S1tLDpN3fmR': 'compliance',
}

const PRICE_TO_PLAN: Record<string, string> = {
    'pdt_0NZvY0MJ4wF2OeEnsaTXn': 'starter',
    'pdt_0NZvaroBDRirwX7Ks2jy6': 'starter',
    'pdt_0NZvZEvwRzDKT8i8vfL8d': 'growth',
    'pdt_0NZvbbO7zfj2650NadGlU': 'growth',
    'pdt_0NZvaEWDFMzGj0C0GD1AG': 'scale',
    'pdt_0NZvcFFUadlxcJ86oeqbm': 'scale',
}

export async function POST(request: NextRequest) {
    const bodyText = await request.text()
    const secret = process.env.DODO_WEBHOOK_SECRET

    let event: any;

    if (secret) {
        try {
            const wh = new Webhook(secret);
            const headers = {
                "webhook-id": request.headers.get("webhook-id") || "",
                "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
                "webhook-signature": request.headers.get("webhook-signature") || "",
            };
            event = wh.verify(bodyText, headers);
        } catch (err: any) {
            console.error("Dodo webhook verification failed", err.message);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
    } else {
        event = JSON.parse(bodyText);
    }

    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );

    // One-time scan purchased → grant credit
    if (event.type === 'payment.succeeded') {
        const { metadata, line_items, amount, total_amount } = event.data
        const organizationId = metadata?.organizationId || event.data.customer?.metadata?.organizationId

        for (const item of line_items || []) {
            const creditType = PRICE_TO_CREDIT[item.product_id];
            if (creditType && organizationId) {
                // Grant credit via RPC
                await supabaseAdmin.rpc('increment_scan_credit', {
                    org_id: organizationId,
                    credit_type: creditType,
                    amount: item.quantity ?? 1,
                })

                await supabaseAdmin.from('invoices').insert({
                    organization_id: organizationId,
                    amount: amount || total_amount || 0,
                    plan_name: `Scan Credit (${creditType})`,
                    status: 'paid',
                    date: new Date().toISOString()
                });
            }
        }
    }

    // Subscription activated or renewed
    if (['subscription.activated', 'subscription.renewed', 'subscription.updated'].includes(event.type)) {
        const { metadata, product_id, status } = event.data
        const organizationId = metadata?.organizationId || event.data.customer?.metadata?.organizationId

        if (organizationId && (status === 'active' || status === 'paid' || status === 'succeeded')) {
            const plan = PRICE_TO_PLAN[product_id]
            if (plan) {
                await supabaseAdmin.from('organizations')
                    .update({ plan, subscription_cancelled_at: null })
                    .eq('id', organizationId)

                await supabaseAdmin.from('invoices').insert({
                    organization_id: organizationId,
                    amount: event.data.amount || event.data.total_amount || 0,
                    plan_name: plan,
                    status: 'paid',
                    date: new Date().toISOString()
                });
            }
        }
    }

    // Subscription cancelled — drop to free (NOT starter)
    if (event.type === 'subscription.cancelled') {
        const organizationId = event.data?.metadata?.organizationId || event.data?.customer?.metadata?.organizationId;
        if (organizationId) {
            await supabaseAdmin.from('organizations')
                .update({
                    plan: 'free',   // ← NOT 'starter' — free = no scan access
                    subscription_cancelled_at: new Date().toISOString(),
                })
                .eq('id', organizationId)
        }
    }

    return NextResponse.json({ received: true })
}
