"""
Data models and schemas for VeriAudit Grounded AI Compliance Agent.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class VerdictStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class GroundedCitation(BaseModel):
    quote: str = Field(..., description="Exact verbatim substring quoted from the document")
    start_char: int = Field(..., description="0-indexed start character offset in cleaned source text")
    end_char: int = Field(..., description="0-indexed end character offset in cleaned source text")
    line_number: int = Field(1, description="1-indexed line number where the quote begins")
    context_snippet: str = Field("", description="Surrounding sentence context for preview")
    faithfulness_score: float = Field(1.0, ge=0.0, le=1.0, description="1.0 for exact substring match")
    is_exact_match: bool = Field(True, description="True if quote exists character-for-character in source")
    source_speaker: Optional[str] = Field(None, description="Speaker name or section heading if available")


class RuleRequirement(BaseModel):
    id: str = Field(..., description="Unique rule identifier, e.g. SOC2-CC6.1")
    name: str = Field(..., description="Human-readable rule title")
    description: str = Field(..., description="Formal compliance criteria and definition")
    category: str = Field("General", description="Category grouping, e.g. Access Control, Data Privacy")
    severity: SeverityLevel = Field(SeverityLevel.HIGH, description="Risk severity if failed")
    mandatory_keywords: List[str] = Field(default_factory=list, description="Keywords indicating relevance")
    negative_constraints: List[str] = Field(default_factory=list, description="Patterns/phrases indicating violation")
    positive_indicators: List[str] = Field(default_factory=list, description="Patterns/phrases indicating compliance")
    min_confidence: float = Field(0.75, ge=0.0, le=1.0, description="Minimum confidence required to render PASS/FAIL")


class RulePack(BaseModel):
    id: str = Field(..., description="Pack slug, e.g. soc2_type2, hipaa_security")
    name: str = Field(..., description="Rule pack display name")
    version: str = Field("1.0.0", description="Rule pack version")
    description: str = Field(..., description="Detailed description of what this rule pack audits")
    rules: List[RuleRequirement] = Field(..., description="List of individual compliance rules")


class RuleAuditResult(BaseModel):
    rule_id: str
    rule_name: str
    category: str = "General"
    severity: SeverityLevel
    verdict: VerdictStatus
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="Grounded, step-by-step verifiable explanation")
    citations: List[GroundedCitation] = Field(default_factory=list)
    missing_evidence_notes: Optional[str] = Field(
        None, description="Detailed explanation of what specific proof is missing if INSUFFICIENT_EVIDENCE"
    )
    counter_evidence: List[GroundedCitation] = Field(
        default_factory=list, description="Citations demonstrating non-compliance if FAIL"
    )
    groundedness_score: float = Field(1.0, ge=0.0, le=1.0)
    hallucination_risk: str = Field("ZERO", description="'ZERO', 'LOW', 'FLAGGED'")


class AuditSummary(BaseModel):
    total_rules: int
    passed_count: int
    failed_count: int
    insufficient_evidence_count: int
    not_applicable_count: int
    overall_compliance_score: float = Field(..., ge=0.0, le=100.0)
    overall_groundedness_score: float = Field(..., ge=0.0, le=100.0)
    hallucination_count: int = 0
    risk_level: str = Field("LOW", description="'LOW', 'MODERATE', 'HIGH', 'CRITICAL'")


class DocumentSpan(BaseModel):
    chunk_id: int
    start_char: int
    end_char: int
    line_number: int
    text: str
    speaker_or_heading: Optional[str] = None


class AuditReport(BaseModel):
    audit_id: str
    timestamp: str
    document_title: str
    document_type: str = Field("unstructured_raw", description="meeting_transcript, ocr_scan, policy, contract, clinical")
    summary: AuditSummary
    results: List[RuleAuditResult]
    cleaned_text: str
    raw_text: str
    spans_indexed: List[DocumentSpan] = Field(default_factory=list)
    processing_time_ms: float = 0.0
    adversarial_injection_detected: bool = False
    injection_details: Optional[str] = None


class AuditRequest(BaseModel):
    document_text: str
    document_title: Optional[str] = "Untitled Document"
    document_type: Optional[str] = "unstructured_raw"
    rule_pack_id: Optional[str] = "soc2_type2"
    custom_rules: Optional[List[RuleRequirement]] = None
    strict_grounding_threshold: float = 0.85


class VerificationSpanRequest(BaseModel):
    source_text: str
    quote: str
    start_char: Optional[int] = None
    end_char: Optional[int] = None


class VerificationSpanResponse(BaseModel):
    is_exact_match: bool
    calculated_start_char: int
    calculated_end_char: int
    line_number: int
    faithfulness_score: float
    matched_snippet: str
    context: str


class BenchmarkCase(BaseModel):
    id: str
    title: str
    document_type: str
    raw_text: str
    rule_pack_id: str
    expected_verdicts: Dict[str, VerdictStatus]
    expected_abstentions: List[str] = Field(default_factory=list)
    adversarial_flags: bool = False
    description: str = ""


class BenchmarkResultItem(BaseModel):
    case_id: str
    case_title: str
    verdicts_evaluated: int
    verdicts_correct: int
    accuracy: float
    citation_precision: float
    abstention_precision: float
    hallucination_count: int
    adversarial_detected: bool
    status: str = "PASS"


class BenchmarkRunSummary(BaseModel):
    timestamp: str
    total_test_cases: int
    total_rule_evaluations: int
    overall_accuracy: float
    citation_precision: float
    hallucination_rate: float
    abstention_accuracy: float
    average_faithfulness: float
    case_results: List[BenchmarkResultItem]


class ExtractedEntity(BaseModel):
    category: str = Field(..., description="Monetary, Signatory, Vendor/System, Protocol, Retention/Deadline, Compliance Risk")
    value: str = Field(..., description="Extracted verbatim value")
    context: str = Field(..., description="Surrounding sentence context")
    start_char: int
    end_char: int
    line_number: int
    confidence: float = 1.0


class ExtractionResponse(BaseModel):
    document_title: str
    total_entities: int
    entities_by_category: Dict[str, List[ExtractedEntity]]
    entities: List[ExtractedEntity]

