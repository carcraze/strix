"""
Compliance Frameworks — Kenya & UK Markets

Maps security findings to regulatory controls for:
- Kenya: DPA 2019, CBK Cybersecurity Guidelines, Computer Misuse & Cybercrimes Act 2018
- UK: UK GDPR, Cyber Essentials Plus, ISO 27001:2022, PCI DSS v4.0, SOC 2 Type II

Each framework defines controls with:
- control_id: Official control reference
- title: Control name
- description: What the control requires
- category: Grouping for UI display
- scan_types: Which scan types can satisfy this control (sca, sast, dast, pentest, etc.)
- severity_mapping: Maps finding severities to compliance impact
- evidence_required: What constitutes passing evidence
"""

from typing import TypedDict


class ComplianceControl(TypedDict):
    control_id: str
    title: str
    description: str
    category: str
    scan_types: list[str]
    auto_checkable: bool  # Can Zentinel automatically verify this?


class ComplianceFramework(TypedDict):
    id: str
    name: str
    short_name: str
    region: str  # "KE" | "UK" | "GLOBAL"
    description: str
    authority: str
    penalty_info: str
    controls: list[ComplianceControl]


# ══════════════════════════════════════════════════════════════════════════════
# KENYA FRAMEWORKS
# ══════════════════════════════════════════════════════════════════════════════

