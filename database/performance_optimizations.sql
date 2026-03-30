-- ============================================================================
-- ZENTINEL DATABASE: PERFORMANCE OPTIMIZATIONS
-- ============================================================================
-- Purpose: Indexes, materialized views, and query optimizations
-- Impact: Faster queries, better user experience, lower costs
-- Date: March 30, 2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRITICAL INDEXES (Should already exist, but verify)
-- ----------------------------------------------------------------------------

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);

-- Pentests
CREATE INDEX IF NOT EXISTS idx_pentests_org_id ON pentests(organization_id);
CREATE INDEX IF NOT EXISTS idx_pentests_status ON pentests(status);
CREATE INDEX IF NOT EXISTS idx_pentests_created_at ON pentests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pentests_org_status ON pentests(organization_id, status);

-- Pentest Targets
CREATE INDEX IF NOT EXISTS idx_pentest_targets_pentest_id ON pentest_targets(pentest_id);

-- Issues (Vulnerabilities)
CREATE INDEX IF NOT EXISTS idx_issues_org_id ON issues(organization_id);
CREATE INDEX IF NOT EXISTS idx_issues_pentest_id ON issues(pentest_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_org_severity ON issues(organization_id, severity);

-- PR Reviews
CREATE INDEX IF NOT EXISTS idx_pr_reviews_org_id ON pr_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_repo_id ON pr_reviews(repository_id);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_status ON pr_reviews(status);

-- Repositories
CREATE INDEX IF NOT EXISTS idx_repositories_org_id ON repositories(organization_id);
CREATE INDEX IF NOT EXISTS idx_repositories_provider ON repositories(provider);

-- Domains
CREATE INDEX IF NOT EXISTS idx_domains_org_id ON domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_domains_verified ON domains(verified);

-- Organization Members
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- Scan Usage
CREATE INDEX IF NOT EXISTS idx_scan_usage_org_month ON scan_usage(organization_id, month);

-- ----------------------------------------------------------------------------
-- 2. COMPOSITE INDEXES for Common Queries
-- ----------------------------------------------------------------------------

-- Dashboard: Recent scans for an organization
CREATE INDEX IF NOT EXISTS idx_pentests_org_created ON pentests(organization_id, created_at DESC)
WHERE status IN ('pending', 'running', 'completed');

-- Issues dashboard: Unresolved critical/high issues
CREATE INDEX IF NOT EXISTS idx_issues_unresolved ON issues(organization_id, severity, created_at DESC)
WHERE status IN ('open', 'in_progress');

-- PR reviews: Recent reviews for a repository
CREATE INDEX IF NOT EXISTS idx_pr_reviews_repo_created ON pr_reviews(repository_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. PARTIAL INDEXES (Only index rows that matter)
-- ----------------------------------------------------------------------------

-- Active pentests (saves space, faster lookups)
CREATE INDEX IF NOT EXISTS idx_pentests_active ON pentests(organization_id, created_at DESC)
WHERE status IN ('pending', 'running');

-- Verified domains only
CREATE INDEX IF NOT EXISTS idx_domains_verified_only ON domains(organization_id)
WHERE verified = true;

-- Open issues only
CREATE INDEX IF NOT EXISTS idx_issues_open ON issues(organization_id, severity, created_at DESC)
WHERE status = 'open';

-- ----------------------------------------------------------------------------
-- 4. FULL-TEXT SEARCH for Issues
-- ----------------------------------------------------------------------------

-- Add tsvector column for full-text search on issue descriptions
ALTER TABLE issues ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(file_path, '') || ' ' ||
        coalesce(endpoint, '')
    )
) STORED;

CREATE INDEX IF NOT EXISTS idx_issues_search ON issues USING GIN(search_vector);

COMMENT ON COLUMN issues.search_vector IS
'Full-text search index for issue titles, descriptions, file paths, and endpoints';

-- Example query:
-- SELECT * FROM issues
-- WHERE organization_id = 'org-uuid'
--   AND search_vector @@ to_tsquery('english', 'SQL & injection')
-- ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 5. MATERIALIZED VIEWS for Dashboard Stats
-- ----------------------------------------------------------------------------

