import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { DodoPayments } from "dodopayments";

export async function POST(req: NextRequest) {
    try {
        const { priceId, organizationId } = await req.json();

        if (!priceId || !organizationId) {
            return NextResponse.json({ error: "Product ID and Organization ID are required" }, { status: 400 });
        }

        // Auth check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.DODO_PAYMENTS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing config" }, { status: 500 });
        }

        const rURL = new URL(req.url);
        const returnUrl = `${rURL.protocol}//${rURL.host}/dashboard?subscribed=true`;

        const dodo = new DodoPayments({ bearerToken: apiKey });

        // Use checkout sessions for subscriptions (works the same for subscription products)
        const session = await dodo.checkoutSessions.create({
            product_cart: [{ product_id: priceId, quantity: 1 }],
            metadata: {
                organizationId,
                userId: user.id,
                type: 'subscription'
            },
            customer: {
                email: user.email ?? '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
            },
            return_url: returnUrl
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ checkout_url: (session as any).checkout_url || (session as any).url });

    } catch (e: unknown) {
        const error = e as { message?: string };
        console.error("Error creating subscription checkout session:", error.message || e);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
