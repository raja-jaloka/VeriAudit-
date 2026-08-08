export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type VerdictStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';

export interface GroundedCitation {
  quote: string;
  start_char: number;
  end_char: number;
  line_number: number;
  context_snippet: string;
  faithfulness_score: number;
  is_exact_match: boolean;
  source_speaker?: string | null;
}

export interface RuleRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: SeverityLevel;
  mandatory_keywords: string[];
  negative_constraints: string[];
  positive_indicators: string[];
  min_confidence: number;
}

export interface RulePack {
  id: string;
  name: string;
  version: string;
  description: string;
  rule_count?: number;
  rules: RuleRequirement[];
}

export interface RuleAuditResult {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: SeverityLevel;
  verdict: VerdictStatus;
  confidence: number;
  reasoning: string;
  citations: GroundedCitation[];
  missing_evidence_notes?: string | null;
  counter_evidence: GroundedCitation[];
  groundedness_score: number;
  hallucination_risk: string;
}

export interface AuditSummary {
  total_rules: number;
  passed_count: number;
  failed_count: number;
  insufficient_evidence_count: number;
  not_applicable_count: number;
  overall_compliance_score: number;
  overall_groundedness_score: number;
  hallucination_count: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface DocumentSpan {
  chunk_id: number;
  start_char: number;
  end_char: number;
  line_number: number;
  text: string;
  speaker_or_heading?: string | null;
}

export interface AuditReport {
  audit_id: string;
  timestamp: string;
  document_title: string;
  document_type: string;
  summary: AuditSummary;
  results: RuleAuditResult[];
  cleaned_text: string;
  raw_text: string;
  spans_indexed: DocumentSpan[];
  processing_time_ms: number;
  adversarial_injection_detected: boolean;
  injection_details?: string | null;
}

export interface SampleDocumentPreset {
  id: string;
  title: string;
  doc_type: string;
  rule_pack_id: string;
  description: string;
  text: string;
}

export interface BenchmarkResultItem {
  case_id: string;
  case_title: string;
  verdicts_evaluated: number;
  verdicts_correct: number;
  accuracy: number;
  citation_precision: number;
  abstention_precision: number;
  hallucination_count: number;
  adversarial_detected: boolean;
  status: string;
}

export interface BenchmarkRunSummary {
  timestamp: string;
  total_test_cases: number;
  total_rule_evaluations: number;
  overall_accuracy: number;
  citation_precision: number;
  hallucination_rate: number;
  abstention_accuracy: number;
  average_faithfulness: number;
  case_results: BenchmarkResultItem[];
}

export interface EntityOccurrence {
  context: string;
  start_char: number;
  end_char: number;
  line_number: number;
  speaker_or_heading?: string | null;
  role_modifier?: string | null;
}

export interface ExtractedEntity {
  category: string;
  value: string;
  disambiguated_label?: string | null;
  context: string;
  start_char: number;
  end_char: number;
  line_number: number;
  confidence: number;
  occurrences?: EntityOccurrence[];
  total_occurrences?: number;
}

export interface ExtractionResponse {
  document_title: string;
  total_entities: number;
  entities_by_category: Record<string, ExtractedEntity[]>;
  entities: ExtractedEntity[];
}