KENYA_DPA_2019: ComplianceFramework = {
    "id": "ke_dpa_2019",
    "name": "Kenya Data Protection Act 2019",
    "short_name": "KE-DPA",
    "region": "KE",
    "description": "Governs how organizations collect, process, and store personal data of individuals in Kenya. Enforced by the Office of the Data Protection Commissioner (ODPC).",
    "authority": "Office of the Data Protection Commissioner (ODPC)",
    "penalty_info": "Up to KES 5M or 1% of annual turnover. Criminal penalties for egregious breaches. Registration required for orgs with >10 employees or >KES 5M turnover.",
    "controls": [
        {"control_id": "DPA-S25", "title": "Data Security Obligation", "description": "Implement appropriate technical and organizational measures to prevent unauthorized access, disclosure, or loss of personal data.", "category": "Data Security", "scan_types": ["dast", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "DPA-S26", "title": "Security of Processing", "description": "Ensure confidentiality, integrity, and availability of processing systems. Implement encryption, pseudonymization where appropriate.", "category": "Data Security", "scan_types": ["dast", "pentest", "sast", "secrets"], "auto_checkable": True},
        {"control_id": "DPA-S27", "title": "Breach Notification (72h)", "description": "Notify ODPC within 72 hours of becoming aware of a data breach. Notify affected data subjects without undue delay.", "category": "Incident Response", "scan_types": [], "auto_checkable": False},
        {"control_id": "DPA-S28", "title": "Data Protection Impact Assessment", "description": "Conduct DPIA for high-risk processing activities before commencing processing.", "category": "Governance", "scan_types": [], "auto_checkable": False},
        {"control_id": "DPA-S30", "title": "Data Minimization", "description": "Collect only personal data that is adequate, relevant, and necessary for the specified purpose.", "category": "Data Handling", "scan_types": ["sast", "pentest"], "auto_checkable": True},
        {"control_id": "DPA-S41", "title": "Cross-border Transfer Safeguards", "description": "Transfer personal data outside Kenya only with adequate safeguards or ODPC approval.", "category": "Data Transfer", "scan_types": ["sast"], "auto_checkable": True},
        {"control_id": "DPA-S42", "title": "Data Controller Registration", "description": "Register with ODPC as a data controller or processor if meeting threshold criteria.", "category": "Governance", "scan_types": [], "auto_checkable": False},
        {"control_id": "DPA-S43", "title": "Consent Management", "description": "Obtain explicit, informed consent before processing personal data. Consent must be freely given and withdrawable.", "category": "Consent", "scan_types": ["dast", "pentest"], "auto_checkable": True},
        {"control_id": "DPA-S44", "title": "Access Control & Authentication", "description": "Implement access controls ensuring only authorized personnel can access personal data.", "category": "Access Control", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "DPA-S45", "title": "Audit Trail & Logging", "description": "Maintain records of processing activities and audit trails for accountability.", "category": "Monitoring", "scan_types": ["sast", "pentest"], "auto_checkable": True},
    ],
}

KENYA_CBK_CYBER: ComplianceFramework = {
    "id": "ke_cbk_cyber",
    "name": "CBK Guidance Note on Cybersecurity",
    "short_name": "CBK-CYBER",
    "region": "KE",
    "description": "Central Bank of Kenya cybersecurity guidance for all licensed banking institutions. Requires comprehensive cybersecurity programs including vulnerability management, penetration testing, and incident response.",
    "authority": "Central Bank of Kenya (CBK)",
    "penalty_info": "Regulatory sanctions, license restrictions, or revocation for non-compliance. Mandatory cyber incident reporting.",
    "controls": [
        {"control_id": "CBK-3.1", "title": "Cybersecurity Governance", "description": "Board-level oversight of cybersecurity risk. Appoint CISO or equivalent. Annual cybersecurity strategy review.", "category": "Governance", "scan_types": [], "auto_checkable": False},
        {"control_id": "CBK-3.2", "title": "Risk Assessment", "description": "Conduct regular cybersecurity risk assessments. Identify critical assets and threats.", "category": "Risk Management", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CBK-4.1", "title": "Vulnerability Management", "description": "Implement continuous vulnerability scanning. Prioritize vulnerabilities by risk. Patch critical vulns within 14 days.", "category": "Vulnerability Management", "scan_types": ["dast", "sca", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "CBK-4.2", "title": "Penetration Testing", "description": "Conduct annual penetration tests by qualified personnel. Red team exercises for critical systems.", "category": "Security Testing", "scan_types": ["pentest"], "auto_checkable": True},
        {"control_id": "CBK-4.3", "title": "Patch Management", "description": "Maintain patching schedule. Critical patches within 14 days. All patches within 30 days.", "category": "Vulnerability Management", "scan_types": ["sca"], "auto_checkable": True},
        {"control_id": "CBK-5.1", "title": "Access Control & Authentication", "description": "Multi-factor authentication for privileged access. Principle of least privilege. Regular access reviews.", "category": "Access Control", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "CBK-5.2", "title": "Network Security", "description": "Segment networks. Deploy firewalls, IDS/IPS. Monitor network traffic for anomalies.", "category": "Network Security", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CBK-5.3", "title": "Data Encryption", "description": "Encrypt data in transit and at rest. TLS 1.2+ for all external communications.", "category": "Cryptography", "scan_types": ["dast", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "CBK-6.1", "title": "Incident Response Plan", "description": "Documented IR plan. Regular drills. Report cyber incidents to CBK within 24 hours.", "category": "Incident Response", "scan_types": [], "auto_checkable": False},
        {"control_id": "CBK-6.2", "title": "Security Monitoring & Logging", "description": "24/7 security monitoring. Centralized log management. Retain logs for minimum 2 years.", "category": "Monitoring", "scan_types": ["sast", "pentest"], "auto_checkable": True},
        {"control_id": "CBK-7.1", "title": "Third-Party Risk Management", "description": "Assess cybersecurity posture of third parties. Include security clauses in contracts.", "category": "Supply Chain", "scan_types": ["sca"], "auto_checkable": True},
        {"control_id": "CBK-7.2", "title": "Secure Software Development", "description": "Implement secure SDLC. Code reviews, SAST/DAST testing before production deployment.", "category": "Secure Development", "scan_types": ["sast", "sca", "dast"], "auto_checkable": True},
    ],
}

KENYA_CMCA_2018: ComplianceFramework = {
    "id": "ke_cmca_2018",
    "name": "Computer Misuse & Cybercrimes Act 2018",
    "short_name": "KE-CMCA",
    "region": "KE",
    "description": "Kenya's primary cybercrime legislation. Criminalizes unauthorized access, data interference, cyber espionage, and requires protection of critical information infrastructure.",
    "authority": "National Computer and Cybercrimes Coordination Committee (NC4)",
    "penalty_info": "Fines up to KES 20M and/or imprisonment up to 20 years depending on offense. Mandatory incident reporting for CII operators.",
    "controls": [
        {"control_id": "CMCA-S4", "title": "Unauthorized Access Prevention", "description": "Implement measures to prevent unauthorized access to computer systems. Authentication controls, access management.", "category": "Access Control", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "CMCA-S5", "title": "Access with Intent Prevention", "description": "Prevent unauthorized access intended to commit further offenses. Detect and block privilege escalation attempts.", "category": "Access Control", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CMCA-S16", "title": "Data Interference Prevention", "description": "Protect against unauthorized modification, deletion, or damage to computer data.", "category": "Data Integrity", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "CMCA-S17", "title": "System Interference Prevention", "description": "Prevent disruption or denial of access to computer systems (DDoS protection, availability controls).", "category": "Availability", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CMCA-S22", "title": "Cybersquatting Prevention", "description": "Protect domain integrity. Monitor for unauthorized domain registrations mimicking legitimate services.", "category": "Brand Protection", "scan_types": ["dast"], "auto_checkable": True},
        {"control_id": "CMCA-S30", "title": "Employee Access Management", "description": "Employees must relinquish access codes upon termination. Implement offboarding procedures.", "category": "Access Control", "scan_types": ["sast"], "auto_checkable": True},
        {"control_id": "CMCA-S35", "title": "Critical Infrastructure Protection", "description": "Operators of CII must implement enhanced security measures and report incidents to NC4.", "category": "CII Protection", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CMCA-S36", "title": "Cyber Threat Reporting", "description": "Report cyber threats and incidents to KE-CIRT/CC. Cooperate with investigations.", "category": "Incident Response", "scan_types": [], "auto_checkable": False},
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# UK FRAMEWORKS
# ══════════════════════════════════════════════════════════════════════════════

UK_GDPR: ComplianceFramework = {
    "id": "uk_gdpr",
    "name": "UK General Data Protection Regulation",
    "short_name": "UK-GDPR",
    "region": "UK",
    "description": "UK's data protection regulation post-Brexit. Requires organizations processing UK residents' data to implement appropriate technical and organizational security measures.",
    "authority": "Information Commissioner's Office (ICO)",
    "penalty_info": "Up to £17.5M or 4% of global annual turnover (whichever is higher). ICO can issue enforcement notices, reprimands, and suspend data processing.",
    "controls": [
        {"control_id": "GDPR-A5", "title": "Data Processing Principles", "description": "Process data lawfully, fairly, transparently. Purpose limitation, data minimization, accuracy, storage limitation.", "category": "Data Principles", "scan_types": ["sast"], "auto_checkable": True},
        {"control_id": "GDPR-A25", "title": "Data Protection by Design", "description": "Implement technical measures (pseudonymization, encryption) at the design stage. Default to minimum data processing.", "category": "Security by Design", "scan_types": ["sast", "dast", "pentest"], "auto_checkable": True},
        {"control_id": "GDPR-A30", "title": "Records of Processing", "description": "Maintain records of processing activities including purposes, categories, recipients, and safeguards.", "category": "Governance", "scan_types": [], "auto_checkable": False},
        {"control_id": "GDPR-A32", "title": "Security of Processing", "description": "Implement encryption, pseudonymization, ensure confidentiality/integrity/availability, regular testing of security measures.", "category": "Data Security", "scan_types": ["dast", "pentest", "sast", "secrets"], "auto_checkable": True},
        {"control_id": "GDPR-A33", "title": "Breach Notification (72h)", "description": "Notify ICO within 72 hours of awareness of a personal data breach. Document all breaches.", "category": "Incident Response", "scan_types": [], "auto_checkable": False},
        {"control_id": "GDPR-A35", "title": "Data Protection Impact Assessment", "description": "Conduct DPIA for high-risk processing before it begins.", "category": "Governance", "scan_types": [], "auto_checkable": False},
        {"control_id": "GDPR-A44", "title": "International Transfer Safeguards", "description": "Transfer data outside UK only with adequacy decision, SCCs, or BCRs in place.", "category": "Data Transfer", "scan_types": ["sast"], "auto_checkable": True},
    ],
}

UK_CYBER_ESSENTIALS: ComplianceFramework = {
    "id": "uk_cyber_essentials",
    "name": "Cyber Essentials Plus",
    "short_name": "CE+",
    "region": "UK",
    "description": "NCSC-backed certification scheme. Five technical controls that protect against the most common internet-based threats. Required for UK government contracts involving personal data.",
    "authority": "National Cyber Security Centre (NCSC) / IASME",
    "penalty_info": "No direct fines, but required for UK gov contracts. Failure means loss of contract eligibility. MFA is now an auto-fail criterion (April 2026).",
    "controls": [
        {"control_id": "CE-1", "title": "Firewalls & Internet Gateways", "description": "Configure firewalls on all devices. Block unnecessary inbound connections. Change default credentials on network equipment.", "category": "Boundary Security", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "CE-2", "title": "Secure Configuration", "description": "Remove/disable unnecessary software, accounts, and services. Change default passwords. Disable autorun.", "category": "Secure Configuration", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "CE-3", "title": "Security Update Management", "description": "Apply critical/high patches within 14 days of release. Remove unsupported software. Enable automatic updates where possible.", "category": "Patch Management", "scan_types": ["sca", "dast"], "auto_checkable": True},
        {"control_id": "CE-4", "title": "User Access Control", "description": "Control access to data via user accounts. Use MFA where available (AUTO-FAIL if not implemented). Principle of least privilege.", "category": "Access Control", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "CE-5", "title": "Malware Protection", "description": "Use anti-malware software or application allow-listing. Sandboxing for email attachments. Restrict macros.", "category": "Malware Defence", "scan_types": ["sast", "sca"], "auto_checkable": True},
    ],
}

UK_ISO_27001: ComplianceFramework = {
    "id": "uk_iso_27001",
    "name": "ISO 27001:2022",
    "short_name": "ISO-27001",
    "region": "UK",
    "description": "International standard for information security management systems (ISMS). 93 controls across organizational, people, physical, and technological domains.",
    "authority": "ISO / UKAS-accredited certification bodies",
    "penalty_info": "No direct fines. Loss of certification affects contracts, insurance, and reputation. Auditors expect annual penetration testing evidence.",
    "controls": [
        {"control_id": "A.5.15", "title": "Access Control Policy", "description": "Establish and implement access control rules based on business and security requirements.", "category": "Access Control", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "A.5.23", "title": "Cloud Services Security", "description": "Establish processes for acquisition, use, management and exit of cloud services.", "category": "Cloud Security", "scan_types": ["dast", "pentest"], "auto_checkable": True},
        {"control_id": "A.8.3", "title": "Information Access Restriction", "description": "Access to information and application functions restricted per access control policy.", "category": "Access Control", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "A.8.5", "title": "Secure Authentication", "description": "Secure authentication technologies and procedures. MFA for sensitive systems.", "category": "Authentication", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "A.8.8", "title": "Technical Vulnerability Management", "description": "Identify, evaluate, and address technical vulnerabilities in a timely manner.", "category": "Vulnerability Management", "scan_types": ["sca", "dast", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "A.8.9", "title": "Configuration Management", "description": "Configurations of hardware, software, services shall be established, documented, and maintained.", "category": "Secure Configuration", "scan_types": ["dast", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "A.8.12", "title": "Data Leakage Prevention", "description": "Apply DLP measures to systems, networks, and other devices that process, store, or transmit sensitive info.", "category": "Data Protection", "scan_types": ["sast", "secrets", "pentest"], "auto_checkable": True},
        {"control_id": "A.8.20", "title": "Network Security", "description": "Networks and network devices secured, managed, and controlled to protect information.", "category": "Network Security", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "A.8.24", "title": "Use of Cryptography", "description": "Define and implement rules for effective use of cryptography including key management.", "category": "Cryptography", "scan_types": ["dast", "pentest", "sast"], "auto_checkable": True},
        {"control_id": "A.8.25", "title": "Secure Development Lifecycle", "description": "Rules for secure development of software and systems established and applied.", "category": "Secure Development", "scan_types": ["sast", "sca"], "auto_checkable": True},
        {"control_id": "A.8.28", "title": "Secure Coding", "description": "Secure coding principles applied to software development.", "category": "Secure Development", "scan_types": ["sast", "sca"], "auto_checkable": True},
        {"control_id": "A.8.29", "title": "Security Testing", "description": "Security testing processes defined and implemented in the development lifecycle.", "category": "Security Testing", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
    ],
}

UK_PCI_DSS: ComplianceFramework = {
    "id": "uk_pci_dss",
    "name": "PCI DSS v4.0",
    "short_name": "PCI-DSS",
    "region": "UK",
    "description": "Payment Card Industry Data Security Standard. Required for all organizations that store, process, or transmit cardholder data. Mandatory quarterly scans and annual penetration testing.",
    "authority": "PCI Security Standards Council / Acquiring Banks",
    "penalty_info": "Fines £5K-£100K per month of non-compliance. Loss of ability to process card payments. Liability for fraud losses.",
    "controls": [
        {"control_id": "PCI-1", "title": "Network Security Controls", "description": "Install and maintain network security controls (firewalls). Restrict inbound/outbound traffic to CDE.", "category": "Network Security", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "PCI-2", "title": "Secure Configuration", "description": "Apply secure configurations to all system components. Change vendor defaults. Remove unnecessary functionality.", "category": "Secure Configuration", "scan_types": ["pentest", "dast", "sast"], "auto_checkable": True},
        {"control_id": "PCI-3", "title": "Protect Stored Account Data", "description": "Protect stored account data with encryption. Mask PAN when displayed. Render unreadable.", "category": "Data Protection", "scan_types": ["sast", "pentest", "secrets"], "auto_checkable": True},
        {"control_id": "PCI-4", "title": "Encrypt Transmission", "description": "Protect cardholder data with strong cryptography during transmission over public networks.", "category": "Cryptography", "scan_types": ["dast", "pentest"], "auto_checkable": True},
        {"control_id": "PCI-5", "title": "Malware Protection", "description": "Protect all systems and networks from malicious software.", "category": "Malware Defence", "scan_types": ["sca", "sast"], "auto_checkable": True},
        {"control_id": "PCI-6", "title": "Secure Systems & Software", "description": "Develop and maintain secure systems and software. Address vulnerabilities via secure SDLC.", "category": "Secure Development", "scan_types": ["sast", "sca", "dast", "pentest"], "auto_checkable": True},
        {"control_id": "PCI-7", "title": "Restrict Access by Need-to-Know", "description": "Restrict access to cardholder data by business need to know.", "category": "Access Control", "scan_types": ["pentest", "sast"], "auto_checkable": True},
        {"control_id": "PCI-8", "title": "Identify & Authenticate Users", "description": "Identify users and authenticate access to system components. MFA for CDE access.", "category": "Authentication", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "PCI-10", "title": "Log & Monitor Access", "description": "Log and monitor all access to system components and cardholder data.", "category": "Monitoring", "scan_types": ["sast", "pentest"], "auto_checkable": True},
        {"control_id": "PCI-11", "title": "Test Security Regularly", "description": "Quarterly ASV scans. Annual penetration tests. Wireless analyser scans.", "category": "Security Testing", "scan_types": ["pentest", "dast"], "auto_checkable": True},
        {"control_id": "PCI-12", "title": "Security Policy", "description": "Maintain a policy that addresses information security for all personnel.", "category": "Governance", "scan_types": [], "auto_checkable": False},
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# REGISTRY
# ══════════════════════════════════════════════════════════════════════════════

ALL_FRAMEWORKS: dict[str, ComplianceFramework] = {
    "ke_dpa_2019": KENYA_DPA_2019,
    "ke_cbk_cyber": KENYA_CBK_CYBER,
    "ke_cmca_2018": KENYA_CMCA_2018,
    "uk_gdpr": UK_GDPR,
    "uk_cyber_essentials": UK_CYBER_ESSENTIALS,
    "uk_iso_27001": UK_ISO_27001,
    "uk_pci_dss": UK_PCI_DSS,
}

KENYA_FRAMEWORKS = ["ke_dpa_2019", "ke_cbk_cyber", "ke_cmca_2018"]
UK_FRAMEWORKS = ["uk_gdpr", "uk_cyber_essentials", "uk_iso_27001", "uk_pci_dss"]


def get_frameworks_by_region(region: str) -> list[ComplianceFramework]:
    """Get all frameworks for a region ('KE', 'UK', or 'ALL')."""
    if region == "ALL":
        return list(ALL_FRAMEWORKS.values())
    return [fw for fw in ALL_FRAMEWORKS.values() if fw["region"] == region]


def map_finding_to_controls(finding_scan_type: str, finding_severity: str) -> list[dict]:
    """
    Given a finding's scan type and severity, return all compliance controls
    that this finding is relevant to.
    """
    matches = []
    for fw_id, fw in ALL_FRAMEWORKS.items():
        for control in fw["controls"]:
            if finding_scan_type in control["scan_types"]:
                matches.append({
                    "framework_id": fw_id,
                    "framework_name": fw["short_name"],
                    "control_id": control["control_id"],
                    "control_title": control["title"],
                    "category": control["category"],
                    "impact": "fail" if finding_severity in ("critical", "high") else "warning",
                })
    return matches


def calculate_compliance_score(framework_id: str, open_issues: list[dict]) -> dict:
    """
    Calculate compliance score for a framework given the org's open issues.
    Returns { score: int, passing: int, failing: int, warning: int, controls: [...] }
    """
    fw = ALL_FRAMEWORKS.get(framework_id)
    if not fw:
        return {"score": 0, "passing": 0, "failing": 0, "warning": 0, "controls": []}

    controls_status = []
    for control in fw["controls"]:
        if not control["auto_checkable"]:
            # Manual controls — assume passing unless explicitly failed
            controls_status.append({**control, "status": "manual", "issues": []})
            continue

        # Find open issues that map to this control's scan types
        relevant_issues = [
            i for i in open_issues
            if i.get("scan_type") in control["scan_types"]
        ]

        if not relevant_issues:
            controls_status.append({**control, "status": "passing", "issues": []})
        elif any(i.get("severity") in ("critical", "high") for i in relevant_issues):
            controls_status.append({**control, "status": "failing", "issues": relevant_issues[:5]})
        else:
            controls_status.append({**control, "status": "warning", "issues": relevant_issues[:3]})

    auto_controls = [c for c in controls_status if c["status"] != "manual"]
    passing = sum(1 for c in auto_controls if c["status"] == "passing")
    failing = sum(1 for c in auto_controls if c["status"] == "failing")
    warning = sum(1 for c in auto_controls if c["status"] == "warning")
    total = len(auto_controls) if auto_controls else 1

    score = int((passing / total) * 100) if total > 0 else 100

    return {
        "score": score,
        "passing": passing,
        "failing": failing,
        "warning": warning,
        "total_controls": len(fw["controls"]),
        "auto_checkable": len(auto_controls),
        "controls": controls_status,
    }
