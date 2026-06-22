import { supabase } from "@/lib/supabase";

export async function detectSSO(email: string): Promise<{ ssoEnabled: boolean; redirectUrl?: string }> {
    const domain = email.split('@')[1];
    if (!domain) return { ssoEnabled: false };

    // Check if the domain is registered for SSO in our database
    // This assumes we have a 'sso_domains' table or similar that maps domains to WorkOS connections
    const { data, error } = await supabase
        .from('sso_configs')
        .select('workos_connection_id')
        .eq('domain', domain)
        .single();

    if (error || !data) {
        return { ssoEnabled: false };
    }

    // WorkOS Auth URL construction
    // Typically: /api/auth/workos/authorize?connection={connection_id}&email={email}
    const redirectUrl = `/api/auth/workos/authorize?connection=${data.workos_connection_id}&email=${encodeURIComponent(email)}`;

    return {
        ssoEnabled: true,
        redirectUrl
    };
}
