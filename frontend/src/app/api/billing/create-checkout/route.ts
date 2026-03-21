import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { DodoPayments } from "dodopayments";

export async function POST(req: NextRequest) {
    try {
        const { productId, type } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // 1. Auth check from Header
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
            console.error("Auth check failed.", "Auth error:", authError, "User:", user);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get user's org
        const { data: member, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (orgError || !member) {
            console.error("Organization lookup failed for user", user.id, "Error:", orgError);
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const orgId = member.organization_id;

        // 3. Make request to Dodo Payments using their official Node SDK
        const apiKey = process.env.DODO_PAYMENTS_API_KEY;
        if (!apiKey) {
            console.error("Missing DODO_PAYMENTS_API_KEY environment variable");
            return NextResponse.json({ error: "Server configuration error: Missing Payment Key" }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
        const returnUrl = `${baseUrl}/dashboard/settings/billing?checkout_success=true`;

        console.log("Creating checkout for Product ID:", productId);

        const dodo = new DodoPayments({ bearerToken: apiKey });

        const session = await dodo.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            metadata: {
                organizationId: orgId,
                userId: user.id
            },
            customer: {
                email: user.email ?? '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
            },
            return_url: returnUrl
        });

        // The SDK returns session object directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ url: (session as any).checkout_url || (session as any).url });

    } catch (e: any) {
        console.error("Error creating checkout session via SDK:", e.message || e);
        return NextResponse.json({ error: e.message || "Failed to create checkout via Dodo API" }, { status: 500 });
    }
}
