---
name: trivy
description: Trivy — industry-standard container/filesystem/IaC security scanner by Aqua Security. Scans images, repos, and IaC files for CVEs, misconfigs, secrets, and SBOM.
---

# Trivy Security Scanner Playbook

Trivy is the most widely adopted open-source security scanner, used by Docker, GitHub, and major cloud providers.
It scans containers, filesystems, Git repos, and IaC files in one tool with a single binary.

## Installation

```bash
# Install Trivy (single binary)
wget -qO- https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin 2>/dev/null
# Or via apt
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- 2>/dev/null
trivy --version 2>/dev/null || echo "Trivy not available, using fallback"
```

## Container Security (Feature #4)

```bash
# Scan a Docker image for OS package CVEs + secrets
trivy image --format json --quiet nginx:latest 2>/dev/null

# Scan image from a Dockerfile (build + scan)
cd /workspace && trivy image --format json --quiet $(docker build -q . 2>/dev/null) 2>/dev/null

# Scan for HIGH and CRITICAL only
trivy image --severity HIGH,CRITICAL --format json nginx:latest 2>/dev/null
```

### Parse container scan results:
```bash
trivy image --format json nginx:latest 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for result in data.get('Results', []):
    for vuln in result.get('Vulnerabilities', []):
        sev = vuln.get('Severity', '')
        if sev in ('HIGH', 'CRITICAL'):
            print(f\"{sev}: {vuln.get('PkgName')} {vuln.get('InstalledVersion')} -> {vuln.get('FixedVersion','no fix')} | {vuln.get('VulnerabilityID')} | CVSS:{vuln.get('CVSS',{}).get('nvd',{}).get('V3Score','?')}\")
            print(f\"  {vuln.get('Title','')}\")
"
```

## Filesystem / Repository Scan

```bash
# Scan cloned repo for vulnerabilities + secrets + misconfigs
trivy fs --format json --quiet /workspace 2>/dev/null

# Scan with all scanners enabled
trivy fs --scanners vuln,secret,misconfig --format json /workspace 2>/dev/null
```

## IaC Security Scanning (Feature #5)

```bash
# Terraform
trivy config --format json /workspace/terraform 2>/dev/null
trivy config --format json /workspace/infra 2>/dev/null

# Kubernetes
trivy config --format json /workspace/k8s 2>/dev/null
trivy config --format json /workspace/kubernetes 2>/dev/null

# CloudFormation
trivy config --format json /workspace/cloudformation 2>/dev/null

# Scan entire repo for all IaC configs
trivy config --format json /workspace 2>/dev/null
```

## Secrets Detection via Trivy

```bash
trivy fs --scanners secret --format json /workspace 2>/dev/null
```

## Reporting Format

For each CVE found:
```
FINDING: Container/Dependency Vulnerability
- Package: [name] v[installed]
- CVE: CVE-XXXX-XXXXX
- CVSS Score: X.X ([Critical/High])
- Fixed Version: [upgrade to X.X.X]
- Layer: [which Docker layer introduced it]
- Remediation: Update base image OR upgrade specific package
```

For IaC misconfigurations:
```
FINDING: IaC Misconfiguration
- File: [terraform file / k8s manifest]
- Rule: [e.g. AVD-AWS-0057]
- Severity: [Critical/High/Medium]
- Title: [e.g. "S3 bucket has public access"]
- Impact: [what attacker can do]
- Resolution: [exact config change needed]
```
