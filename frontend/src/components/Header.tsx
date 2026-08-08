import React from 'react';
import type { RulePack, SampleDocumentPreset } from '../types';

interface HeaderProps {
  rulePacks: RulePack[];
  selectedRulePackId: string;
  onSelectRulePack: (id: string) => void;
  sampleDocs: SampleDocumentPreset[];
  selectedSampleId: string;
  onSelectSampleDoc: (id: string) => void;
  onRunAudit: () => void;
  isAuditing: boolean;
  onOpenBenchmark: () => void;
  onOpenRuleManager: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onDeviseRules: () => void;
  isDevisingRules: boolean;
  hasDevisedRules: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  rulePacks,
  selectedRulePackId,
  onSelectRulePack,
  sampleDocs,
  selectedSampleId,
  onSelectSampleDoc,
  onRunAudit,
  isAuditing,
  onOpenBenchmark,
  onOpenRuleManager,
  onOpenExport,
  onOpenImport,
  onDeviseRules,
  isDevisingRules,
  hasDevisedRules,
}) => {
  return (
    <header className="app-header">
      {/* Brand & Shield */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="brand-title-wrap">
          <div className="brand-title-row">
            <span className="brand-name">VeriAudit</span>
            <span className="brand-badge">Zero-Hallucination</span>
          </div>
          <span className="brand-subtitle">Deterministic AI Compliance & Citation Verification Agent</span>
        </div>
      </div>

      {/* Controls & Action Buttons */}
      <div className="header-actions">
        {/* Auto-Devise Rules from Document Button */}
        <button
          onClick={onDeviseRules}
          disabled={isDevisingRules}
          className="btn-secondary"
          style={{
            borderColor: hasDevisedRules ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.35)',
            color: '#e9d5ff',
            background: hasDevisedRules ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.1)',
            boxShadow: hasDevisedRules ? '0 0 12px rgba(168, 85, 247, 0.3)' : 'none',
          }}
          title="Automatically analyze the document text and devise tailored, custom compliance rules"
        >
          {isDevisingRules ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing Clauses...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              ✨ {hasDevisedRules ? 'Rules Devised from Doc' : 'Auto-Devise Rules'}
            </>
          )}
        </button>

        {/* Import Document Action */}
        <button
          onClick={onOpenImport}
          className="btn-secondary"
          style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan-light)', background: 'rgba(6, 182, 212, 0.1)' }}
          title="Upload or import a local document / transcript"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Document
        </button>

        {/* Preset Sample Documents Dropdown */}
        <div className="custom-select-group">
          <span className="select-label">Sample Doc:</span>
          <select
            value={selectedSampleId}
            onChange={(e) => onSelectSampleDoc(e.target.value)}
            className="custom-select"
          >
            {sampleDocs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title.length > 32 ? doc.title.substring(0, 32) + '...' : doc.title}
              </option>
            ))}
            <option value="custom">✏️ Custom Document</option>
          </select>
        </div>

        {/* Rule Pack Selector */}
        <div className="custom-select-group">
          <span className="select-label">Active Rules:</span>
          <select
            value={selectedRulePackId}
            onChange={(e) => onSelectRulePack(e.target.value)}
            className="custom-select"
          >
            {rulePacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name} ({pack.rules.length} rules)
              </option>
            ))}
            <option value="custom">⚡ Devised / Custom Rule Suite</option>
          </select>
        </div>

        {/* Benchmark Suite Action */}
        <button
          onClick={onOpenBenchmark}
          className="btn-secondary"
          title="Run automated evaluation test suite with precision & hallucination metrics"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          Benchmarks
        </button>

        {/* Rule Pack Manager */}
        <button
          onClick={onOpenRuleManager}
          className="btn-secondary"
          title="Inspect or author custom compliance rules"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Rules
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="btn-secondary"
          title="Export audit report in PDF, Markdown, or JSON"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>

        {/* Run Audit Button */}
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="btn-primary"
        >
          {isAuditing ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 15, height: 15 }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Verifying...
            </>
          ) : (
            <>
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Audit Document
            </>
          )}
        </button>
      </div>
    </header>
  );
};
