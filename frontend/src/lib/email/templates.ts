const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';

const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d1520,#111);padding:32px 40px;border-bottom:1px solid #222;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#00e5ff;font-size:20px;font-weight:800;letter-spacing:0.15em;">ZENTINEL</td>
              <td align="right" style="color:#444;font-size:11px;font-family:monospace;">Security Intelligence Platform</td>
            </tr>
          </table>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:24px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;color:#555;font-size:12px;line-height:1.6;">
            Zentinel · <em>Secure everything. Compromise nothing.</em><br>
            <a href="${BASE_URL}/dashboard/settings/notifications" style="color:#00e5ff;text-decoration:none;">Manage notification preferences</a>
            &nbsp;·&nbsp;
            <a href="${BASE_URL}" style="color:#555;text-decoration:none;">app.zentinel.dev</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const sevBadge = (sev: string) => {
    const map: Record<string, string> = {
        critical: 'background:#ef4444;color:#fff',
        high:     'background:#f97316;color:#fff',
        medium:   'background:#eab308;color:#000',
        low:      'background:#3b82f6;color:#fff',
    };
    const style = map[sev.toLowerCase()] || 'background:#6b7280;color:#fff';
    return `<span style="${style};padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;font-family:monospace;">${sev}</span>`;
};

const btn = (href: string, text: string) =>
    `<a href="${href}" style="display:inline-block;background:#00e5ff;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;margin-top:24px;">${text} →</a>`;

// ── Scan Complete ────────────────────────────────────────────────────────────

