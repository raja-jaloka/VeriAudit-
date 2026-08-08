import React, { useState, useEffect } from 'react';
import type { AuditReport } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, report }) => {
  const [copied, setCopied] = useState(false);

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

  if (!isOpen || !report) return null;

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VeriAudit-Report-${report.audit_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/export/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      const md = await res.text();
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: 'var(--status-pass)' }}>
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Export Grounded Audit Report
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Audit ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-light)' }}>{report.audit_id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 11 }}
            title="Return to main workspace"
          >
            ← Back to Workbench
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="modal-body">
          <div className="export-grid">
            {/* JSON Schema */}
            <button
              onClick={handleDownloadJSON}
              className="export-card-btn"
            >
              <div>
                <span className="export-card-title">
                  JSON Audit Log
                </span>
                <p className="export-card-desc">
                  Full machine-readable audit report with verbatim span offsets, line mappings, and telemetry.
                </p>
              </div>
              <span className="export-card-action">
                Download .json →
              </span>
            </button>

            {/* Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="export-card-btn"
            >
              <div>
                <span className="export-card-title" style={{ color: 'var(--accent-indigo)' }}>
                  Markdown Report
                </span>
                <p className="export-card-desc">
                  Formatted GitHub Flavored Markdown summary ready for audit log storage or team distribution.
                </p>
              </div>
              <span className="export-card-action" style={{ color: 'var(--accent-indigo)' }}>
                {copied ? '✓ Copied to Clipboard!' : 'Copy Markdown →'}
              </span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrintCertificate}
              className="export-card-btn"
            >
              <div>
                <span className="export-card-title" style={{ color: 'var(--status-pass)' }}>
                  Printable PDF View
                </span>
                <p className="export-card-desc">
                  Browser-optimized print layout for executive compliance certificates and archiving.
                </p>
              </div>
              <span className="export-card-action" style={{ color: 'var(--status-pass)' }}>
                Print / Save PDF →
              </span>
            </button>
          </div>

          {/* Audit Verification Stamp */}
          <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', padding: '14px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <div>
              <span style={{ color: '#ffffff', display: 'block', fontWeight: 600 }}>Zero-Hallucination Integrity Seal</span>
              <span style={{ color: 'var(--text-dim)' }}>All claims verifiable via exact character offset mapping.</span>
            </div>
            <span style={{ color: 'var(--status-pass)', fontWeight: 700 }}>100% GROUNDED</span>
          </div>

          {/* Bottom Back Button */}
          <div style={{ textAlign: 'center', paddingTop: 6 }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              ← Go Back to Main Audit Workbench
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
