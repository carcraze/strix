---
name: checkov
description: Checkov — IaC security scanner for Terraform, CloudFormation, Kubernetes, Helm, ARM, Bicep, Serverless. 1000+ built-in checks. Maps to CIS benchmarks and compliance frameworks.
---

# Checkov IaC Security Scanner Playbook

Checkov is the industry standard for Infrastructure-as-Code security scanning.
Used by AWS, Google Cloud, and the majority of enterprise DevSecOps pipelines.
Covers Terraform, CloudFormation, Kubernetes, Helm, ARM, Bicep, GitHub Actions, and more.

## Installation

```bash
pip install checkov 2>/dev/null
checkov --version 2>/dev/null || echo "Checkov not available"
```

## Scanning IaC Files

### Terraform
```bash
# Scan Terraform directory
checkov -d /workspace/terraform --output json 2>/dev/null
checkov -d /workspace/infra --output json 2>/dev/null
checkov -d /workspace --framework terraform --output json 2>/dev/null

# Only HIGH and CRITICAL
checkov -d /workspace --framework terraform --output json --check CKV_AWS,CKV_GCP,CKV_AZURE 2>/dev/null
```

### Kubernetes / Helm
```bash
checkov -d /workspace/k8s --framework kubernetes --output json 2>/dev/null
checkov -d /workspace/kubernetes --output json 2>/dev/null

# Helm charts
checkov -d /workspace/charts --framework helm --output json 2>/dev/null
```

### CloudFormation
```bash
checkov -d /workspace --framework cloudformation --output json 2>/dev/null
```

### GitHub Actions / CI/CD
```bash
checkov -d /workspace/.github --framework github_actions --output json 2>/dev/null
checkov -d /workspace --framework github_actions --output json 2>/dev/null
```

### Docker
```bash
checkov -f /workspace/Dockerfile --framework dockerfile --output json 2>/dev/null
checkov -d /workspace --framework dockerfile --output json 2>/dev/null
```

### Scan Everything
```bash
# Auto-detect all IaC types in repo
checkov -d /workspace --output json 2>/dev/null
```

## Parse Results

```bash
checkov -d /workspace --output json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
results = data if isinstance(data, list) else [data]
for r in results:
    failed = r.get('results', {}).get('failed_checks', [])
    for check in failed:
        sev = check.get('check_result', {}).get('severity', 'MEDIUM')
        print(f\"{sev}: {check.get('check_id')} — {check.get('check_name')}\")
        print(f\"  File: {check.get('file_path')}:{check.get('file_line_range')}\")
        print(f\"  Resource: {check.get('resource')}\")
        print()
"
```

## Key Checks by Cloud Provider

### AWS (Terraform)
- `CKV_AWS_20` — S3 bucket has public access enabled
- `CKV_AWS_18` — S3 bucket access logging not enabled
- `CKV_AWS_2` — ALB protocol is HTTP (should be HTTPS)
- `CKV_AWS_79` — EC2 IMDSv2 not enforced (SSRF risk)
- `CKV_AWS_58` — EKS cluster secrets not encrypted
- `CKV_AWS_135` — EC2 instance has public IP assigned

### GCP (Terraform)
- `CKV_GCP_29` — GCS bucket is public
- `CKV_GCP_84` — GKE cluster uses default service account
- `CKV_GCP_25` — Cloud SQL requires SSL

### Kubernetes
- `CKV_K8S_30` — Container running as root
- `CKV_K8S_28` — Privileged container
- `CKV_K8S_8` — No liveness probe
- `CKV_K8S_13` — Memory limits not set
- `CKV_K8S_36` — Hostpath volumes used

### GitHub Actions
- `CKV_GHA_7` — Workflow has excessive permissions
- `CKV_GHA_1` — Workflow uses third-party actions without pinned commit SHA (supply chain risk)

## Reporting Format

For each IaC misconfiguration:
```
FINDING: IaC Misconfiguration
- Severity: [Critical/High/Medium/Low]
- Check ID: CKV_AWS_XXXX
- Title: [e.g. "S3 bucket has public read ACL"]
- File: [exact file path]
- Line: [line range]
- Resource: [aws_s3_bucket.my-bucket]
- Impact: [data exposure, privilege escalation, etc.]
- CIS Benchmark: [CIS AWS 2.1.x if applicable]
- Compliance: [SOC 2 CC6.x | ISO 27001 A.12.x]
- Fix:
  [exact Terraform/K8s config change]
```
