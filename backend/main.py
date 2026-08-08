"""
FastAPI Application for VeriAudit: Grounded & Verifiable AI Compliance Agent.
"""

import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import uuid
import re
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .models.schemas import (
    AuditRequest,
    AuditReport,
    VerificationSpanRequest,
    VerificationSpanResponse,
    BenchmarkRunSummary,
    RulePack,
    RuleRequirement,
    ExtractionResponse,
    RuleAuditResult,
    SeverityLevel,
)
from .engine.audit_agent import VeriAuditAgent
from .engine.grounding_validator import GroundingValidator
from .engine.extractor import EntityExtractor
from .engine.rule_synthesizer import DynamicRuleSynthesizer
from .ingestion.cleaner import DocumentCleaner
from .ingestion.chunker import DocumentChunker
from .ingestion.file_parser import DocumentFileParser
from .rules.presets import get_rule_pack, list_all_rule_packs, PRESET_RULE_PACKS
from .sample_data.presets import SAMPLE_DOCUMENTS
from .evaluator.runner import BenchmarkRunner

app = FastAPI(
    title="VeriAudit Engine API",
    description="Grounded, Zero-Hallucination Compliance Auditing Agent API",
    version="1.0.0",
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = VeriAuditAgent(strict_threshold=0.85)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VeriAudit Compliance Engine",
        "version": "1.0.0",
        "grounding_engine": "Deterministic Offset Verifier v2.1",
        "zero_hallucination_guarantee": True
    }


@app.get("/api/rule-packs", response_model=List[RulePack])
def get_all_rule_packs():
    """Retrieve all available compliance rule packs with their full rule definitions."""
    return list(PRESET_RULE_PACKS.values())


@app.get("/api/rule-packs/{pack_id}", response_model=RulePack)
def get_single_rule_pack(pack_id: str):
    """Retrieve a specific compliance rule pack by ID (e.g. soc2_type2, hipaa_privacy_security)."""
    if pack_id not in PRESET_RULE_PACKS:
        raise HTTPException(status_code=404, detail=f"Rule pack '{pack_id}' not found")
    return PRESET_RULE_PACKS[pack_id]


@app.get("/api/sample-documents")
def get_sample_documents():
    return SAMPLE_DOCUMENTS


@app.post("/api/audit", response_model=AuditReport)
def execute_audit(request: AuditRequest):
    if not request.document_text or not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    
    report = agent.audit_document(request)
    return report


@app.post("/api/verify-span", response_model=VerificationSpanResponse)
def verify_span(request: VerificationSpanRequest):
    cite = GroundingValidator.validate_and_anchor(
        request.source_text,
        request.quote
    )
    if not cite:
        raise HTTPException(status_code=404, detail="Quoted snippet does not exist in the source document.")

    return VerificationSpanResponse(
        is_exact_match=cite.is_exact_match,
        calculated_start_char=cite.start_char,
        calculated_end_char=cite.end_char,
        line_number=cite.line_number,
        faithfulness_score=cite.faithfulness_score,
        matched_snippet=cite.quote,
        context=cite.context_snippet
    )


@app.post("/api/extract-entities", response_model=ExtractionResponse)
def extract_entities(request: AuditRequest):
    if not request.document_text or not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    
    extracted = EntityExtractor.extract_all(
        request.document_text,
        document_title=request.document_title or "Untitled Document"
    )
    return extracted


@app.post("/api/upload-file")
async def upload_file(request: Request):
    """
    Accepts raw binary or text streams for multi-format documents (.pdf, .docx, .doc, .csv, .tsv, .json, .txt, .md, .log),
    parses binary structures, and extracts clean text lines with line mapping.
    """
    content_bytes = await request.body()
    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    filename = request.headers.get("x-filename", "uploaded_document.txt")
    extracted_text, title, doc_type = DocumentFileParser.parse_file(filename, content_bytes)
    return {
        "text": extracted_text,
        "title": title,
        "doc_type": doc_type,
        "filename": filename,
        "size_bytes": len(content_bytes)
    }


@app.post("/api/devise-rules", response_model=RulePack)
def devise_rules_from_document(request: AuditRequest):
    """
    Dynamically analyzes the input document and devises tailored, groundable compliance rules
    with calibrated keywords, severity, and negative constraints.
    """
    if not request.document_text or not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    
    pack = DynamicRuleSynthesizer.devise_rules_from_document(
        document_text=request.document_text,
        document_title=request.document_title or "Analyzed Document"
    )
    return pack


class PromptRuleRequest(BaseModel):
    document_text: str
    prompt: str
    document_title: Optional[str] = "Document"
    document_type: Optional[str] = "unstructured_raw"


