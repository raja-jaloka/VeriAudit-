"""
Deterministic Structured Data & Entity Extraction Engine.
Extracts grounded factual entities (Monetary figures, Signatories, Systems, Standards, Retention rules, Risk flags).
"""

import re
from typing import List, Dict, Any
from ..models.schemas import ExtractedEntity, ExtractionResponse


class EntityExtractor:
    """
    Extracts key structured data points from messy unstructured documents with exact character offsets.
    """

    PATTERNS = {
        "Monetary Spend & Figures": re.compile(r"\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|k|thousand|USD))?|\b\d+[\d,]*\s*(?:USD|dollars)\b", re.IGNORECASE),
        "Signatories & Roles": re.compile(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\(((?:CFO|VP|Director|Head|Lead|Manager|CEO|COO|Counsel)[A-Za-z0-9\s.,/-]*)\)|\b(Mark\s*\([A-Z]+\)|Sarah\s*\([A-Za-z\s]+\)|David\s*\([A-Za-z\s]+\))\b", re.MULTILINE),
        "Systems & Cloud Vendors": re.compile(r"\b(Okta\s+SSO|Amazon\s+S3|AWS\s+KMS|Datadog|Epic\s+EHR|Amazon\s+Aurora|United|MediTranscribe\s+AI|GCP|Splunk|Aurora|S3\s+buckets|Bastion\s+hosts)\b", re.IGNORECASE),
        "Security Standards & Ciphers": re.compile(r"\b(TLS\s*1\.[23]|AES-256|AES\s*256|MFA|2FA|SSO|BAA|HSTS|Safe\s+Harbor|SOC\s*2|HIPAA|FIPS\s*140-2|Object\s*Lock)\b", re.IGNORECASE),
        "Retention & Deadlines": re.compile(r"\b(\d+\s*(?:days|years|months|hours|minutes|calendar\s*days))\b", re.IGNORECASE),
        "Compliance Risk Indicators": re.compile(r"\b(unitemized|unencrypted|lost\s+receipt|patient\s+names\s+included|breach|password\s+only|without\s+authorization|no\s+mfa|unapproved)\b", re.IGNORECASE),
    }

    @classmethod
    def extract_all(cls, source_text: str, document_title: str = "Untitled Document") -> ExtractionResponse:
        entities: List[ExtractedEntity] = []
        by_category: Dict[str, List[ExtractedEntity]] = {}

        for category, regex in cls.PATTERNS.items():
            by_category[category] = []
            for match in regex.finditer(source_text):
                val = match.group(0).strip()
                if not val:
                    continue
                start_char = match.start()
                end_char = match.end()
                line_no = source_text[:start_char].count("\n") + 1
                
                # Context snippet
                ctx_start = max(0, start_char - 40)
                ctx_end = min(len(source_text), end_char + 40)
                prefix = "..." if ctx_start > 0 else ""
                suffix = "..." if ctx_end < len(source_text) else ""
                context = f"{prefix}{source_text[ctx_start:ctx_end].strip()}{suffix}"

                entity = ExtractedEntity(
                    category=category,
                    value=val,
                    context=context,
                    start_char=start_char,
                    end_char=end_char,
                    line_number=line_no,
                    confidence=1.0
                )
                entities.append(entity)
                by_category[category].append(entity)

        return ExtractionResponse(
            document_title=document_title,
            total_entities=len(entities),
            entities_by_category=by_category,
            entities=entities
        )
