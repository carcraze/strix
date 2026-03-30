-- ============================================================================
-- ZENTINEL DATABASE: ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Purpose: Enforce multi-tenant isolation at the database level
-- Impact: Even if application code has bugs, database prevents data leaks
-- SOC 2 Compliance: Required for enterprise security certification
-- Date: March 30, 2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentest_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTION: Get Current User's Organization IDs
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth.user_organization_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(organization_id)
  FROM organization_members
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_organization_ids() IS
'Returns array of organization IDs that the current authenticated user belongs to';

-- ----------------------------------------------------------------------------
-- 3. ORGANIZATIONS TABLE - Users can only see orgs they belong to
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update their own organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 4. PENTESTS TABLE - Multi-tenant isolation
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view pentests in their organizations"
  ON pentests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can insert pentests for their organizations"
  ON pentests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update pentests in their organizations"
  ON pentests
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 5. PENTEST_TARGETS TABLE - Cascade from pentests
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view pentest targets"
  ON pentest_targets
  FOR SELECT
  TO authenticated
  USING (
    pentest_id IN (
      SELECT id FROM pentests
      WHERE organization_id IN (SELECT unnest(auth.user_organization_ids()))
    )
  );

CREATE POLICY "Users can insert pentest targets"
  ON pentest_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pentest_id IN (
      SELECT id FROM pentests
      WHERE organization_id IN (SELECT unnest(auth.user_organization_ids()))
    )
  );

-- ----------------------------------------------------------------------------
-- 6. ISSUES TABLE - Vulnerability findings isolation
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view issues in their organizations"
  ON issues
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can insert issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 7. PR_REVIEWS TABLE - Code review isolation
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view PR reviews in their organizations"
  ON pr_reviews
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can insert PR reviews"
  ON pr_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update PR reviews"
  ON pr_reviews
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 8. REPOSITORIES TABLE - Git repo access control
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view repositories in their organizations"
  ON repositories
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can insert repositories"
  ON repositories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update repositories"
  ON repositories
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can delete repositories"
  ON repositories
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 9. DOMAINS TABLE - Domain verification isolation
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view domains in their organizations"
  ON domains
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can insert domains"
  ON domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can update domains"
  ON domains
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  )
  WITH CHECK (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

CREATE POLICY "Users can delete domains"
  ON domains
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 10. SCAN_USAGE TABLE - Monthly usage tracking
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view scan usage for their organizations"
  ON scan_usage
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 11. ORGANIZATION_MEMBERS TABLE - Self-service member viewing
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view members in their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT unnest(auth.user_organization_ids()))
  );

-- ----------------------------------------------------------------------------
-- 12. SERVICE ROLE BYPASS (For Backend API Operations)
-- ----------------------------------------------------------------------------

-- Allow service role to bypass RLS for admin operations
-- This is used by your backend API when it needs to perform system operations

CREATE POLICY "Service role has full access to organizations"
  ON organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to pentests"
  ON pentests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to issues"
  ON issues
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to pr_reviews"
  ON pr_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to repositories"
  ON repositories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to domains"
  ON domains
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to scan_usage"
  ON scan_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to pentest_targets"
  ON pentest_targets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS is working correctly:

-- 1. Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test helper function (should return your organization IDs)
-- SELECT auth.user_organization_ids();

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- ✅ Defense-in-Depth: Even if backend code forgets to filter by organization_id,
--    the database will enforce isolation

-- ✅ SOC 2 Compliance: Multi-tenant data isolation enforced at DB level

-- ✅ Performance: Uses array aggregation and STABLE functions for efficiency

-- ⚠️ Service Role: Backend API uses service_role key to bypass RLS for
--    system operations. Protect this key carefully!

-- ⚠️ Testing: Always test RLS policies with real user tokens before deploying

-- ============================================================================
