-- Migration: 20260304_rbac.sql
-- Description: Create organizations and user_roles tables for RBAC

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Users can view their own organizations" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid())
    );

-- Policies for user_roles
CREATE POLICY "Users can view roles in their organizations" ON public.user_roles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid())
    );

-- Insert a default organization trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Insert a default organization for the new user
  INSERT INTO public.organizations (name)
  VALUES (NEW.email || '''s Team')
  RETURNING id INTO org_id;

  -- Assign the new user as the owner of this organization
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.id, org_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