-- 5.1. Organization Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organization_stats AS
SELECT
    o.id as organization_id,
    o.name as organization_name,
    o.plan,

    -- Scan counts
    COUNT(DISTINCT p.id) as total_scans,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed') as completed_scans,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'running') as running_scans,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > now() - interval '30 days') as scans_last_30_days,

    -- Issue counts by severity
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'critical') as critical_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'high') as high_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'medium') as medium_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'low') as low_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'open') as open_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'resolved') as resolved_issues,

    -- Resource counts
    COUNT(DISTINCT r.id) as total_repositories,
    COUNT(DISTINCT d.id) as total_domains,
    COUNT(DISTINCT om.id) as total_members,

    -- Latest activity
    MAX(p.created_at) as last_scan_date,
    MAX(i.created_at) as last_issue_date

FROM organizations o
LEFT JOIN pentests p ON o.id = p.organization_id
LEFT JOIN issues i ON o.id = i.organization_id
LEFT JOIN repositories r ON o.id = r.organization_id
LEFT JOIN domains d ON o.id = d.organization_id
LEFT JOIN organization_members om ON o.id = om.organization_id
GROUP BY o.id, o.name, o.plan;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_org_stats_org_id ON mv_organization_stats(organization_id);

COMMENT ON MATERIALIZED VIEW mv_organization_stats IS
'Pre-computed organization statistics for dashboards. Refresh hourly.';

-- 5.2. Security Trends (Last 90 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_security_trends AS
SELECT
    organization_id,
    date_trunc('day', created_at) as date,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE severity = 'high') as high_count,
    COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
    COUNT(*) FILTER (WHERE severity = 'low') as low_count,
    COUNT(*) as total_issues
FROM issues
WHERE created_at > now() - interval '90 days'
GROUP BY organization_id, date_trunc('day', created_at);

CREATE INDEX IF NOT EXISTS idx_mv_security_trends ON mv_security_trends(organization_id, date DESC);

COMMENT ON MATERIALIZED VIEW mv_security_trends IS
'Daily security trend data for charts. Refresh daily.';

-- ----------------------------------------------------------------------------
-- 6. REFRESH MATERIALIZED VIEWS (Schedule via pg_cron or app)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_security_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_dashboard_stats IS
'Refresh all dashboard materialized views. Run hourly via cron.';

-- Example: Schedule via pg_cron (if installed)
-- SELECT cron.schedule('refresh-dashboard-stats', '0 * * * *', 'SELECT refresh_dashboard_stats()');

-- ----------------------------------------------------------------------------
-- 7. QUERY PERFORMANCE MONITORING
-- ----------------------------------------------------------------------------

-- 7.1. Slow Query Log (requires pg_stat_statements extension)
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 7.2. Missing Indexes Detection
CREATE OR REPLACE VIEW v_missing_indexes AS
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan AS avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND seq_tup_read / seq_scan > 10000  -- Tables with large sequential scans
ORDER BY seq_tup_read DESC;

-- 7.3. Index Usage Statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;  -- Indexes with low usage

-- 7.4. Table Bloat Detection
CREATE OR REPLACE VIEW v_table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- ----------------------------------------------------------------------------
-- 8. VACUUM AND ANALYZE RECOMMENDATIONS
-- ----------------------------------------------------------------------------

-- Run VACUUM ANALYZE on tables with high bloat
CREATE OR REPLACE FUNCTION vacuum_bloated_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_stat_user_tables
        WHERE n_dead_tup > 1000
          AND ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 10
    LOOP
        EXECUTE format('VACUUM ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Run weekly via pg_cron
-- SELECT cron.schedule('vacuum-bloated-tables', '0 2 * * 0', 'SELECT vacuum_bloated_tables()');

-- ----------------------------------------------------------------------------
-- 9. CONNECTION POOLING RECOMMENDATIONS
-- ----------------------------------------------------------------------------

-- Check active connections
CREATE OR REPLACE VIEW v_connection_stats AS
SELECT
    state,
    COUNT(*) as count,
    MAX(now() - query_start) as max_query_duration,
    array_agg(DISTINCT usename) as users
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- ----------------------------------------------------------------------------
-- 10. VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Check all indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check query performance
SELECT
    query,
    calls,
    ROUND(mean_exec_time::numeric, 2) as avg_ms,
    ROUND(total_exec_time::numeric, 2) as total_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- MAINTENANCE SCHEDULE RECOMMENDATIONS
-- ============================================================================

/*
Hourly:
- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_stats;
- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_security_trends;

Daily:
- Check v_slow_queries for performance issues
- Monitor v_connection_stats for connection leaks

Weekly:
- Run vacuum_bloated_tables()
- Review v_missing_indexes
- Check v_index_usage for unused indexes

Monthly:
- Review audit_logs retention
- Analyze security trends
- Optimize frequently-run queries
*/

-- ============================================================================
