"""
Universal Dynamic Rule Synthesizer.
Discovers and devises tailored compliance & quality rules directly from analyzing
ANY document type: School Lesson Plans, Literature/Books, Scientific Research,
Operational Manuals/Recipes, HR Handbooks, and Legal/Financial Policies.
"""

import re
from typing import List, Dict, Any, Optional
from ..models.schemas import RuleRequirement, RulePack, SeverityLevel
from ..ingestion.cleaner import DocumentCleaner


class DynamicRuleSynthesizer:
    """
    Universal rule generator that analyzes any arbitrary text domain.
    """

    # Domain 1: Education, Lesson Plans & Course Syllabi
    EDUCATION_PATTERNS = [
        ("Pedagogical Learning Objective Mandate", "The educational plan must state explicit, measurable student learning goals or conceptual mastery outcomes.", "Learning Objectives", SeverityLevel.CRITICAL, ["objective", "goal", "students will", "understand", "learn", "mastery", "outcomes"], ["no learning goal", "unspecified outcome"], ["students will be able to", "learning objective", "master"]),
        ("Classroom Timing & Duration Breakdown", "The lesson structure must allocate clear time segments (minutes/hours) for introduction, instruction, activity, and review.", "Classroom Management", SeverityLevel.HIGH, ["minutes", "time", "duration", "period", "schedule", "breakdown"], ["unplanned timing", "no duration specified"], ["15 minutes", "30 minutes", "45 minutes", "phase breakdown"]),
        ("Prerequisite Knowledge & Target Audience", "The syllabus must define the target grade level, prerequisite concepts, or required prior knowledge.", "Pedagogical Structure", SeverityLevel.MEDIUM, ["prerequisite", "grade", "prior knowledge", "target audience", "level"], ["unspecified grade level", "no prerequisites stated"], ["prerequisites:", "grade 9", "grade 10", "grade 11", "grade 12", "introductory"]),
        ("Measurable Assessment Rubric & Deliverable", "The curriculum must include specific homework, quizzes, rubric criteria, or project deliverables to evaluate student performance.", "Student Assessment", SeverityLevel.HIGH, ["homework", "assignment", "quiz", "rubric", "exam", "deliverable", "grading"], ["no assessment method", "ungraded without deliverable"], ["homework assignment", "rubric criteria", "quiz on chapter", "project submission"]),
    ]

    # Domain 2: Books, Literature, Scripts & Story Excerpts
    LITERATURE_PATTERNS = [
        ("Protagonist & Character Motivation Grounding", "The narrative excerpt must ground identifiable characters with clear motivations, actions, or dialogue attribution.", "Characterization", SeverityLevel.HIGH, ["character", "protagonist", "said", "replied", "whispered", "motivation", "thought"], ["unattributed dialogue", "anonymous narrator without voice"], ["replied", "said", "observed", "exclaimed"]),
        ("Spatial & Temporal Setting Consistency", "The literary scene must establish a verifiable setting (place, environment, atmosphere, or historical time period).", "Setting & Atmosphere", SeverityLevel.MEDIUM, ["room", "house", "garden", "city", "street", "summer", "night", "morning", "century"], ["ambiguous spacetime", "unplaced void"], ["in the garden", "mansion", "at dusk", "new york", "london"]),
        ("Thematic Conflict & Plot Progression", "The excerpt must introduce or resolve a dramatic, ideological, interpersonal, or internal conflict.", "Narrative Arc", SeverityLevel.HIGH, ["conflict", "struggle", "tension", "argument", "discovered", "concluded", "realized"], ["static non-event", "aimless description"], ["realized that", "suddenly", "tension rose", "confronted"]),
        ("Literary Device & Verifiable Motif Quotations", "The text must ground key symbolic motifs, metaphors, or notable dialogue through exact textual evidence.", "Literary Analysis", SeverityLevel.MEDIUM, ["symbol", "metaphor", "theme", "motif", "whispered", "gazed"], ["unsupported thematic claim", "hallucinated symbolism"], ["gazed at", "symbolized by", "murmured"]),
    ]

    # Domain 3: Scientific Research Papers & Engineering Specs
    RESEARCH_PATTERNS = [
        ("Explicit Hypothesis & Problem Statement", "The research study must state a testable scientific hypothesis or engineering problem definition.", "Research Formulation", SeverityLevel.CRITICAL, ["hypothesis", "problem", "we propose", "investigate", "question", "objective"], ["unclear hypothesis", "unsubstantiated premise"], ["we hypothesize that", "our objective is to", "in this paper we propose"]),
        ("Reproducible Methodology & Data Pipeline", "The methodology must specify exact datasets, parameters, algorithms, or experimental procedures.", "Methodology", SeverityLevel.HIGH, ["dataset", "algorithm", "method", "procedure", "parameters", "sample size", "pipeline"], ["unreproducible method", "missing dataset description"], ["using the dataset", "experimental setup", "parameters were set to"]),
        ("Quantitative Benchmark Metrics & Baseline", "Conclusions must be validated with quantitative metrics (accuracy, latency, F1-score, p-value, or speedup) against a baseline.", "Experimental Results", SeverityLevel.CRITICAL, ["accuracy", "precision", "baseline", "performance", "%", "latency", "benchmark", "p <"], ["anecdotal claim without metrics", "untested assertions"], ["achieved accuracy of", "outperformed baseline by", "p < 0.05"]),
    ]

    # Domain 4: Operational Manuals, Procedures & Cooking Recipes
    RECIPE_MANUAL_PATTERNS = [
        ("Required Ingredients & Materials Specification", "The procedure must explicitly list all necessary ingredients, components, tools, or equipment with quantities.", "Bill of Materials", SeverityLevel.CRITICAL, ["ingredients", "materials", "equipment", "grams", "cups", "tools", "required"], ["unlisted ingredient", "missing tool requirement"], ["ingredients:", "2 cups", "500g", "tools required"]),
        ("Sequential Step-by-Step Milestones", "The instructions must follow an ordered chronological sequence with numbered milestones or action phases.", "Procedural Execution", SeverityLevel.HIGH, ["step 1", "step 2", "first", "next", "then", "finally", "preheat", "mix"], ["unordered steps", "circular instruction"], ["step 1:", "step 2:", "first,", "next,"]),
        ("Critical Duration & Temperature Constraints", "The guide must specify exact time durations (minutes/hours) and environmental/thermal parameters (degrees, RPM, PSI).", "Process Parameters", SeverityLevel.CRITICAL, ["minutes", "hours", "°c", "°f", "temperature", "heat", "bake", "cool", "rpm"], ["unspecified duration", "vague cook time"], ["bake at 350°f", "for 25 minutes", "cool for 1 hour"]),
        ("Safety & Quality Control Warnings", "The manual must highlight cross-contamination risks, allergen notices, mechanical hazards, or quality criteria.", "Safety & Quality", SeverityLevel.HIGH, ["warning", "caution", "safety", "allergen", "hot", "hazard", "avoid"], ["unsafe handling", "ignored safety protocol"], ["caution:", "wear gloves", "allergen warning"]),
    ]

    # Domain 5: Procurement & Finance
    PROCUREMENT_PATTERNS = [
        ("Expenditure Authorization Threshold", "Any corporate expense or tool contract exceeding specified thresholds must have verified executive or CFO dual sign-off.", "Financial Controls", SeverityLevel.CRITICAL, ["approval", "approved", "spend", "sign-off", "cfo", "budget", "$"], ["unapproved", "single signature", "bypassed"], ["dual sign-off", "approved it", "signed the requisition"]),
        ("Itemized Receipt & Expense Justification", "All reimbursable expense submissions above threshold must provide itemized receipts detailing vendor, date, and items.", "Expense Policy", SeverityLevel.HIGH, ["receipt", "itemized", "reimburse", "claim", "$"], ["unitemized", "lost receipt", "bank statement only"], ["itemized receipt", "receipt uploaded", "merchant receipt"]),
        ("Commercial Travel Class Standards", "Business and domestic travel must follow economy coach standards unless executive exceptions are documented.", "Travel Policy", SeverityLevel.MEDIUM, ["flight", "ticket", "economy", "coach", "first class", "business class"], ["first class booked", "upgraded on company card"], ["standard coach", "economy class", "coach tickets"]),
        ("Competitive Vendor Sourcing", "Contracts exceeding sourcing thresholds must evaluate multiple independent proposals.", "Vendor Sourcing", SeverityLevel.HIGH, ["quotes", "proposals", "bidding", "vendor", "rfp"], ["single vendor without quotes", "no competitive bids"], ["three vendor proposals", "competitive quotes evaluated"]),
    ]

    # Domain 6: SOC2 & Cloud Security
    SECURITY_SOC2_PATTERNS = [
        ("Multi-Factor Authentication Mandate", "Administrative access to cloud infrastructure, bastion hosts, and production systems must enforce MFA.", "Identity & Access", SeverityLevel.CRITICAL, ["mfa", "multi-factor", "2fa", "okta", "authenticator", "sso"], ["password only", "no mfa", "single factor"], ["mandatory mfa", "hardware keys", "authenticator app"]),
        ("Data in Transit Cryptography", "All external API gateways, web endpoints, and microservices must mandate TLS 1.2 or TLS 1.3 encryption.", "Cryptography", SeverityLevel.HIGH, ["tls", "https", "ssl", "in transit", "cipher"], ["http only", "unencrypted external", "plaintext transit"], ["tls 1.3", "tls 1.2", "https enforced", "hsts enabled"]),
        ("Database at Rest Encryption", "Sensitive customer data and database tables at rest must be encrypted with AES-256 or cloud KMS keys.", "Data Protection", SeverityLevel.CRITICAL, ["at rest", "aes-256", "kms", "aurora", "database", "encrypted"], ["unencrypted at rest", "plaintext storage", "unencrypted database"], ["encrypted at rest", "aws kms", "aes-256"]),
        ("Immutable Audit Log Retention", "Administrative actions, security telemetry, and access logs must be centralized and retained for at least 365 days.", "Telemetry & Logging", SeverityLevel.HIGH, ["log", "retention", "s3", "audit trail", "365 days", "1 year"], ["logs deleted", "no audit log", "unmonitored"], ["retained for 365 days", "immutable s3", "object lock"]),
    ]

    @classmethod
    def devise_rules_from_document(cls, document_text: str, document_title: str = "Analyzed Document") -> RulePack:
        """
        Universally classifies ANY input document and synthesizes tailored compliance & structure rules.
        """
        cleaned = DocumentCleaner.clean(document_text).cleaned_text.lower()

        # Score across all universal domains
        score_edu = sum(cleaned.count(w) for w in ["lesson", "student", "learn", "teach", "grade", "homework", "curriculum", "rubric", "syllabus", "objective", "class", "semester"])
        score_lit = sum(cleaned.count(w) for w in ["chapter", "said", "whispered", "character", "novel", "narrator", "gatsby", "story", "scene", "dialogue", "protagonist", "gazed"])
        score_sci = sum(cleaned.count(w) for w in ["hypothesis", "dataset", "algorithm", "baseline", "experiment", "accuracy", "benchmark", "p-value", "methodology", "latency"])
        score_recipe = sum(cleaned.count(w) for w in ["recipe", "ingredients", "tablespoon", "preheat", "bake", "grams", "cups", "step 1", "cook", "oven", "temperature", "dough"])
        score_procure = sum(cleaned.count(w) for w in ["spend", "budget", "cfo", "$", "receipt", "reimburse", "flight", "contract", "vendor", "procurement"])
        score_soc2 = sum(cleaned.count(w) for w in ["mfa", "tls", "aes", "kms", "cloud", "database", "encryption", "sso", "security", "s3", "logs", "hipaa", "phi"])

        scores = {
            "edu": (score_edu, "Educational Curriculum & Lesson Plan", "devised_edu", cls.EDUCATION_PATTERNS),
            "lit": (score_lit, "Literary Analysis & Narrative Structure", "devised_lit", cls.LITERATURE_PATTERNS),
            "sci": (score_sci, "Scientific Research & Technical Benchmark", "devised_sci", cls.RESEARCH_PATTERNS),
            "recipe": (score_recipe, "Operational Procedure & Recipe Standard", "devised_recipe", cls.RECIPE_MANUAL_PATTERNS),
            "procure": (score_procure, "Enterprise Financial & Procurement Policy", "devised_procure", cls.PROCUREMENT_PATTERNS),
            "soc2": (score_soc2, "Cloud Security & Information Governance", "devised_soc2", cls.SECURITY_SOC2_PATTERNS),
        }

        # Find best matching domain
        best_domain = max(scores.items(), key=lambda x: x[1][0])
        score_val, topic_name, pack_id, selected_patterns = best_domain[1]

        # If completely general text, synthesize universal rules
        if score_val < 3:
            topic_name = "Universal Document Quality & Factuality"
            pack_id = "devised_universal"
            selected_patterns = [
                ("Explicit Core Theme & Subject Definition", "The document must ground its central topic, primary subject matter, or thesis statement with clear verbatim evidence.", "Core Structure", SeverityLevel.HIGH, ["topic", "subject", "thesis", "purpose", "introduction"], ["unspecified topic"], ["in this document", "the purpose is", "concerning"]),
                ("Grounded Key Figures & Roles", "Any persons, authors, instructors, or participants mentioned must have verifiable context.", "Attribution", SeverityLevel.MEDIUM, ["author", "person", "lead", "name", "dr.", "prof."], ["anonymous unverified claim"], ["written by", "authored by", "stated"]),
                ("Actionable Milestones & Temporal Constraints", "Any dates, milestones, deadlines, or durations described must be grounded in exact character spans.", "Timeline & Actions", SeverityLevel.HIGH, ["date", "deadline", "duration", "hours", "days", "milestone"], ["undated requirement"], ["due on", "scheduled for", "completed in"]),
                ("Factual Assertion & Grounded Evidence", "All substantive quantitative metrics or claims made in the document must be verifiable with exact substring citations.", "Factuality", SeverityLevel.CRITICAL, ["result", "claim", "%", "evidence", "fact"], ["unsubstantiated assertion"], ["verified by", "demonstrated that", "found that"]),
            ]

        devised_rules: List[RuleRequirement] = []
        rule_idx = 1

        for name, desc, category, severity, keywords, neg_constraints, pos_indicators in selected_patterns:
            active_keywords = [k for k in keywords if k.lower() in cleaned] or keywords[:3]
            
            rule = RuleRequirement(
                id=f"RULE-DEV-{rule_idx:02d}",
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

        return RulePack(
            id=pack_id,
            name=f"✨ {topic_name}",
            version="2026.Universal",
            description=f"Automated compliance, structure, and quality rules devised for '{document_title}'.",
            rules=devised_rules
        )