export function scanCompleteTemplate({
    orgName, pentestName, pentestId, issuesFound,
    critical, high, medium, low, durationSeconds,
}: {
    orgName: string; pentestName: string; pentestId: string; issuesFound: number;
    critical: number; high: number; medium: number; low: number; durationSeconds?: number;
}) {
    const risk = critical > 0 ? '🔴 CRITICAL RISK' : high > 0 ? '🟠 HIGH RISK' : medium > 0 ? '🟡 MEDIUM RISK' : '🟢 PASSED';
    const dur  = durationSeconds ? `${Math.ceil(durationSeconds / 60)}m` : '—';

    return wrapper(`
      <h1 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">Pentest Complete</h1>
      <p style="margin:0 0 28px;color:#666;font-size:14px;">${orgName} · ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>

      <div style="background:#0d1520;border:1px solid #1e3a5f;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 4px;color:#00e5ff;font-size:12px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Scan Target</p>
        <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">${pentestName}</p>
        <p style="margin:4px 0 0;color:#555;font-size:12px;font-family:monospace;">${pentestId}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          ${[
            ['Overall Risk', risk, '#fff'],
            ['Duration',     dur,  '#aaa'],
            ['Issues Found', String(issuesFound), issuesFound > 0 ? '#ef4444' : '#22c55e'],
          ].map(([label, val, color]) => `
            <td style="text-align:center;padding:16px;background:#161616;border-radius:8px;margin:4px;">
              <div style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">${label}</div>
              <div style="color:${color};font-size:18px;font-weight:700;">${val}</div>
            </td>
          `).join('<td style="width:8px;"></td>')}
        </tr>
      </table>

      ${issuesFound > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          ${[['Critical', critical, '#ef4444'], ['High', high, '#f97316'], ['Medium', medium, '#eab308'], ['Low', low, '#3b82f6']]
            .map(([label, count, color]) => `
            <td style="text-align:center;padding:14px;background:#161616;border-radius:8px;">
              <div style="color:${color};font-size:24px;font-weight:800;">${count}</div>
              <div style="color:#555;font-size:11px;margin-top:4px;">${label}</div>
            </td>
          `).join('<td style="width:6px;"></td>')}
        </tr>
      </table>
      ${critical > 0 ? `<div style="background:#1a0808;border:1px solid #7f1d1d;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;color:#ef4444;font-size:13px;font-weight:600;">⚠ ${critical} critical issue${critical>1?'s':''} require immediate remediation</p>
      </div>` : ''}
      ` : `
      <div style="background:#0a1a0f;border:1px solid #14532d;border-radius:8px;padding:18px 22px;margin-bottom:28px;">
        <p style="margin:0;color:#22c55e;font-size:14px;font-weight:600;">✓ No vulnerabilities detected</p>
        <p style="margin:6px 0 0;color:#555;font-size:13px;">Comprehensive security assessment completed. No issues found.</p>
      </div>
      `}

      ${btn(`${BASE_URL}/dashboard/pentests/${pentestId}`, 'View Full Report')}
    `);
}

// ── Critical/High Finding Alert ──────────────────────────────────────────────

export function criticalFindingTemplate({
    orgName, issueTitle, severity, issueId, source, sourceId,
}: {
    orgName: string; issueTitle: string; severity: string; issueId: string;
    source: 'pentest' | 'pr_review'; sourceId: string;
}) {
    const sourceLabel = source === 'pr_review' ? 'PR Review' : 'Pentest';
    const link = source === 'pr_review'
        ? `${BASE_URL}/dashboard/pr-reviews/${sourceId}`
        : `${BASE_URL}/dashboard/pentests/${sourceId}`;

    return wrapper(`
      <div style="background:#1a0808;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px;">
        <p style="margin:0;color:#ef4444;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
          ⚠ ${severity.toUpperCase()} Vulnerability Detected — ${orgName}
        </p>
      </div>

      <h1 style="margin:0 0 16px;color:#fff;font-size:20px;font-weight:700;line-height:1.3;">${issueTitle}</h1>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:12px 16px;background:#161616;border-radius:8px 0 0 8px;">
            <div style="color:#555;font-size:11px;margin-bottom:4px;">Severity</div>
            <div>${sevBadge(severity)}</div>
          </td>
          <td style="width:6px;"></td>
          <td style="padding:12px 16px;background:#161616;border-radius:0 8px 8px 0;">
            <div style="color:#555;font-size:11px;margin-bottom:4px;">Found in</div>
            <div style="color:#aaa;font-size:13px;font-weight:600;">${sourceLabel}</div>
          </td>
        </tr>
      </table>

      <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Zentinel has identified a <strong style="color:#fff;">${severity}</strong> severity vulnerability.
        Immediate review and remediation is recommended.
      </p>

      ${btn(`${BASE_URL}/dashboard/issues/${issueId}`, 'View Issue & Fix')}
      &nbsp;&nbsp;
      <a href="${link}" style="display:inline-block;color:#00e5ff;font-size:14px;margin-top:24px;text-decoration:none;">View ${sourceLabel} →</a>
    `);
}

// ── PR Review Complete ───────────────────────────────────────────────────────

export function prReviewCompleteTemplate({
    orgName, repoName, prNumber, prTitle, issuesFound, critical, high, prReviewId, prUrl,
}: {
    orgName: string; repoName: string; prNumber: number; prTitle: string;
    issuesFound: number; critical: number; high: number; prReviewId: string; prUrl?: string;
}) {
    const passed = issuesFound === 0;

    return wrapper(`
      <h1 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">PR Security Review Complete</h1>
      <p style="margin:0 0 28px;color:#666;font-size:14px;">${orgName} · ${repoName}</p>

      <div style="background:#161616;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#555;font-size:12px;font-family:monospace;">PR #${prNumber}</p>
        <p style="margin:0;color:#fff;font-size:15px;font-weight:600;">${prTitle}</p>
      </div>

      ${passed
        ? `<div style="background:#0a1a0f;border:1px solid #14532d;border-radius:8px;padding:18px 22px;margin-bottom:28px;">
            <p style="margin:0;color:#22c55e;font-size:15px;font-weight:600;">✓ Security check passed — no issues found</p>
            <p style="margin:6px 0 0;color:#555;font-size:13px;">This PR is clear to merge from a security standpoint.</p>
           </div>`
        : `<div style="background:#1a0808;border:1px solid #7f1d1d;border-radius:8px;padding:18px 22px;margin-bottom:28px;">
            <p style="margin:0;color:#ef4444;font-size:15px;font-weight:600;">✗ ${issuesFound} security issue${issuesFound>1?'s':''} found${critical>0?` — ${critical} critical`:''}</p>
            <p style="margin:6px 0 0;color:#555;font-size:13px;">Review and resolve before merging.</p>
           </div>`
      }

      ${btn(`${BASE_URL}/dashboard/pr-reviews/${prReviewId}`, 'View Security Report')}
      ${prUrl ? `&nbsp;&nbsp;<a href="${prUrl}" style="display:inline-block;color:#555;font-size:14px;margin-top:24px;text-decoration:none;">View PR on GitHub →</a>` : ''}
    `);
}

// ── Weekly Summary ───────────────────────────────────────────────────────────

export function weeklySummaryTemplate({
    orgName, scansRun, issuesFound, critical, high, topFindings,
}: {
    orgName: string; scansRun: number; issuesFound: number;
    critical: number; high: number; topFindings: { title: string; severity: string }[];
}) {
    return wrapper(`
      <h1 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">Weekly Security Summary</h1>
      <p style="margin:0 0 28px;color:#666;font-size:14px;">${orgName} · Week of ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          ${[
            ['Scans Run', String(scansRun), '#00e5ff'],
            ['Issues Found', String(issuesFound), issuesFound > 0 ? '#ef4444' : '#22c55e'],
            ['Critical', String(critical), critical > 0 ? '#ef4444' : '#555'],
            ['High', String(high), high > 0 ? '#f97316' : '#555'],
          ].map(([label, val, color]) => `
            <td style="text-align:center;padding:16px 8px;background:#161616;border-radius:8px;">
              <div style="color:${color};font-size:22px;font-weight:800;">${val}</div>
              <div style="color:#555;font-size:11px;margin-top:4px;">${label}</div>
            </td>
          `).join('<td style="width:6px;"></td>')}
        </tr>
      </table>

      ${topFindings.length > 0 ? `
      <h3 style="color:#aaa;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Open Issues Requiring Attention</h3>
      ${topFindings.slice(0, 5).map(f => `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #1a1a1a;">
          ${sevBadge(f.severity)}
          <span style="color:#ddd;font-size:14px;">${f.title}</span>
        </div>
      `).join('')}
      ` : ''}

      ${btn(`${BASE_URL}/dashboard/issues`, 'View All Issues')}
    `);
}
