import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BACKEND_URL = process.env.SCANNER_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7);

        // Verify the user's JWT
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await request.json();
        const { organization_id, repository_id, repo_full_name } = body;

        if (!organization_id || !repo_full_name) {
            return NextResponse.json({ error: "organization_id and repo_full_name required" }, { status: 400 });
        }

        // Verify user belongs to org
        const { data: membership } = await supabaseAdmin
            .from("organization_members")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Forward to Python backend
        const backendResp = await fetch(`${BACKEND_URL}/api/code-scan/day-zero`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ organization_id, repository_id, repo_full_name }),
        });

        if (!backendResp.ok) {
            // Forward 429 rate-limit responses directly to the client
            if (backendResp.status === 429) {
                const body = await backendResp.json().catch(() => ({}));
                return NextResponse.json(body, { status: 429 });
            }
            // Backend unreachable / 5xx — don't block the user, scan queued for retry
            const err = await backendResp.text();
            console.error("[code-scan/day-zero] Backend error:", err);
            return NextResponse.json(
                { scan_run_id: null, status: "backend_unavailable",
                  message: "Scanner backend not reachable. Your scan will start automatically once it recovers." },
                { status: 503 }
            );
        }

        const data = await backendResp.json();
        return NextResponse.json(data);

    } catch (err: any) {
        console.error("[code-scan/day-zero] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
