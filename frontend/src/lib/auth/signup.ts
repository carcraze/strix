"use server"

import { createClient } from '@supabase/supabase-js';

// Server-side admin client to bypass RLS for signup completion before email is verified
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitSignupData(userId: string, data: any) {
    const slug = data.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // 1. Check if slug exists
    const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (existingOrg) {
        throw new Error("A company with this name already exists. Please choose a different name or ask your admin to add you to their organization.");
    }

    // 2. Check if email already has a profile (different user)
    const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', data.email)
        .neq('id', userId)
        .maybeSingle();

    if (existingProfile) {
        throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // 3. Upsert User Profile FIRST
    const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
            id: userId,
            email: data.email,
            first_name: data.first_name || data.full_name?.split(' ')[0] || '',
            last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
            company: data.company_name,
            company_name: data.company_name,
            company_website: data.company_website,
            role: data.role,
            company_size: data.company_size,
            code_platforms: data.code_platforms || [],
            concerns: data.concerns || [],
            onboarding_completed: true,
            updated_at: new Date().toISOString()
        });

    if (profileError) throw profileError;

    // 4. Create Organization
    const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
            name: data.company_name,
            slug: slug,
            plan: 'free'
        })
        .select()
        .single();

    if (orgError) throw orgError;

    // 5. Create Organization Member (as owner)
    const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
            organization_id: org.id,
            user_id: userId,
            role: 'owner'
        });

    if (memberError) throw memberError;

    return { success: true, orgId: org.id };
}
