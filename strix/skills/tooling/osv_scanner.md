---
name: osv_scanner
description: OSV-Scanner + npm audit + pip-audit for SCA — real CVE data with CVSS scores, reachability analysis, dependency chain mapping.
---

# Software Composition Analysis (SCA) Playbook

Industry-standard SCA using OSV-Scanner (Google), npm audit, pip-audit, and dependency graph analysis.
Maps every third-party dependency to known CVEs with CVSS scores, exploitation status, and reachability.

## Tool Priority Order

1. **OSV-Scanner** (Google-backed, covers npm/pip/Go/Maven/Cargo) — most comprehensive
2. **npm audit** (Node.js built-in) — always available for JS projects
3. **pip-audit** (Python projects)
4. **Manual CVE lookup** (fallback)

---

## OSV-Scanner (PRIMARY — All Ecosystems)

```bash
# Install
pip install osv-scanner 2>/dev/null || curl -sSfL https://github.com/google/osv-scanner/releases/latest/download/osv-scanner_linux_amd64 -o /usr/local/bin/osv-scanner && chmod +x /usr/local/bin/osv-scanner 2>/dev/null

# Scan entire repo (auto-detects package.json, requirements.txt, go.mod, Cargo.toml, pom.xml)
osv-scanner --recursive /workspace --json 2>/dev/null

# Scan specific manifest
osv-scanner --lockfile /workspace/package-lock.json --json 2>/dev/null
osv-scanner --lockfile /workspace/requirements.txt --json 2>/dev/null
```

## npm audit (Node.js — Always Available)

```bash
cd /workspace && npm audit --json 2>/dev/null

# If no package-lock.json exists, generate it first
cd /workspace && npm install --package-lock-only 2>/dev/null && npm audit --json 2>/dev/null
```

### Parse npm audit output — key fields:
```bash
# Get only HIGH and CRITICAL vulnerabilities
cd /workspace && npm audit --json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
vulns = data.get('vulnerabilities', {})
for pkg, info in vulns.items():
    sev = info.get('severity', '')
    if sev in ('high', 'critical', 'moderate'):
        vias = [v.get('source', {}) if isinstance(v, dict) else v for v in info.get('via', [])]
        print(f'{sev.upper()}: {pkg} v{info.get(\"range\",\"?\")} — {info.get(\"fixAvailable\", False)}')
        for v in info.get('via', []):
            if isinstance(v, dict):
                print(f'  CVE: {v.get(\"url\",\"\")} CVSS:{v.get(\"cvss\",{}).get(\"score\",\"?\")} — {v.get(\"title\",\"\")}')
"
```

## pip-audit (Python)

```bash
# Install
pip install pip-audit 2>/dev/null

# Scan requirements.txt
pip-audit -r /workspace/requirements.txt --format json 2>/dev/null

# Scan installed packages
pip-audit --format json 2>/dev/null
```

## Go Vulnerabilities

```bash
# Install govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest 2>/dev/null

# Scan
cd /workspace && govulncheck ./... 2>/dev/null
```

## Reachability Analysis (Critical for Reducing False Positives)

After identifying vulnerable packages, determine if the vulnerable code path is actually called:

```bash
# For npm packages — check if vulnerable function is imported/used
PKG="vulnerable-package-name"
grep -rn "require('$PKG')\|from '$PKG'\|import.*$PKG" /workspace/src /workspace/app 2>/dev/null

# Check which files use the vulnerable package
grep -rn "$PKG" /workspace --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | grep -v "node_modules\|package.json\|package-lock"
```

Reachability verdict:
- **Reachable** → Report as full severity (CRITICAL/HIGH)
- **Unreachable** → Downgrade one level (CRITICAL→HIGH, HIGH→MEDIUM) and note "dependency present but not reachable in call graph"
- **Transitive only** → Note as transitive dependency risk

## Complete SCA Report Format

For each vulnerable dependency:

```
FINDING: Vulnerable Dependency
- Package: [name] v[version]
- CVE: CVE-XXXX-XXXXX
- CVSS Score: X.X ([Critical/High/Medium/Low])
- CVSS Vector: CVSS:3.1/AV:N/AC:L/...
- Vulnerability: [description]
- Affected Versions: [range]
- Patched Version: [upgrade to X.X.X]
- Reachability: [Reachable / Unreachable / Unknown]
- Exploit Available: [Yes/No — check exploitdb, github PoCs]
- Remediation:
  npm install [package]@[fixed-version]   # or
  pip install [package]==[fixed-version]
- Business Impact: [what attacker can do if exploited]
```

## Transitive Dependency Mapping

```bash
# Show full dependency tree including transitive deps
npm list --all --json 2>/dev/null | head -100

# Find which top-level package pulls in a vulnerable transitive dep
npm list [vulnerable-package] 2>/dev/null
```

## Severity Escalation Rules

| Condition | Action |
|---|---|
| CVSS ≥ 9.0 + public PoC available | CRITICAL — report immediately |
| CVSS ≥ 7.0 + reachable | HIGH |
| CVSS ≥ 7.0 + unreachable | MEDIUM |
| CVSS ≥ 4.0 + reachable | MEDIUM |
| Any CVE + no patch available | Note "no fix available — consider alternative package" |
| Package unmaintained (last commit > 12 months) | Flag as security debt |
