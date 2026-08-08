"""
Adversarial Injection Detection, Contradiction Engine, and Abstention Safeguard.
Ensures zero-hallucination compliance audits by refusing to invent missing evidence.
"""

import re
from typing import List, Tuple, Optional, Dict, Any
from ..models.schemas import RuleRequirement, VerdictStatus, GroundedCitation


class HallucinationGuard:
    """
    Prevents hallucinations by enforcing strict evidence thresholds,
    detecting prompt injection attempts in documents, and catching contradictions.
    """

    ADVERSARIAL_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts)", re.IGNORECASE),
        re.compile(r"system\s+(prompt|override|instruction)", re.IGNORECASE),
        re.compile(r"mark\s+(all|every)\s+rule\s+(as\s+)?(pass|compliant|approved)", re.IGNORECASE),
        re.compile(r"do\s+not\s+fail\s+this\s+audit", re.IGNORECASE),
        re.compile(r"you\s+must\s+say\s+yes\s+to\s+everything", re.IGNORECASE),
        re.compile(r"<\s*script\b|javascript:|onerror\s*=", re.IGNORECASE),
        re.compile(r"bypass\s+compliance\s+engine", re.IGNORECASE),
    ]

    @classmethod
    def scan_for_prompt_injection(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Detects prompt injection or adversarial jailbreak attempts embedded within unstructured documents.
        """
        for pattern in cls.ADVERSARIAL_PATTERNS:
            match = pattern.search(text)
            if match:
                matched_snippet = match.group(0)
                return True, f"Adversarial prompt injection pattern detected: '{matched_snippet}'"
        return False, None

    @classmethod
    def should_abstain(
        cls,
        rule: RuleRequirement,
        found_citations: List[GroundedCitation],
        confidence_score: float
    ) -> bool:
        """
        Determines whether the agent must abstain with INSUFFICIENT_EVIDENCE.
        Refuses to guess if no citations are verified or confidence is below rule threshold.
        """
        if not found_citations:
            return True
        if confidence_score < rule.min_confidence:
            return True
        # If no citation has exact or high faithfulness
        if all(c.faithfulness_score < 0.7 for c in found_citations):
            return True
        return False

    @classmethod
    def check_negative_violations(
        cls,
        text: str,
        rule: RuleRequirement
    ) -> List[Dict[str, Any]]:
        """
        Searches for explicit negative statements that indicate a direct compliance failure.
        """
        violations = []
        text_lower = text.lower()

        for neg_phrase in rule.negative_constraints:
            neg_lower = neg_phrase.lower()
            if neg_lower in text_lower:
                # Locate start char in original text
                idx = text_lower.find(neg_lower)
                start_char = idx
                end_char = idx + len(neg_phrase)
                snippet = text[max(0, start_char - 40): min(len(text), end_char + 40)]
                violations.append({
                    "phrase": neg_phrase,
                    "start_char": start_char,
                    "end_char": end_char,
                    "snippet": snippet
                })

        return violations
