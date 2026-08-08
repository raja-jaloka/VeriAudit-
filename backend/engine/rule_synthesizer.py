"""
Dynamic Rule Synthesizer: Discovers and devises tailored compliance rules
directly from analyzing the structure, domain, and clauses of any input document.
"""

import re
from typing import List, Dict, Any, Optional
from ..models.schemas import RuleRequirement, RulePack, SeverityLevel
from ..ingestion.cleaner import DocumentCleaner


class DynamicRuleSynthesizer:
    """
    Analyzes messy documents, transcripts, contracts, and policies to devise
    tailored, groundable compliance rules with specific keywords and constraints.
    """

    # Domain Pattern Matchers
    PROCUREMENT_PATTERNS = [
        ("Expenditure Authorization Threshold", "Any corporate expense or tool contract exceeding specified thresholds must have verified executive or CFO dual sign-off.", "Financial Controls", SeverityLevel.CRITICAL, ["approval", "approved", "spend", "sign-off", "cfo", "budget", "$"], ["unapproved", "single signature", "bypassed"], ["dual sign-off", "approved it", "signed the requisition"]),
        ("Itemized Receipt & Expense Justification", "All reimbursable expense submissions above threshold must provide itemized receipts detailing vendor, date, and items.", "Expense Policy", SeverityLevel.HIGH, ["receipt", "itemized", "reimburse", "claim", "$"], ["unitemized", "lost receipt", "bank statement only"], ["itemized receipt", "receipt uploaded", "merchant receipt"]),
        ("Commercial Travel Class Standards", "Business and domestic travel must follow economy coach standards unless executive exceptions are documented.", "Travel Policy", SeverityLevel.MEDIUM, ["flight", "ticket", "economy", "coach", "first class", "business class"], ["first class booked", "upgraded on company card"], ["standard coach", "economy class", "coach tickets"]),
        ("Competitive Vendor Sourcing", "Contracts exceeding sourcing thresholds must evaluate multiple independent proposals.", "Vendor Sourcing", SeverityLevel.HIGH, ["quotes", "proposals", "bidding", "vendor", "rfp"], ["single vendor without quotes", "no competitive bids"], ["three vendor proposals", "competitive quotes evaluated"]),
    ]

    SECURITY_SOC2_PATTERNS = [
        ("Multi-Factor Authentication Mandate", "Administrative access to cloud infrastructure, bastion hosts, and production systems must enforce MFA.", "Identity & Access", SeverityLevel.CRITICAL, ["mfa", "multi-factor", "2fa", "okta", "authenticator", "sso"], ["password only", "no mfa", "single factor"], ["mandatory mfa", "hardware keys", "authenticator app"]),
        ("Data in Transit Cryptography", "All external API gateways, web endpoints, and microservices must mandate TLS 1.2 or TLS 1.3 encryption.", "Cryptography", SeverityLevel.HIGH, ["tls", "https", "ssl", "in transit", "cipher"], ["http only", "unencrypted external", "plaintext transit"], ["tls 1.3", "tls 1.2", "https enforced", "hsts enabled"]),
        ("Database at Rest Encryption", "Sensitive customer data and database tables at rest must be encrypted with AES-256 or cloud KMS keys.", "Data Protection", SeverityLevel.CRITICAL, ["at rest", "aes-256", "kms", "aurora", "database", "encrypted"], ["unencrypted at rest", "plaintext storage", "unencrypted database"], ["encrypted at rest", "aws kms", "aes-256"]),
        ("Immutable Audit Log Retention", "Administrative actions, security telemetry, and access logs must be centralized and retained for at least 365 days.", "Telemetry & Logging", SeverityLevel.HIGH, ["log", "retention", "s3", "audit trail", "365 days", "1 year"], ["logs deleted", "no audit log", "unmonitored"], ["retained for 365 days", "immutable s3", "object lock"]),
    ]

    HEALTHCARE_HIPAA_PATTERNS = [
        ("Unique User ID & Terminal Timeout", "Workforce members accessing ePHI must use unique credentials with automated inactivity session lock.", "Access Safeguards", SeverityLevel.CRITICAL, ["user id", "unique identifier", "logoff", "screen lock", "inactivity"], ["shared login", "no session timeout", "screen never locks"], ["unique user id", "auto logoff", "screen lock"]),
        ("Sub-processor BAA Verification", "All third-party cloud vendors, AI transcription tools, and sub-processors with ePHI access must execute a formal BAA.", "Vendor Governance", SeverityLevel.CRITICAL, ["baa", "business associate agreement", "vendor", "cloud", "sub-processor"], ["no baa signed", "vendor refused baa"], ["signed baa in place", "executed business associate agreement"]),
        ("Safe Harbor PHI De-identification", "Patient data shared for research or analytics must remove all 18 HIPAA direct identifiers.", "Privacy Rule", SeverityLevel.CRITICAL, ["de-identification", "safe harbor", "export", "research", "phi", "identifiers"], ["patient names included in export", "mrn left in analytics"], ["safe harbor method", "anonymized", "identifiers removed"]),
        ("Timely Breach Notification", "Confirmed security breaches affecting patient records must trigger regulatory and individual notice within 60 days.", "Incident Response", SeverityLevel.HIGH, ["breach", "notification", "hhs", "incident", "60 days"], ["notify after 90 days", "internal disclosure only"], ["notified within", "hhs notification protocol"]),
    ]

    LEGAL_NDA_PATTERNS = [
        ("Confidentiality Survival Period", "Confidentiality covenants must survive contract expiration or termination for a minimum defined period (>= 3 years).", "Confidentiality", SeverityLevel.HIGH, ["survival", "survive", "confidentiality", "termination", "years"], ["terminates immediately", "expires after 6 months"], ["shall survive for a period of", "five (5) years", "indefinite for trade secrets"]),
        ("Standard of Care Obligation", "The recipient must exercise at least a reasonable degree of care to safeguard proprietary confidential materials.", "Standard of Care", SeverityLevel.MEDIUM, ["standard of care", "degree of care", "reasonable care", "protect"], ["gross negligence only", "no duty of care", "as is"], ["reasonable degree of care", "same degree of care"]),
        ("Mutual Non-Solicitation Terms", "Non-solicitation restrictions on personnel must be mutual and capped at reasonable durations (<= 12 months).", "Covenants", SeverityLevel.LOW, ["non-solicitation", "solicit", "employees", "non-solicit", "months"], ["unlimited non-solicit", "unilateral non-solicitation"], ["neither party shall solicit", "mutual non-solicitation"]),
        ("Governing Law & Jurisdiction Venue", "The agreement must specify an identifiable legal venue and governing state jurisdiction without ambiguous secret clauses.", "Legal Governance", SeverityLevel.MEDIUM, ["governing law", "jurisdiction", "laws of the state", "courts", "delaware"], ["secret tribunal", "unspecified jurisdiction"], ["governed by the laws of the state", "exclusive jurisdiction"]),
    ]

    @classmethod
    def devise_rules_from_document(cls, document_text: str, document_title: str = "Analyzed Document") -> RulePack:
        """
        Analyzes the text semantically, detects document topics and clauses,
        and constructs a tailored RulePack with calibrated keywords and test constraints.
        """
        cleaned = DocumentCleaner.clean(document_text).cleaned_text.lower()
        
        # Topic scoring
        score_procurement = sum(cleaned.count(w) for w in ["spend", "budget", "cfo", "$", "receipt", "reimburse", "flight", "contract", "vendor"])
        score_soc2 = sum(cleaned.count(w) for w in ["mfa", "tls", "aes", "kms", "cloud", "database", "encryption", "sso", "security", "s3", "logs"])
        score_hipaa = sum(cleaned.count(w) for w in ["ephi", "phi", "patient", "clinical", "hospital", "baa", "ehr", "epic", "de-identification"])
        score_nda = sum(cleaned.count(w) for w in ["confidential", "proprietary", "recipient", "disclosing", "survival", "governing law", "jurisdiction", "agreement"])

        devised_rules: List[RuleRequirement] = []
        topic_name = "General Compliance"
        pack_id = "doc_devised_rules"

        # Select primary and secondary domain patterns
        if score_procurement >= max(score_soc2, score_hipaa, score_nda, 4):
            topic_name = "Enterprise Spend & Procurement Policy"
            pack_id = "devised_procurement"
            selected_patterns = cls.PROCUREMENT_PATTERNS
        elif score_hipaa >= max(score_soc2, score_nda, 4):
            topic_name = "Clinical Health & PHI Safeguards"
            pack_id = "devised_hipaa"
            selected_patterns = cls.HEALTHCARE_HIPAA_PATTERNS
        elif score_soc2 >= max(score_nda, 4):
            topic_name = "Cloud Security & Architecture Controls"
            pack_id = "devised_soc2"
            selected_patterns = cls.SECURITY_SOC2_PATTERNS
        elif score_nda >= 4:
            topic_name = "Contractual Risk & Non-Disclosure Governance"
            pack_id = "devised_nda"
            selected_patterns = cls.LEGAL_NDA_PATTERNS
        else:
            topic_name = "Synthesized Document Rules"
            pack_id = "devised_general"
            # Combine salient rules from top topics
            selected_patterns = cls.PROCUREMENT_PATTERNS[:2] + cls.SECURITY_SOC2_PATTERNS[:2]

        rule_idx = 1
        for name, desc, category, severity, keywords, neg_constraints, pos_indicators in selected_patterns:
            # Custom calibrate keywords found in this exact document
            active_keywords = [k for k in keywords if k.lower() in cleaned] or keywords[:3]
            
            rule_id = f"RULE-DEV-{rule_idx:02d}"
            rule = RuleRequirement(
                id=rule_id,
                name=name,
                description=desc,
                category=category,
                severity=severity,
                mandatory_keywords=keywords,
                negative_constraints=neg_constraints,
                positive_indicators=pos_indicators,
                min_confidence=0.75
            )
            devised_rules.append(rule)
            rule_idx += 1

        # Also extract any bespoke rules based on explicit numerical amounts or entities in document
        money_matches = re.findall(r"\$\s*[\d,]+", document_text)
        if money_matches:
            top_amount = money_matches[0]
            devised_rules.append(
                RuleRequirement(
                    id=f"RULE-DEV-{rule_idx:02d}",
                    name=f"Documented Sign-off for Specific Figure ({top_amount})",
                    description=f"Any specific transaction or budget commitment mentioning {top_amount} must have explicit verified managerial approval.",
                    category="Bespoke Financial Control",
                    severity=SeverityLevel.HIGH,
                    mandatory_keywords=[top_amount.lower(), "approved", "signed", "budget"],
                    negative_constraints=["unapproved", "rejected", "bypassed"],
                    positive_indicators=["approved", "signed", "sign-off"],
                    min_confidence=0.8
                )
            )

        return RulePack(
            id=pack_id,
            name=f"✨ Document-Devised Rules: {topic_name}",
            version="2026.Dynamic",
            description=f"Custom compliance rules automatically analyzed and devised from '{document_title}'.",
            rules=devised_rules
        )
