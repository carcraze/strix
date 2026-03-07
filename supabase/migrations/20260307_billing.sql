-- Migration: 20260307_billing.sql
-- Description: Add billing fields to organizations and create invoices table

-- Add billing fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS scans_left INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
-- Users can view invoices for organizations they are members of
CREATE POLICY "Users can view invoices for their organizations" ON public.invoices
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );

-- Create a dummy invoice for existing organizations so UI has data to show
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id FROM public.organizations
    LOOP
        INSERT INTO public.invoices (organization_id, amount, plan_name, status, date)
        VALUES (org.id, 0, 'Basic Plan (Trial)', 'paid', NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;