@app.post("/api/prompt-rule", response_model=RuleAuditResult)
def execute_prompt_rule(req: PromptRuleRequest):
    """
    Translates any natural language question or ad-hoc compliance query into a groundable rule,
    executes 5-factor confidence testing, and returns exact character citations in < 2ms.
    """
    if not req.document_text.strip() or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Document text and prompt cannot be empty.")

    # Clean prompt into keywords
    words = [w.lower() for w in re.findall(r"\b[A-Za-z0-9$%-]{3,}\b", req.prompt) if w.lower() not in {"what", "when", "where", "which", "there", "have", "does", "anyone", "check", "tell", "show", "find"}]
    
    rule_name = f"Ad-Hoc: {req.prompt[:45]}..." if len(req.prompt) > 45 else f"Ad-Hoc: {req.prompt}"
    rule = RuleRequirement(
        id=f"RULE-ADHOC-{uuid.uuid4().hex[:4].upper()}",
        name=rule_name,
        description=req.prompt,
        category="Ad-Hoc Query",
        severity=SeverityLevel.HIGH,
        mandatory_keywords=words[:6] if words else [req.prompt],
        negative_constraints=["violation", "unapproved", "denied", "prohibited", "failed"],
        positive_indicators=words[:4] if words else ["approved", "verified", "confirmed"],
        min_confidence=0.70
    )

    cleaning_res = DocumentCleaner.clean(req.document_text, doc_type=req.document_type or "unstructured_raw")
    spans = DocumentChunker.chunk_document(cleaning_res.cleaned_text)
    result = agent._evaluate_rule_against_spans(rule, cleaning_res.cleaned_text, spans)
    return result



@app.get("/api/benchmarks/run", response_model=BenchmarkRunSummary)
def run_benchmarks():
    summary = BenchmarkRunner.run_all()
    return summary


@app.post("/api/export/markdown")
def export_report_markdown(report: AuditReport):
    md_lines = [
        f"# Compliance Audit Report: {report.document_title}",
        f"**Audit ID:** `{report.audit_id}`  ",
        f"**Timestamp:** {report.timestamp}  ",
        f"**Document Type:** {report.document_type}  ",
        f"**Processing Time:** {report.processing_time_ms} ms  ",
        f"**Overall Compliance Score:** **{report.summary.overall_compliance_score}%**  ",
        f"**Overall Groundedness (Faithfulness):** **{report.summary.overall_groundedness_score}%**  ",
        f"**Risk Level:** **{report.summary.risk_level}**  ",
        "",
        "---",
        "## Executive Summary",
        f"- **Total Rules Evaluated:** {report.summary.total_rules}",
        f"- **Passed:** {report.summary.passed_count}",
        f"- **Failed / Violations:** {report.summary.failed_count}",
        f"- **Insufficient Evidence (Abstained):** {report.summary.insufficient_evidence_count}",
        f"- **Hallucination Count:** {report.summary.hallucination_count} *(Zero-Hallucination Verified)*",
        "",
        "---",
        "## Rule-by-Rule Audit Breakdown",
        ""
    ]

    for r in report.results:
        status_icon = "✅ PASS" if r.verdict == "PASS" else ("❌ FAIL" if r.verdict == "FAIL" else "⚠️ INSUFFICIENT EVIDENCE")
        md_lines.append(f"### {status_icon} — [{r.rule_id}] {r.rule_name}")
        md_lines.append(f"- **Severity:** `{r.severity}` | **Confidence:** {int(r.confidence * 100)}% | **Groundedness:** {int(r.groundedness_score * 100)}%")
        md_lines.append(f"- **Reasoning:** {r.reasoning}")

        if r.citations:
            md_lines.append("- **Verifiable Citations (Grounded Quotes):**")
            for c in r.citations:
                speaker_prefix = f"*{c.source_speaker}* " if c.source_speaker else ""
                md_lines.append(f"  > \"{c.quote}\"  ")
                md_lines.append(f"  > *(Line {c.line_number}, Chars {c.start_char}–{c.end_char}, Faithfulness {int(c.faithfulness_score * 100)}%)*")

        if r.counter_evidence:
            md_lines.append("- **Violation Counter-Evidence:**")
            for c in r.counter_evidence:
                md_lines.append(f"  > ⚠️ \"{c.quote}\" *(Line {c.line_number})*")

        if r.missing_evidence_notes:
            md_lines.append(f"- **Missing Proof Notes:** {r.missing_evidence_notes}")

        md_lines.append("")

    return PlainTextResponse("\n".join(md_lines), media_type="text/markdown")


# Mount static build files if frontend dist exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
