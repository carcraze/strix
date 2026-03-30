-- ============================================================================
-- ZENTINEL DATABASE: AUDIT LOGGING SYSTEM
-- ============================================================================
-- Purpose: Track all sensitive operations for security auditing
-- Compliance: Required for SOC 2 Type II certification
-- Retention: 7 years (SOC 2 requirement)
-- Date: March 30, 2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Who performed the action
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),

    -- What action was performed
    action TEXT NOT NULL,  -- e.g., 'scan.launch', 'credit.consume', 'user.invite'
    resource_type TEXT,    -- e.g., 'pentest', 'organization', 'user'
    resource_id UUID,      -- ID of the affected resource

    -- Context
    metadata JSONB,        -- IP address, user agent, old/new values, etc.
    success BOOLEAN DEFAULT true,  -- Did the action succeed?
    error_message TEXT,    -- If failed, what was the error?

    -- Request tracking
    request_id UUID,       -- Link to application request ID
    ip_address INET,       -- Source IP address
    user_agent TEXT        -- Browser/API client
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

COMMENT ON TABLE audit_logs IS
'Immutable audit trail of all sensitive operations. Required for SOC 2 compliance. Retention: 7 years.';

-- ----------------------------------------------------------------------------
-- 2. RLS POLICY FOR AUDIT LOGS
-- ----------------------------------------------------------------------------

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view audit logs for their organizations
CREATE POLICY "Users can view audit logs for their organizations"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- Only service role can insert audit logs (prevents tampering)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
  ON audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION: Log Audit Event
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_organization_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action,
        resource_type,
        resource_id,
        metadata,
        success,
        error_message,
        request_id,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_organization_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_metadata,
        p_success,
        p_error_message,
        p_request_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event IS
'Helper function to insert audit log entries from backend code';

-- ----------------------------------------------------------------------------
-- 4. AUTOMATIC TRIGGERS: Audit Critical Operations
-- ----------------------------------------------------------------------------

