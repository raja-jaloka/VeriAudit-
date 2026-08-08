"""
Standalone benchmark execution script for VeriAudit.
Runs test suite and prints groundedness & hallucination metrics.
"""

import sys
import os

# Add workspace directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.evaluator.runner import BenchmarkRunner


def main():
    print("=" * 70)
    print("VeriAudit Grounded AI Compliance Agent - Benchmark Suite")
    print("=" * 70)

    summary = BenchmarkRunner.run_all()

    print(f"Total Test Cases Evaluated : {summary.total_test_cases}")
    print(f"Total Rule Verifications   : {summary.total_rule_evaluations}")
    print(f"Overall Verdict Accuracy   : {summary.overall_accuracy}%")
    print(f"Citation Precision         : {summary.citation_precision}%")
    print(f"Abstention Accuracy        : {summary.abstention_accuracy}%")
    print(f"Average Faithfulness Score : {summary.average_faithfulness}%")
    print(f"Hallucination Rate         : {summary.hallucination_rate}%")
    print("-" * 70)

    for item in summary.case_results:
        adv_status = " [Adversarial Blocked]" if item.adversarial_detected else ""
        print(f"[{item.status}] {item.case_title}: {item.verdicts_correct}/{item.verdicts_evaluated} rules correct ({item.accuracy}%){adv_status}")

    print("=" * 70)
    if summary.hallucination_rate == 0.0 and summary.overall_accuracy >= 90.0:
        print("SUCCESS: VeriAudit passed all zero-hallucination benchmark criteria!")
        sys.exit(0)
    else:
        print("WARNING: Benchmark metrics fell below required thresholds.")
        sys.exit(1)


if __name__ == "__main__":
    main()
