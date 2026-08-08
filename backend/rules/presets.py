"""
Preset Rule Packs for VeriAudit: SOC2, HIPAA, Procurement & Expense, Vendor NDA, and AI Governance.
"""

from typing import Dict, List, Any
from ..models.schemas import RulePack, RuleRequirement, SeverityLevel


SOC2_TYPE2_PACK = RulePack(
    id="soc2_type2",
    name="SOC 2 Type II Security & Trust Criteria",
    version="2026.1",
    description="Audits access controls, encryption, continuous monitoring, and disaster recovery according to AICPA Trust Services Criteria.",
    rules=[
        RuleRequirement(
            id="SOC2-CC6.1",
            name="Multi-Factor Authentication & Access Control",
            description="MFA must be enforced for all employees, contractors, and privileged administrative access to production systems.",
            category="Access Control",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["mfa", "multi-factor", "2fa", "two-factor", "authenticator", "sso"],
            negative_constraints=["mfa is optional", "single factor", "password only", "exempt from mfa", "no mfa"],
            positive_indicators=["enforced for all", "mandatory mfa", "mfa is required", "hardware key", "authenticator app required"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="SOC2-CC6.6",
            name="Data in Transit Encryption (TLS 1.2+)",
            description="All external communication and data in transit across public networks must use TLS 1.2 or TLS 1.3 encryption with strong cipher suites.",
            category="Cryptography",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["tls", "https", "in transit", "ssl", "cipher", "encryption in transit"],
            negative_constraints=["http only", "plaintext transit", "unencrypted external", "ssl 3.0", "tls 1.0", "tls 1.1 allowed"],
            positive_indicators=["tls 1.2", "tls 1.3", "strictly encrypted in transit", "https enforced", "hsts enabled"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="SOC2-CC6.7",
            name="Data at Rest Encryption (AES-256)",
            description="All sensitive customer data, backups, and databases at rest must be encrypted using industry-standard AES-256 or cloud KMS keys.",
            category="Cryptography",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["at rest", "aes-256", "aes 256", "kms", "disk encryption", "database encryption"],
            negative_constraints=["unencrypted database", "plaintext storage", "cleartext files", "no at-rest encryption"],
            positive_indicators=["aes-256", "aws kms", "encrypted at rest", "fips 140-2", "luks encrypted"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="SOC2-CC7.2",
            name="Audit Logging & 365-Day Retention",
            description="System, security, and administrative access logs must be immutably recorded, centralized, and retained for at least 365 days (1 year).",
            category="Monitoring & Logging",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["log", "retention", "audit trail", "siem", "cloudtrail", "datadog", "splunk", "365 days", "1 year"],
            negative_constraints=["logs deleted after 30 days", "no audit log", "unmonitored", "logs disabled", "retained for 90 days only"],
            positive_indicators=["retained for 365 days", "retained for 1 year", "immutable s3 logs", "centralized siem", "worm storage"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="SOC2-CC7.4",
            name="Annual Incident Response & DR Testing",
            description="An incident response plan and disaster recovery restoration test must be exercised and documented at least once every 12 months.",
            category="Business Continuity",
            severity=SeverityLevel.MEDIUM,
            mandatory_keywords=["incident response", "disaster recovery", "dr test", "tabletop", "simulation", "annual test", "rto", "rpo"],
            negative_constraints=["never tested", "no dr plan", "ad-hoc recovery", "last tested 2 years ago"],
            positive_indicators=["conducted annually", "annual tabletop exercise", "quarterly dr drill", "tested in q", "documented rto <"],
            min_confidence=0.75
        ),
    ]
)

HIPAA_SECURITY_PACK = RulePack(
    id="hipaa_privacy_security",
    name="HIPAA Privacy & Security Rules",
    version="2026.1",
    description="Audits electronic Protected Health Information (ePHI) handling, minimum necessary rule, Safe Harbor de-identification, and BAA governance.",
    rules=[
        RuleRequirement(
            id="HIPAA-164.312(a)",
            name="Unique User Identification & Automatic Logoff",
            description="Each workforce member accessing ePHI must have a unique identifier and workstations must automatically lock after inactivity.",
            category="Technical Safeguards",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["user id", "unique identifier", "auto logoff", "screen lock", "inactivity timer", "ephi access"],
            negative_constraints=["shared login", "generic admin account", "no session timeout", "screen never locks"],
            positive_indicators=["unique user id", "15-minute auto logoff", "individual credentials", "session timeout after 10 minutes"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="HIPAA-164.502(b)",
            name="Minimum Necessary PHI Disclosure",
            description="Workforce members and downstream systems must only access the minimum necessary PHI required to fulfill their specific clinical/operational role.",
            category="Privacy Rule",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["minimum necessary", "role-based access", "rbac", "least privilege", "phi access limits"],
            negative_constraints=["open access to all patient charts", "all staff see full records", "no role restrictions on phi"],
            positive_indicators=["role-based access control", "rbac strictly restricts", "minimum necessary standard", "compartmentalized access"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="HIPAA-164.514",
            name="Safe Harbor De-Identification for Research",
            description="All 18 direct identifiers (names, SSN, MRN, specific dates, full-face photos, IP addresses) must be removed before data is used in research/analytics.",
            category="Data Protection",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["de-identification", "safe harbor", "18 identifiers", "mrn", "anonymized", "phi stripped"],
            negative_constraints=["patient names included in export", "mrn left in analytics table", "full dob shared with researchers"],
            positive_indicators=["safe harbor method applied", "all 18 identifiers removed", "pseudonymized token replacement"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="HIPAA-164.308(b)",
            name="Business Associate Agreement (BAA) Execution",
            description="A formal, executed BAA must be signed with any third-party cloud vendor, AI sub-processor, or consultant before granting access to ePHI.",
            category="Vendor Governance",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["baa", "business associate agreement", "vendor baa", "signed baa", "sub-processor"],
            negative_constraints=["no baa signed", "vendor refused baa", "standard terms of service only", "ephi sent without baa"],
            positive_indicators=["signed baa in place", "executed business associate agreement", "baa executed on"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="HIPAA-164.404",
            name="60-Day Breach Notification Mandate",
            description="In the event of an unauthorized ePHI breach affecting 500+ individuals, written notice must be dispatched to HHS and affected patients without unreasonable delay and in no case later than 60 calendar days.",
            category="Breach Response",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["breach notification", "60 days", "hhs notification", "patient notification", "security incident"],
            negative_constraints=["notify after 90 days", "internal disclosure only", "no patient notification required"],
            positive_indicators=["notified within 60 days", "hhs reporting protocol in under 30 days", "written notice dispatched within 45 days"],
            min_confidence=0.8
        )
    ]
)

PROCUREMENT_EXPENSE_PACK = RulePack(
    id="procurement_expense",
    name="Enterprise Procurement & Expense Policy",
    version="2026.1",
    description="Audits corporate spend thresholds, dual-authorization requirements, competitive bidding, and travel expense rules.",
    rules=[
        RuleRequirement(
            id="PROC-001",
            name="Dual Authorization for Spend > $10,000",
            description="Any corporate procurement purchase or vendor contract exceeding $10,000 requires explicit documented sign-off from both the Department Head and CFO / Finance VP.",
            category="Financial Controls",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["$10,000", "cfo", "dual approval", "dual authorization", "sign-off", "finance approval", "budget owner"],
            negative_constraints=["single signature for $25k", "sole authorization by manager", "unapproved $15,000", "bypassed cfo approval"],
            positive_indicators=["signed by both department head and cfo", "dual sign-off completed", "approved by vp and cfo", "written cfo authorization"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="PROC-002",
            name="Itemized Receipts Required for Expenses > $50",
            description="Employees submitting expense reimbursements exceeding $50.00 must attach an itemized receipt showing merchant details and date.",
            category="Expense Reimbursement",
            severity=SeverityLevel.MEDIUM,
            mandatory_keywords=["receipt", "itemized", "$50", "expense claim", "reimbursement proof"],
            negative_constraints=["lost receipt approved", "unitemized bank statement only", "no receipts attached", "no proof required"],
            positive_indicators=["itemized receipt attached", "receipts verified for all items", "scanned merchant receipt uploaded"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="PROC-003",
            name="Competitive Bidding (3+ Quotes for Contracts > $50k)",
            description="Purchases exceeding $50,000 must obtain at least three independent, competitive vendor proposals unless an approved sole-source exemption is granted.",
            category="Vendor Sourcing",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["3 quotes", "three vendor quotes", "competitive bidding", "rfp", "sole-source", "$50,000"],
            negative_constraints=["single vendor selected without quotes", "no competitive bids", "sole source without justification"],
            positive_indicators=["three vendor proposals evaluated", "rfp conducted with 4 bidders", "sole-source waiver signed by legal"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="PROC-004",
            name="Commercial Air Travel Economy Class Standard",
            description="All domestic flights under 6 hours must be booked in Standard Economy. Business/First class requires prior CEO exception.",
            category="Travel Policy",
            severity=SeverityLevel.MEDIUM,
            mandatory_keywords=["flight", "economy", "first class", "business class", "airfare", "domestic flight"],
            negative_constraints=["first class booked without exception", "business class for 2-hour flight", "upgraded to first class on company card"],
            positive_indicators=["economy class ticket", "standard coach booked", "ceo exception approved for business travel"],
            min_confidence=0.8
        )
    ]
)

VENDOR_NDA_PACK = RulePack(
    id="vendor_nda_risk",
    name="Vendor NDA & Commercial Contract Risk",
    version="2026.1",
    description="Audits non-disclosure terms, confidentiality duration, liability limits, and non-solicitation clauses.",
    rules=[
        RuleRequirement(
            id="NDA-001",
            name="Confidentiality Survival Period (≥ 3 Years)",
            description="The obligation to maintain confidentiality must survive termination of the agreement for at least 3 years (or indefinitely for trade secrets).",
            category="Confidentiality",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["survival", "3 years", "three years", "confidentiality term", "termination", "trade secrets"],
            negative_constraints=["terminates immediately upon contract end", "confidentiality expires after 6 months", "1 year survival only"],
            positive_indicators=["shall survive for 3 years", "survives for a period of five (5) years", "shall survive for a period of", "five (5) years", "indefinite for trade secrets", "survive termination"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="NDA-002",
            name="Standard of Care (Reasonable Care Mandate)",
            description="Recipient must agree to protect confidential information using at least the same degree of care as its own proprietary data, but no less than reasonable care.",
            category="Standard of Care",
            severity=SeverityLevel.MEDIUM,
            mandatory_keywords=["degree of care", "reasonable care", "same care", "protect confidential information"],
            negative_constraints=["as is without liability", "no duty of care", "gross negligence only"],
            positive_indicators=["reasonable degree of care", "same degree of care it uses for its own", "commercial best efforts"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="NDA-003",
            name="Mutual Non-Solicitation (12-Month Limit)",
            description="Neither party may solicit or induce employees of the other party to terminate employment for a period not exceeding 12 months.",
            category="Restrictive Covenants",
            severity=SeverityLevel.LOW,
            mandatory_keywords=["non-solicitation", "solicit employees", "induce employment", "12 months", "non-solicit"],
            negative_constraints=["unlimited 5-year non-solicit", "unilateral non-solicitation favoring vendor only"],
            positive_indicators=["mutual non-solicitation for twelve (12) months", "neither party shall solicit", "12-month non-solicit clause"],
            min_confidence=0.8
        ),
        RuleRequirement(
            id="NDA-004",
            name="Designated Governing Law & Venue",
            description="The agreement must designate a clear state/jurisdiction governing law and neutral court venue without unilateral mandatory arbitration clauses.",
            category="Legal Governance",
            severity=SeverityLevel.MEDIUM,
            mandatory_keywords=["governing law", "jurisdiction", "laws of the state", "exclusive venue", "courts of"],
            negative_constraints=["governed by foreign secret tribunal", "unspecified jurisdiction", "no governing law clause"],
            positive_indicators=["governed by the laws of the state of", "exclusive jurisdiction of the state and federal courts"],
            min_confidence=0.8
        )
    ]
)

AI_GOVERNANCE_PACK = RulePack(
    id="ai_governance",
    name="AI Safety & Algorithmic Governance",
    version="2026.1",
    description="Audits AI model data provenance, human-in-the-loop overrides, red-teaming documentation, and hallucination safeguards.",
    rules=[
        RuleRequirement(
            id="AIGOV-001",
            name="Training Data Provenance & Consent Verification",
            description="All proprietary datasets, fine-tuning corpuses, and customer inputs must have verified commercial license provenance and explicit consent documentation.",
            category="Data Provenance",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["provenance", "license", "consent", "training data", "opt-in", "copyright clearance"],
            negative_constraints=["scraped without permission", "unknown source data", "copyrighted books ingested without license"],
            positive_indicators=["fully licensed datasets", "explicit opt-in consent gathered", "data provenance verified with audit trails"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="AIGOV-002",
            name="Human-in-the-Loop Override for Critical Actions",
            description="High-stakes actions (credit denial, account termination, clinical triage, automated refunds > $500) must require explicit human review and override capability.",
            category="Operational Controls",
            severity=SeverityLevel.CRITICAL,
            mandatory_keywords=["human-in-the-loop", "hitl", "human review", "override", "manual approval", "high-stakes"],
            negative_constraints=["fully autonomous denial without human recourse", "no human appeal", "automated termination without review"],
            positive_indicators=["human reviewer must approve", "human-in-the-loop workflow mandatory", "manual override enabled"],
            min_confidence=0.85
        ),
        RuleRequirement(
            id="AIGOV-003",
            name="Pre-Deployment Red-Teaming & Adversarial Safety Audit",
            description="Prior to production deployment, models must complete documented red-teaming for prompt injection, jailbreaks, data leakage, and toxicity.",
            category="Security & Safety",
            severity=SeverityLevel.HIGH,
            mandatory_keywords=["red-teaming", "adversarial testing", "jailbreak", "prompt injection", "toxicity benchmark", "safety evaluation"],
            negative_constraints=["deployed without safety testing", "no red-teaming conducted", "untested on adversarial prompts"],
            positive_indicators=["completed red-teaming evaluation", "safety benchmark pass rate > 99%", "adversarial jailbreak resistance verified"],
            min_confidence=0.8
        )
    ]
)

PRESET_RULE_PACKS: Dict[str, RulePack] = {
    SOC2_TYPE2_PACK.id: SOC2_TYPE2_PACK,
    HIPAA_SECURITY_PACK.id: HIPAA_SECURITY_PACK,
    PROCUREMENT_EXPENSE_PACK.id: PROCUREMENT_EXPENSE_PACK,
    VENDOR_NDA_PACK.id: VENDOR_NDA_PACK,
    AI_GOVERNANCE_PACK.id: AI_GOVERNANCE_PACK,
}


def get_rule_pack(pack_id: str) -> RulePack:
    return PRESET_RULE_PACKS.get(pack_id, SOC2_TYPE2_PACK)


def list_all_rule_packs() -> List[Dict[str, Any]]:
    return [
        {
            "id": p.id,
            "name": p.name,
            "version": p.version,
            "description": p.description,
            "rule_count": len(p.rules),
            "rules": [r.model_dump() for r in p.rules]
        }
        for p in PRESET_RULE_PACKS.values()
    ]