-- 4.1. Audit Credit Consumption
CREATE OR REPLACE FUNCTION audit_credit_consumption()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when scan_credits changes
    IF OLD.scan_credits IS DISTINCT FROM NEW.scan_credits THEN
        PERFORM log_audit_event(
            p_user_id := auth.uid(),
            p_organization_id := NEW.id,
            p_action := 'credit.consume',
            p_resource_type := 'organization',
            p_resource_id := NEW.id,
            p_metadata := jsonb_build_object(
                'old_credits', OLD.scan_credits,
                'new_credits', NEW.scan_credits,
                'change', (NEW.scan_credits::jsonb - OLD.scan_credits::jsonb)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_credit_consumption
    AFTER UPDATE ON organizations
    FOR EACH ROW
    WHEN (OLD.scan_credits IS DISTINCT FROM NEW.scan_credits)
    EXECUTE FUNCTION audit_credit_consumption();

-- 4.2. Audit Organization Changes
CREATE OR REPLACE FUNCTION audit_organization_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- Log significant changes (plan upgrades, downgrades)
        IF OLD.plan IS DISTINCT FROM NEW.plan THEN
            PERFORM log_audit_event(
                p_user_id := auth.uid(),
                p_organization_id := NEW.id,
                p_action := 'organization.plan_change',
                p_resource_type := 'organization',
                p_resource_id := NEW.id,
                p_metadata := jsonb_build_object(
                    'old_plan', OLD.plan,
                    'new_plan', NEW.plan
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_organization_changes
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION audit_organization_changes();

-- 4.3. Audit Member Changes
CREATE OR REPLACE FUNCTION audit_member_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM log_audit_event(
            p_user_id := NEW.invited_by_user_id,
            p_organization_id := NEW.organization_id,
            p_action := 'member.invite',
            p_resource_type := 'organization_member',
            p_resource_id := NEW.id,
            p_metadata := jsonb_build_object(
                'invited_user_id', NEW.user_id,
                'role', NEW.role
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
        PERFORM log_audit_event(
            p_user_id := auth.uid(),
            p_organization_id := NEW.organization_id,
            p_action := 'member.role_change',
            p_resource_type := 'organization_member',
            p_resource_id := NEW.id,
            p_metadata := jsonb_build_object(
                'user_id', NEW.user_id,
                'old_role', OLD.role,
                'new_role', NEW.role
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM log_audit_event(
            p_user_id := auth.uid(),
            p_organization_id := OLD.organization_id,
            p_action := 'member.remove',
            p_resource_type := 'organization_member',
            p_resource_id := OLD.id,
            p_metadata := jsonb_build_object(
                'removed_user_id', OLD.user_id,
                'role', OLD.role
            )
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_member_changes
    AFTER INSERT OR UPDATE OR DELETE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION audit_member_changes();

-- ----------------------------------------------------------------------------
-- 5. AUDIT REPORT QUERIES
-- ----------------------------------------------------------------------------

-- 5.1. Recent Security Events by Organization
CREATE OR REPLACE VIEW v_recent_audit_events AS
SELECT
    al.timestamp,
    al.action,
    al.resource_type,
    al.success,
    o.name as organization_name,
    u.email as user_email,
    al.metadata,
    al.ip_address
FROM audit_logs al
LEFT JOIN organizations o ON al.organization_id = o.id
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.timestamp > now() - interval '30 days'
ORDER BY al.timestamp DESC;

-- 5.2. Failed Actions (Security Alerts)
CREATE OR REPLACE VIEW v_failed_actions AS
SELECT
    al.timestamp,
    al.action,
    al.error_message,
    al.ip_address,
    o.name as organization_name,
    u.email as user_email,
    al.metadata
FROM audit_logs al
LEFT JOIN organizations o ON al.organization_id = o.id
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.success = false
  AND al.timestamp > now() - interval '7 days'
ORDER BY al.timestamp DESC;

-- 5.3. Credit Consumption History
CREATE OR REPLACE VIEW v_credit_consumption_history AS
SELECT
    al.timestamp,
    o.name as organization_name,
    al.metadata->>'old_credits' as old_credits,
    al.metadata->>'new_credits' as new_credits,
    al.metadata->>'change' as credits_consumed,
    u.email as user_email
FROM audit_logs al
LEFT JOIN organizations o ON al.organization_id = o.id
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.action = 'credit.consume'
ORDER BY al.timestamp DESC;

-- ----------------------------------------------------------------------------
-- 6. RETENTION POLICY (7 Years for SOC 2)
-- ----------------------------------------------------------------------------

-- Archive old logs to cold storage (run monthly via cron)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    -- Move logs older than 7 years to archive table
    WITH archived AS (
        DELETE FROM audit_logs
        WHERE timestamp < now() - interval '7 years'
        RETURNING *
    )
    INSERT INTO audit_logs_archive
    SELECT * FROM archived;

    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create archive table (same structure as audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

COMMENT ON TABLE audit_logs_archive IS
'Cold storage for audit logs older than 7 years. Retained for compliance purposes.';

-- ----------------------------------------------------------------------------
-- 7. SAMPLE USAGE FROM BACKEND CODE
-- ----------------------------------------------------------------------------

/*
Example 1: Log a scan launch
----------------------------------------
SELECT log_audit_event(
    p_user_id := 'user-uuid-here',
    p_organization_id := 'org-uuid-here',
    p_action := 'scan.launch',
    p_resource_type := 'pentest',
    p_resource_id := 'pentest-uuid-here',
    p_metadata := jsonb_build_object(
        'scan_type', 'full_stack',
        'targets', ARRAY['https://app.example.com'],
        'credit_source', 'subscription'
    ),
    p_ip_address := '203.0.113.42'::inet,
    p_user_agent := 'Mozilla/5.0...'
);

Example 2: Log a failed action
----------------------------------------
SELECT log_audit_event(
    p_user_id := 'user-uuid-here',
    p_organization_id := 'org-uuid-here',
    p_action := 'scan.launch',
    p_success := false,
    p_error_message := 'Insufficient credits',
    p_metadata := jsonb_build_object(
        'requested_scan_type', 'compliance',
        'credits_available', 0
    ),
    p_ip_address := '203.0.113.42'::inet
);

Example 3: Query recent events
----------------------------------------
SELECT * FROM v_recent_audit_events
WHERE organization_id = 'org-uuid-here'
LIMIT 50;

Example 4: Security alert - failed login attempts
----------------------------------------
SELECT * FROM v_failed_actions
WHERE action LIKE 'auth.%'
  AND timestamp > now() - interval '1 hour';
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check audit log coverage
SELECT
    action,
    COUNT(*) as count,
    MIN(timestamp) as first_seen,
    MAX(timestamp) as last_seen
FROM audit_logs
GROUP BY action
ORDER BY count DESC;

-- Check for suspicious patterns (multiple failed actions from same IP)
SELECT
    ip_address,
    COUNT(*) as failed_attempts,
    array_agg(DISTINCT action) as attempted_actions,
    MIN(timestamp) as first_attempt,
    MAX(timestamp) as last_attempt
FROM audit_logs
WHERE success = false
  AND timestamp > now() - interval '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- ============================================================================
