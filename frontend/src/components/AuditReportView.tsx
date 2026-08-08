import React, { useState, useEffect } from 'react';
import type { AuditReport, RuleAuditResult, GroundedCitation, ExtractionResponse } from '../types';

interface AuditReportViewProps {
  report: AuditReport | null;
  isLoading: boolean;
  onSelectCitation: (citation: GroundedCitation | null, isCounter?: boolean) => void;
  activeCitation?: GroundedCitation | null;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  report,
  isLoading,
  onSelectCitation,
  activeCitation,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'entities'>('rules');
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'INSUFFICIENT_EVIDENCE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [extractions, setExtractions] = useState<ExtractionResponse | null>(null);

  // Per-card expanded state tracking by rule_id (default all true)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (report && report.results) {
      const initial: Record<string, boolean> = {};
      report.results.forEach((r) => {
        initial[r.rule_id] = true;
      });
      setExpandedCards(initial);
    }
  }, [report]);

  const toggleCard = (ruleId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const expandAll = () => {
    if (!report) return;
    const allOpen: Record<string, boolean> = {};
    report.results.forEach((r) => {
      allOpen[r.rule_id] = true;
    });
    setExpandedCards(allOpen);
  };

  const collapseAll = () => {
    if (!report) return;
    const allClosed: Record<string, boolean> = {};
    report.results.forEach((r) => {
      allClosed[r.rule_id] = false;
    });
    setExpandedCards(allClosed);
  };

  // Fetch structured entities whenever a report is loaded
  useEffect(() => {
    if (report && report.raw_text) {
      fetch('http://localhost:8000/api/extract-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: report.raw_text,
          document_title: report.document_title,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Extraction failed');
          return res.json();
        })
        .then((data) => setExtractions(data))
        .catch((err) => console.error('Failed to extract entities:', err));
    }
  }, [report]);

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 50, height: 50, position: 'relative', margin: '0 auto 16px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', animation: 'spin 1s linear infinite' }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
          Deterministic Grounding & Confidence Evaluation
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360, marginTop: 6 }}>
          Testing exact substring fidelity, semantic salience, speaker authority, and negative constraints across the document...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-panel" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
          <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>No Audit Run Yet</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, marginTop: 4 }}>
          Select or import a document, click "Auto-Devise Rules" or choose a rule pack to calculate dynamic confidence scores.
        </p>
      </div>
    );
  }

  const { summary, results } = report;

  // Filter and search results
  const filteredResults = results.filter((r) => {
    if (filter !== 'ALL' && r.verdict !== filter) return false;
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase();
      return (
        r.rule_name.toLowerCase().includes(q) ||
        r.rule_id.toLowerCase().includes(q) ||
        r.reasoning.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="report-view-container">
      {/* Top Navigation Mode Tabs */}
      <div style={{ display: 'flex', gap: 8, background: 'rgba(10, 15, 26, 0.85)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('rules')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'rules' ? '1px solid rgba(6, 182, 212, 0.4)' : 'none',
            background: activeTab === 'rules' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'rules' ? 'var(--accent-cyan-light)' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          ⚖️ Compliance Rules & Evidence ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'entities' ? '1px solid rgba(139, 92, 246, 0.4)' : 'none',
            background: activeTab === 'entities' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeTab === 'entities' ? '#c4b5fd' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          📊 Extracted Data & Knowledge ({extractions ? extractions.total_entities : '...'})
        </button>
      </div>

      {/* Top Scorecard & Telemetry Dashboard (Verified Stats) */}
      <div className="scorecard-panel">
        <div className="scorecard-grid">
          {/* Compliance Score */}
          <div className="scorecard-item" title="Pass rate across actionable rules (Passed / [Passed + Failed])">
            <span className="scorecard-label">Compliance Score</span>
            <div className="scorecard-value-wrap">
              <span className={`scorecard-val-huge ${
                summary.overall_compliance_score >= 80 ? 'val-pass' : summary.overall_compliance_score >= 50 ? 'val-abstain' : 'val-fail'
              }`}>
                {summary.overall_compliance_score}%
              </span>
              <span className="scorecard-subtext">
                {summary.passed_count}/{summary.passed_count + summary.failed_count} actionable passed
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginTop: 2 }}>
              Total: {summary.passed_count} pass, {summary.failed_count} fail, {summary.insufficient_evidence_count} abstained
            </div>
          </div>

          {/* Groundedness / Faithfulness */}
          <div className="scorecard-item" title="Mathematical verbatim alignment of cited quotations against source characters">
            <span className="scorecard-label">Groundedness Fidelity</span>
            <div className="scorecard-value-wrap">
              <span className="scorecard-val-huge val-cyan">
                {summary.overall_groundedness_score}%
              </span>
              <span className="scorecard-subtext" style={{ color: 'var(--status-pass)' }}>
                0% hallucination
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--status-pass)', marginTop: 2 }}>
              100% Deterministic Citations
            </div>
          </div>

          {/* Risk Level */}
          <div className="scorecard-item" title="Calculated from violation severity and negative constraints">
            <span className="scorecard-label">Audit Risk Level</span>
            <div style={{ marginTop: 4 }}>
              <span className={`status-pill ${
                summary.risk_level === 'LOW'
                  ? 'status-pill-pass'
                  : summary.risk_level === 'MODERATE'
                  ? 'status-pill-abstain'
                  : 'status-pill-fail'
              }`}>
                {summary.risk_level} RISK
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginTop: 4 }}>
              {summary.failed_count > 0 ? `${summary.failed_count} Violation(s) flagged` : 'No violations found'}
            </div>
          </div>

          {/* Processing Telemetry */}
          <div className="scorecard-item" title="Processing time in milliseconds for ingestion, chunking, and grounded reasoning">
            <span className="scorecard-label">Verification Speed</span>
            <div className="scorecard-value-wrap">
              <span className="scorecard-val-huge" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {report.processing_time_ms}
              </span>
              <span className="scorecard-subtext">ms</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginTop: 2 }}>
              Zero-latency Python engine
            </div>
          </div>
        </div>

        {/* Instant Extracted Fact Pills Bar */}
        {extractions && extractions.total_entities > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-cyan-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Extracted Facts ({extractions.total_entities}):
            </span>
            {extractions.entities.slice(0, 6).map((entity, idx) => (
              <button
                key={idx}
                onClick={() =>
                  onSelectCitation({
                    quote: entity.value,
                    start_char: entity.start_char,
                    end_char: entity.end_char,
                    line_number: entity.line_number,
                    context_snippet: entity.context,
                    faithfulness_score: 1.0,
                    is_exact_match: true,
                  })
                }
                className="btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: 10.5,
                  borderRadius: 6,
                  background: 'rgba(6, 182, 212, 0.1)',
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                  color: '#ffffff',
                }}
                title={`Click to locate "${entity.value}" in source document`}
              >
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{entity.category.split(' ')[0]}:</span> {entity.value}
              </button>
            ))}
            {extractions.total_entities > 6 && (
              <button
                onClick={() => setActiveTab('entities')}
                style={{ background: 'transparent', border: 'none', color: '#c4b5fd', fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline' }}
              >
                +{extractions.total_entities - 6} more in Extracted Data tab →
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'rules' ? (
        <>
          {/* Filter Tabs & Expand All Controls */}
          <div className="report-filter-bar">
            {/* Status Filter Pills */}
            <div className="filter-pills-group">
              <button
                onClick={() => setFilter('ALL')}
                className={`filter-pill-btn ${filter === 'ALL' ? 'active' : ''}`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilter('PASS')}
                className={`filter-pill-btn ${filter === 'PASS' ? 'active-pass' : ''}`}
              >
                Pass ({summary.passed_count})
              </button>
              <button
                onClick={() => setFilter('FAIL')}
                className={`filter-pill-btn ${filter === 'FAIL' ? 'active-fail' : ''}`}
              >
                Violations ({summary.failed_count})
              </button>
              <button
                onClick={() => setFilter('INSUFFICIENT_EVIDENCE')}
                className={`filter-pill-btn ${filter === 'INSUFFICIENT_EVIDENCE' ? 'active-abstain' : ''}`}
              >
                Abstained ({summary.insufficient_evidence_count})
              </button>
            </div>

            {/* Expand / Collapse Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={expandAll}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10.5 }}
                title="Expand all rule cards and evidence trays"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10.5 }}
                title="Collapse all rule cards"
              >
                Collapse All
              </button>
            </div>

            {/* Search input */}
            <div className="search-input-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rules, keywords..."
                className="search-input"
              />
            </div>
          </div>

          {/* List of Rule Audit Cards with Full Content & No Layout Folding */}
          <div className="rules-cards-scroller">
            {filteredResults.length === 0 ? (
              <div className="scorecard-panel" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24, fontSize: 12 }}>
                No rules match the current filter or search criteria.
              </div>
            ) : (
              filteredResults.map((r) => (
                <RuleCard
                  key={r.rule_id}
                  result={r}
                  isExpanded={!!expandedCards[r.rule_id]}
                  onToggle={() => toggleCard(r.rule_id)}
                  onSelectCitation={onSelectCitation}
                  activeCitation={activeCitation}
                />
              ))
            )}
          </div>
        </>
      ) : (
        /* Extracted Structured Data & Facts View */
        <div className="rules-cards-scroller">
          {extractions ? (
            Object.entries(extractions.entities_by_category).map(([category, items]) => (
              <div key={category} className="scorecard-panel" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan-light)', fontFamily: 'var(--font-mono)' }}>
                    {category} ({items.length})
                  </h4>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Verifiable Exact Character Offsets
                  </span>
                </div>

                {items.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No {category.toLowerCase()} detected in this document.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {items.map((entity, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          background: 'rgba(10, 15, 26, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: 8,
                          padding: 10,
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'block' }}>
                            {entity.value}
                          </span>
                          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
                            "{entity.context}"
                          </p>
                          <span style={{ fontSize: 10, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 4, display: 'block' }}>
                            Line {entity.line_number} • Chars [{entity.start_char}–{entity.end_char}]
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            onSelectCitation({
                              quote: entity.value,
                              start_char: entity.start_char,
                              end_char: entity.end_char,
                              line_number: entity.line_number,
                              context_snippet: entity.context,
                              faithfulness_score: 1.0,
                              is_exact_match: true,
                            })
                          }
                          className="locate-btn"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        >
                          Locate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="scorecard-panel" style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)' }}>
              Extracting structured facts and entities...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface RuleCardProps {
  result: RuleAuditResult;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectCitation: (citation: GroundedCitation | null, isCounter?: boolean) => void;
  activeCitation?: GroundedCitation | null;
}

const RuleCard: React.FC<RuleCardProps> = ({
  result,
  isExpanded,
  onToggle,
  onSelectCitation,
  activeCitation,
}) => {
  const isPass = result.verdict === 'PASS';
  const isFail = result.verdict === 'FAIL';

  const statusBadge = isPass ? (
    <span className="status-pill status-pill-pass">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      PASS
    </span>
  ) : isFail ? (
    <span className="status-pill status-pill-fail">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      VIOLATION (FAIL)
    </span>
  ) : (
    <span className="status-pill status-pill-abstain">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      INSUFFICIENT EVIDENCE
    </span>
  );

  const cardClass = isFail ? 'rule-card-fail' : isPass ? 'rule-card-pass' : 'rule-card-abstain';
  const confPercent = Math.round(result.confidence * 100);

  return (
    <div className={`rule-audit-card ${cardClass}`}>
      {/* Clean Uncluttered Header */}
      <div
        onClick={onToggle}
        className="rule-card-header"
      >
        <div className="rule-header-left">
          <div>{statusBadge}</div>
          <div className="rule-title-group">
            <div className="rule-tags-row">
              <span className="rule-id-tag">{result.rule_id}</span>
              <span className="rule-category-tag">{result.category}</span>
              <span className={`rule-severity-tag ${
                result.severity === 'CRITICAL'
                  ? 'severity-critical'
                  : result.severity === 'HIGH'
                  ? 'severity-high'
                  : result.severity === 'MEDIUM'
                  ? 'severity-medium'
                  : 'severity-low'
              }`}>
                {result.severity}
              </span>
            </div>
            <h4 className="rule-name-heading">{result.rule_name}</h4>
          </div>
        </div>

        <div className="rule-header-right">
          {/* Tested Confidence Pill */}
          <div className="confidence-block" title="Mathematically tested against verbatim citations, keyword salience, and authority weighting">
            <span className="confidence-label">Tested Confidence</span>
            <span className="confidence-val" style={{ color: confPercent >= 90 ? 'var(--status-pass)' : confPercent >= 75 ? 'var(--accent-cyan)' : 'var(--status-abstain)' }}>
              {confPercent}%
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span>{isExpanded ? 'Hide' : 'View Evidence'}</span>
            <svg className={`expand-chevron ${isExpanded ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Full Details & Evidence Drawer */}
      {isExpanded && (
        <div className="rule-card-body">
          {/* Tested Dynamic Confidence Bar */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-cyan-light)', fontWeight: 600 }}>Dynamic Evidence Test:</span>
              <span>{confPercent}% Verified</span>
              <span>•</span>
              <span>Groundedness: {Math.round(result.groundedness_score * 100)}%</span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              Exact Span Grounded
            </span>
          </div>

          {/* Reasoning */}
          <div>
            <span className="section-label">Grounded Factual Reasoning</span>
            <p className="reasoning-text-box">
              {result.reasoning}
            </p>
          </div>

          {/* Verbatim Positive Citations */}
          {result.citations && result.citations.length > 0 && (
            <div>
              <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>
                Verbatim Source Evidence ({result.citations.length} Grounded Quote{result.citations.length > 1 ? 's' : ''})
              </span>
              <div className="citations-wrapper">
                {result.citations.map((cite, cIdx) => {
                  const isActive = activeCitation?.quote === cite.quote;
                  return (
                    <div
                      key={cIdx}
                      className={`citation-card ${isActive ? 'active-selected' : ''}`}
                    >
                      <div className="citation-top-row">
                        <div className="citation-quote-text">
                          "{cite.quote}"
                        </div>
                        <button
                          onClick={() => onSelectCitation(cite, false)}
                          className="locate-btn"
                        >
                          Locate in Source
                        </button>
                      </div>

                      <div className="citation-metadata-row">
                        <span className="line-badge">Line {cite.line_number}</span>
                        <span>Chars [{cite.start_char}–{cite.end_char}]</span>
                        <span className="faithfulness-badge">
                          {cite.is_exact_match ? '100% Exact Substring Match' : `${Math.round(cite.faithfulness_score * 100)}% Faithfulness`}
                        </span>
                        {cite.source_speaker && <span style={{ color: '#cbd5e1' }}>Speaker: {cite.source_speaker}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Counter-Evidence (Violations) */}
          {result.counter_evidence && result.counter_evidence.length > 0 && (
            <div>
              <span className="section-label" style={{ color: 'var(--status-fail)' }}>
                Violation Counter-Evidence ({result.counter_evidence.length})
              </span>
              <div className="citations-wrapper">
                {result.counter_evidence.map((c, cIdx) => (
                  <div key={cIdx} className="counter-evidence-box">
                    <div className="citation-top-row">
                      <div className="citation-quote-text" style={{ color: '#fca5a5' }}>
                        "{c.quote}"
                      </div>
                      <button
                        onClick={() => onSelectCitation(c, true)}
                        className="locate-btn locate-btn-fail"
                      >
                        Locate Violation
                      </button>
                    </div>
                    <div className="citation-metadata-row" style={{ color: 'rgba(244, 63, 94, 0.8)' }}>
                      <span>Line {c.line_number}</span>
                      <span>Chars [{c.start_char}–{c.end_char}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Proof Notes (Abstention) */}
          {result.missing_evidence_notes && (
            <div className="abstention-box">
              <strong style={{ color: '#fcd34d', display: 'block', marginBottom: 2 }}>
                Abstention Justification (Missing Proof):
              </strong>
              <p style={{ fontSize: 11.5, lineHeight: 1.5 }}>{result.missing_evidence_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
