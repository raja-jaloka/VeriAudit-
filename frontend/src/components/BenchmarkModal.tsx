import React, { useState, useEffect } from 'react';
import type { BenchmarkRunSummary } from '../types';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<BenchmarkRunSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchBenchmarks = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('http://localhost:8000/api/benchmarks/run');
      if (!res.ok) {
        throw new Error('Failed to run benchmark suite');
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !summary) {
      fetchBenchmarks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: 'var(--accent-cyan)' }}>
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Automated Grounding & Hallucination Benchmark Suite
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Mathematical evaluation against golden test datasets measuring precision & refusal fidelity
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={fetchBenchmarks}
              disabled={isRunning}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              {isRunning ? 'Evaluating...' : 'Re-Run Suite'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 11 }}
              title="Return to main workspace"
            >
              ← Back to Workbench
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isRunning && !summary ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #06b6d4', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p>Executing 20+ rule audits across messy transcripts and adversarial tests...</p>
            </div>
          ) : summary ? (
            <>
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block' }}>Accuracy</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--status-pass)', fontFamily: 'var(--font-display)', display: 'block', marginTop: 2 }}>
                    {summary.overall_accuracy}%
                  </span>
                </div>

                <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block' }}>Citation Precision</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', display: 'block', marginTop: 2 }}>
                    {summary.citation_precision}%
                  </span>
                </div>

                <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block' }}>Hallucination Rate</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--status-pass)', fontFamily: 'var(--font-display)', display: 'block', marginTop: 2 }}>
                    {summary.hallucination_rate}%
                  </span>
                </div>

                <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block' }}>Abstention Precision</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--status-abstain)', fontFamily: 'var(--font-display)', display: 'block', marginTop: 2 }}>
                    {summary.abstention_accuracy}%
                  </span>
                </div>

                <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block' }}>Avg Faithfulness</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: 'var(--font-display)', display: 'block', marginTop: 2 }}>
                    {summary.average_faithfulness}%
                  </span>
                </div>
              </div>

              {/* Case Breakdown Table */}
              <div className="benchmark-table-wrap">
                <table className="benchmark-table">
                  <thead>
                    <tr>
                      <th>Test Scenario</th>
                      <th>Rules Evaluated</th>
                      <th>Verdicts Matched</th>
                      <th>Adversarial Defense</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.case_results.map((c, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {c.case_title}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {c.verdicts_evaluated} rules
                        </td>
                        <td style={{ color: 'var(--status-pass)', fontWeight: 600 }}>
                          {c.verdicts_correct}/{c.verdicts_evaluated} ({c.accuracy}%)
                        </td>
                        <td>
                          {c.adversarial_detected ? (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: 'var(--accent-cyan)' }}>
                              ✓ Protected
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`status-pill ${c.status === 'PASS' ? 'status-pill-pass' : 'status-pill-fail'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Back Button */}
              <div style={{ textAlign: 'center', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  ← Go Back to Main Audit Workbench
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Failed to load benchmark data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
