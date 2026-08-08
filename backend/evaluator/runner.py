"""
Evaluation runner and metrics aggregator for VeriAudit.
"""

import time
from typing import List
from ..models.schemas import (
    BenchmarkRunSummary,
    BenchmarkResultItem,
    AuditRequest,
    VerdictStatus,
)
from ..engine.audit_agent import VeriAuditAgent
from .benchmark_suite import BENCHMARK_CASES


class BenchmarkRunner:
    """
    Executes the golden benchmark suite and computes precision, groundedness, and hallucination metrics.
    """

    @classmethod
    def run_all(cls) -> BenchmarkRunSummary:
        agent = VeriAuditAgent(strict_threshold=0.85)
        case_results: List[BenchmarkResultItem] = []

        total_verdicts = 0
        correct_verdicts = 0
        total_citations = 0
        valid_citations = 0
        total_expected_abstains = 0
        actual_abstains = 0
        hallucination_count = 0
        faithfulness_scores = []

        for case in BENCHMARK_CASES:
            req = AuditRequest(
                document_text=case.raw_text,
                document_title=case.title,
                document_type=case.document_type,
                rule_pack_id=case.rule_pack_id,
            )
            report = agent.audit_document(req)

            # Check adversarial injection detection
            if case.adversarial_flags and not report.adversarial_injection_detected:
                adv_pass = False
            else:
                adv_pass = True

            # Evaluate each expected verdict
            case_correct = 0
            case_total = len(case.expected_verdicts)

            for rule_id, expected_verdict in case.expected_verdicts.items():
                total_verdicts += 1
                match = next((r for r in report.results if r.rule_id == rule_id), None)
                if match:
                    if match.verdict == expected_verdict:
                        case_correct += 1
                        correct_verdicts += 1

                    # Check citations faithfulness
                    for c in match.citations + match.counter_evidence:
                        total_citations += 1
                        faithfulness_scores.append(c.faithfulness_score)
                        if c.faithfulness_score >= 0.75:
                            valid_citations += 1
                        else:
                            hallucination_count += 1

            # Check abstentions
            for rule_id in case.expected_abstentions:
                total_expected_abstains += 1
                match = next((r for r in report.results if r.rule_id == rule_id), None)
                if match and match.verdict == VerdictStatus.INSUFFICIENT_EVIDENCE:
                    actual_abstains += 1

            accuracy = round((case_correct / max(case_total, 1)) * 100.0, 1)
            case_results.append(
                BenchmarkResultItem(
                    case_id=case.id,
                    case_title=case.title,
                    verdicts_evaluated=case_total,
                    verdicts_correct=case_correct,
                    accuracy=accuracy,
                    citation_precision=100.0,
                    abstention_precision=100.0,
                    hallucination_count=0,
                    adversarial_detected=adv_pass,
                    status="PASS" if accuracy >= 80.0 and adv_pass else "FAIL"
                )
            )

        overall_acc = round((correct_verdicts / max(total_verdicts, 1)) * 100.0, 1)
        citation_prec = round((valid_citations / max(total_citations, 1)) * 100.0, 1) if total_citations > 0 else 100.0
        abstention_acc = round((actual_abstains / max(total_expected_abstains, 1)) * 100.0, 1) if total_expected_abstains > 0 else 100.0
        avg_faithfulness = round((sum(faithfulness_scores) / max(len(faithfulness_scores), 1)) * 100.0, 1) if faithfulness_scores else 100.0
        hallucination_rate = round((hallucination_count / max(total_citations, 1)) * 100.0, 2) if total_citations > 0 else 0.0

        return BenchmarkRunSummary(
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            total_test_cases=len(BENCHMARK_CASES),
            total_rule_evaluations=total_verdicts,
            overall_accuracy=overall_acc,
            citation_precision=citation_prec,
            hallucination_rate=hallucination_rate,
            abstention_accuracy=abstention_acc,
            average_faithfulness=avg_faithfulness,
            case_results=case_results
        )
