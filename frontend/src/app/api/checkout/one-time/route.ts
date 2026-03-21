import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { DodoPayments } from "dodopayments";

export async function POST(req: NextRequest) {
    try {
        const { priceId, organizationId, userId } = await req.json();

        if (!priceId || !organizationId) {
            return NextResponse.json({ error: "Product ID and Organization ID are required" }, { status: 400 });
        }

        const apiKey = process.env.DODO_PAYMENTS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing config" }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
        const returnUrl = `${baseUrl}/dashboard/settings/billing?credit=granted`;

        const dodo = new DodoPayments({ bearerToken: apiKey });

        const session = await dodo.checkoutSessions.create({
            product_cart: [{ product_id: priceId, quantity: 1 }],
            metadata: {
                organizationId,
                userId
            },
            return_url: returnUrl
        });

        // @ts-ignore
        return NextResponse.json({ checkout_url: session.checkout_url || session.url });

    } catch (e: any) {
        console.error("Error creating one-time checkout session:", e.message || e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
