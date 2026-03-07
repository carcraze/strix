import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { action, orgId, email, password, role, userId, reason } = await req.json();

        // 1. Authorize - Verify the requester is an owner/admin of the organization
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Missing authorization" }, { status: 401 });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: member, error: memberError } = await supabaseAdmin
            .from("organization_members")
            .select("role")
            .eq("organization_id", orgId)
            .eq("user_id", user.id)
            .single();

        if (memberError || !["owner", "admin"].includes(member?.role)) {
            return NextResponse.json({ error: "Only admins or owners can perform this action" }, { status: 403 });
        }

        if (action === "invite") {
            // A. Role Hierarchy Check: Only owners can invite owners
            if (role === "owner" && member.role !== "owner") {
                return NextResponse.json({ error: "Only owners can invite other owners" }, { status: 403 });
            }

            // B. Create User in Auth
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { source: "admin_invite" }
            });

            if (createError) throw createError;

            // C. Create User Profile
            const { error: profileError } = await supabaseAdmin
                .from("user_profiles")
                .upsert({
                    id: newUser.user.id,
                    email,
                    first_name: email.split("@")[0],
                    last_name: "Member",
                    company: "Zentinel", // Default
                    auth_provider: "supabase"
                });

            if (profileError) throw profileError;

            // D. Create Org Membership
            const { error: joinError } = await supabaseAdmin
                .from("organization_members")
                .insert({
                    organization_id: orgId,
                    user_id: newUser.user.id,
                    role: role || "developer",
                    status: "active"
                });

            if (joinError) throw joinError;

            return NextResponse.json({ success: true, user: newUser.user });
        }

        // For actions on existing users (suspend, delete), check target role first
        const { data: targetMember, error: targetError } = await supabaseAdmin
            .from("organization_members")
            .select("role")
            .eq("organization_id", orgId)
            .eq("user_id", userId)
            .maybeSingle();

        // 2. Protect Owners - Owners cannot be suspended or deleted via this API
        if (targetMember?.role === "owner") {
            return NextResponse.json({ error: "Owner accounts cannot be suspended or removed" }, { status: 403 });
        }

        if (action === "suspend") {
            const { error: suspendError } = await supabaseAdmin
                .from("user_profiles")
                .update({
                    is_suspended: true,
                    suspension_reason: reason || "Account suspended reach out to your admin for further information"
                })
                .eq("id", userId);

            if (suspendError) throw suspendError;
            return NextResponse.json({ success: true });
        }

        if (action === "unsuspend") {
            const { error: suspendError } = await supabaseAdmin
                .from("user_profiles")
                .update({
                    is_suspended: false,
                    suspension_reason: null
                })
                .eq("id", userId);

            if (suspendError) throw suspendError;
            return NextResponse.json({ success: true });
        }

        if (action === "delete") {
            // Remove from Org
            const { error: deleteError } = await supabaseAdmin
                .from("organization_members")
                .delete()
                .eq("organization_id", orgId)
                .eq("user_id", userId);

            if (deleteError) throw deleteError;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (err: any) {
        console.error("Admin action failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
