import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { name, email, password, isAdmin } = await req.json();

        // 1. Authorize - Verify the requester is a CRM Super Admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Missing authorization" }, { status: 401 });

        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check if requester is actually an admin in crm_staff
        const { data: staffCheck } = await supabaseAdmin
            .from('crm_staff')
            .select('is_admin')
            .eq('user_id', requester.id)
            .single();

        if (!staffCheck?.is_admin) {
            return NextResponse.json({ error: "Only administrators can deploy new agents" }, { status: 403 });
        }

        // 2. Create Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role: isAdmin ? 'admin' : 'agent' }
        });

        if (createError) throw createError;

        // 3. Create CRM Staff Record (Pre-linked)
        const { data: staffMember, error: staffError } = await supabaseAdmin
            .from('crm_staff')
            .insert({
                user_id: newUser.user.id,
                unique_name: name,
                tag: email.split('@')[0].toUpperCase(),
                is_admin: isAdmin,
                is_active: true
            })
            .select()
            .single();

        if (staffError) {
            // Cleanup auth user if staff record fails to maintain consistency
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw staffError;
        }

        return NextResponse.json({
            success: true,
            member: staffMember,
            credentials: { email, password }
        });

    } catch (err: any) {
        console.error("Staff creation failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
