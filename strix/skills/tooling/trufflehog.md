---
name: trufflehog
description: TruffleHog secrets scanning — 800+ detectors, git history analysis, entropy detection. Industry-leading secrets scanner.
---

# TruffleHog Secrets Detection Playbook

TruffleHog is the industry-leading secrets scanner used by security teams at Google, Coinbase, and thousands of enterprises.
It detects 800+ credential types including API keys, tokens, private keys, OAuth tokens, database credentials, and cloud secrets.
Unlike grep-based tools, TruffleHog uses verified detectors that confirm secrets are real and active — zero false positives.

## Installation (if not present)

```bash
# Install via pip (fastest)
pip install trufflehog3 2>/dev/null || true

# Or via curl (single binary)
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin 2>/dev/null || true

# Verify
trufflehog --version 2>/dev/null || echo "Using trufflehog3"
```

## Core Scan Patterns

### Scan a local filesystem / cloned repo (PRIMARY USE CASE)
```bash
# Scan entire directory tree — finds secrets in all file types
trufflehog filesystem /workspace --json --no-update 2>/dev/null

# If trufflehog3 (pip version):
trufflehog3 /workspace --format json 2>/dev/null
```

### Scan git history (CRITICAL — most secrets live in deleted commits)
```bash
# Scan full git history including deleted files
trufflehog git file:///workspace --json --no-update 2>/dev/null

# Scan specific depth
trufflehog git file:///workspace --json --no-update --since-commit HEAD~100 2>/dev/null
```

### Scan GitHub repository remotely (when no local clone)
```bash
trufflehog github --repo https://github.com/org/repo --json --no-update 2>/dev/null
```

## Fallback: Gitleaks (if TruffleHog not available)
```bash
# Install gitleaks
wget -q https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz -O /tmp/gl.tar.gz && tar -xzf /tmp/gl.tar.gz -C /tmp/ gitleaks && mv /tmp/gitleaks /usr/local/bin/ 2>/dev/null

# Scan
gitleaks detect --source /workspace --report-format json --report-path /tmp/gitleaks_report.json --no-git 2>/dev/null
cat /tmp/gitleaks_report.json
```

## Fallback: Manual Pattern Search (always available)
```bash
# High-signal secret patterns across all files
grep -rE "(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|xoxb-[0-9]+-[a-zA-Z0-9]+|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)" /workspace --include="*.js" --include="*.ts" --include="*.py" --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml" -l 2>/dev/null

# AWS keys
grep -rE "AKIA[0-9A-Z]{16}" /workspace 2>/dev/null

# Generic high-entropy strings in common secret variable names
grep -rEi "(api_key|secret_key|access_token|private_key|password|passwd|auth_token)\s*[=:]\s*['\"][^'\"]{8,}" /workspace --include="*.js" --include="*.ts" --include="*.py" --include="*.env" 2>/dev/null | grep -v "example\|placeholder\|your_\|xxx\|test\|dummy"
```

## What TruffleHog Detects (800+ types, key examples)

### Cloud Provider Keys
- AWS: Access Key IDs (`AKIA...`), Secret Keys
- GCP: Service Account JSON, OAuth tokens
- Azure: Storage keys, connection strings, client secrets

### SaaS API Keys
- Stripe (`sk_live_...`, `pk_live_...`)
- OpenAI (`sk-...`)
- GitHub tokens (`ghp_...`, `gho_...`, `github_pat_...`)
- Slack webhooks and bot tokens (`xoxb-...`)
- Twilio, SendGrid, Mailgun, PagerDuty, etc.

### Infrastructure Secrets
- Database connection strings (PostgreSQL, MySQL, MongoDB, Redis)
- Private keys (RSA, EC, OpenSSH)
- JWT secrets and signing keys
- Docker registry credentials

### Framework/Platform Secrets
- Supabase service role keys (`sb_secret_...`)
- Firebase service account keys
- Heroku API keys
- Netlify tokens

## Reporting Format

For each secret found, report:
```
FINDING: Secret Detected
- Type: [e.g. AWS Access Key, Stripe Live Key, Private Key]
- Severity: CRITICAL (live/production keys) | HIGH (staging keys) | MEDIUM (historical/revoked)
- File: [exact file path]
- Line: [line number]
- Detector Verified: [Yes/No — verified means the secret is currently active]
- Preview: [first 4 chars]****[last 4 chars] — NEVER log full secrets
- Remediation:
  1. Immediately rotate/revoke this credential in the provider dashboard
  2. Remove from codebase and add to .gitignore
  3. Check git history for previous commits containing this secret
  4. Audit access logs for unauthorized usage since exposure
```

## Severity Classification

| Secret Type | Severity |
|---|---|
| Live production API key (verified active) | CRITICAL |
| Private cryptographic key | CRITICAL |
| Database connection string (prod) | CRITICAL |
| Live payment processor key (Stripe, etc.) | CRITICAL |
| OAuth token / session token | HIGH |
| Staging/dev keys | HIGH |
| Historical secrets (deleted but in git history) | HIGH |
| Internal service tokens | MEDIUM |

## Integration into Scan Workflow

1. **Run TruffleHog FIRST** before any other analysis — secrets in code are the highest-priority finding
2. Report all secrets IMMEDIATELY as CRITICAL findings
3. Do NOT wait for dynamic testing before reporting secrets
4. Check both current files AND git history
5. Verify which secrets are still active (TruffleHog --only-verified flag does this)
