from enum import Enum
from dataclasses import dataclass, field

class ScanType(str, Enum):
    QUICK      = "quick"        # $49 one-time / all subscription plans
    WEB_API    = "web_api"      # $99 one-time / all subscription plans
    FULL_STACK = "full_stack"   # $199 one-time / Growth+ subscription
    COMPLIANCE = "compliance"   # $299 one-time / Scale+ subscription
    DEEP       = "deep"         # subscription plans — max coverage, all specialists

@dataclass
class ScanTypeConfig:
    label: str
    scan_mode: str              # 'quick' | 'deep'
    allow_repos: bool           # False = blackbox domain only, True = whitebox
    max_domains: int
    max_repos: int
    generate_pdf: bool
    compliance_report: bool
    context_fields: list[str]   # which context fields to show in wizard Step 3
    subscription_plans: list[str]  # plans that can run this via subscription

SCAN_CONFIGS: dict[ScanType, ScanTypeConfig] = {
    ScanType.DEEP: ScanTypeConfig(
        label="Deep Scan",
        scan_mode="deep",
        allow_repos=True,
        max_domains=9999,
        max_repos=9999,
        generate_pdf=True,
        compliance_report=True,
        context_fields=["app_description", "tech_stack", "auth_details", "api_endpoints", "sensitive_data", "testing_focus"],
        subscription_plans=["growth", "scale", "enterprise"],
    ),
    ScanType.QUICK: ScanTypeConfig(
        label="Quick Scan",
        scan_mode="quick",
        allow_repos=False,
        max_domains=1,
        max_repos=0,
        generate_pdf=True,
        compliance_report=False,
        context_fields=["app_description"],
        subscription_plans=["starter", "growth", "scale", "enterprise"],
    ),
    ScanType.WEB_API: ScanTypeConfig(
        label="Full Web & API Scan",
        scan_mode="deep",
        allow_repos=False,
        max_domains=1,
        max_repos=0,
        generate_pdf=True,
        compliance_report=False,
        context_fields=["app_description", "auth_details", "api_endpoints"],
        subscription_plans=["starter", "growth", "scale", "enterprise"],
    ),
    ScanType.FULL_STACK: ScanTypeConfig(
        label="Full Stack Scan",
        scan_mode="deep",
        allow_repos=True,
        max_domains=1,
        max_repos=1,
        generate_pdf=True,
        compliance_report=False,
        context_fields=["app_description", "tech_stack", "auth_details", "sensitive_data", "testing_focus"],
        subscription_plans=["growth", "scale", "enterprise"],
    ),
    ScanType.COMPLIANCE: ScanTypeConfig(
        label="Compliance Report",
        scan_mode="deep",
        allow_repos=True,
        max_domains=1,
        max_repos=1,
        generate_pdf=True,
        compliance_report=True,
        context_fields=["compliance_framework", "app_description", "tech_stack", "auth_details", "sensitive_data", "testing_focus"],
        subscription_plans=["scale", "enterprise"],
    ),
}

# ── PLAN PERMISSION MATRIX ───────────────────────────────────────
# 'free' = cancelled subscription, no active plan
# 'starter' = $149/mo paid plan (3 scans/month limit)
# Growth/Scale = unlimited scans

PLAN_SCAN_PERMISSIONS: dict[str, dict] = {
    "free": {
        "allowed_types": [],         # no scans — must buy credit or resubscribe
        "scan_mode": "quick",
        "monthly_limit": 0,
        "max_domains_per_scan": 0,
        "max_repos_per_scan": 0,
    },
    "starter": {
        "allowed_types": [ScanType.QUICK, ScanType.WEB_API],
        "scan_mode": "quick",
        "monthly_limit": 3,
        "max_domains_per_scan": 1,
        "max_repos_per_scan": 1,
    },
    "growth": {
        "allowed_types": [ScanType.QUICK, ScanType.WEB_API, ScanType.FULL_STACK, ScanType.DEEP],
        "scan_mode": "deep",
        "monthly_limit": None,       # unlimited
        "max_domains_per_scan": 5,
        "max_repos_per_scan": 15,
    },
    "scale": {
        "allowed_types": [ScanType.QUICK, ScanType.WEB_API, ScanType.FULL_STACK, ScanType.COMPLIANCE, ScanType.DEEP],
        "scan_mode": "deep",
        "monthly_limit": None,
        "max_domains_per_scan": 15,
        "max_repos_per_scan": 50,
    },
    "enterprise": {
        "allowed_types": [ScanType.QUICK, ScanType.WEB_API, ScanType.FULL_STACK, ScanType.COMPLIANCE, ScanType.DEEP],
        "scan_mode": "deep",
        "monthly_limit": None,
        "max_domains_per_scan": 9999,
        "max_repos_per_scan": 9999,
    },
}
