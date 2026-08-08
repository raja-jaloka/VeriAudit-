import React, { useState, useEffect, useRef } from 'react';
import type { GroundedCitation } from '../types';

interface SplitPaneDocumentViewerProps {
  documentText: string;
  documentTitle: string;
  documentType: string;
  onTextChange: (newText: string) => void;
  cleanedText?: string;
  activeCitation?: GroundedCitation | null;
  activeCounterEvidence?: GroundedCitation | null;
  adversarialDetected?: boolean;
  injectionDetails?: string | null;
  isCustomDoc?: boolean;
}

export const SplitPaneDocumentViewer: React.FC<SplitPaneDocumentViewerProps> = ({
  documentText,
  documentTitle,
  documentType,
  onTextChange,
  cleanedText,
  activeCitation,
  activeCounterEvidence,
  adversarialDetected,
  injectionDetails,
  isCustomDoc = false,
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'cleaned'>('raw');
  const [selectedOffset, setSelectedOffset] = useState<{ start: number; end: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const displayText = viewMode === 'cleaned' && cleanedText ? cleanedText : documentText;
  const lines = displayText.split('\n');

  // Auto-scroll to active citation line when set
  useEffect(() => {
    if ((activeCitation || activeCounterEvidence) && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeCitation, activeCounterEvidence]);

  const activeLineNum = activeCounterEvidence?.line_number || activeCitation?.line_number;
  const activeQuote = activeCounterEvidence?.quote || activeCitation?.quote;
  const isFailQuote = !!activeCounterEvidence;

  // Handle user manual selection to inspect character offsets
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selectedStr = selection.toString();
      const idx = displayText.indexOf(selectedStr);
      if (idx !== -1) {
        setSelectedOffset({
          start: idx,
          end: idx + selectedStr.length,
          text: selectedStr.length > 35 ? selectedStr.substring(0, 35) + '...' : selectedStr,
        });
      }
    } else {
      setSelectedOffset(null);
    }
  };

  return (
    <div className="glass-panel">
      {/* Header bar */}
      <div className="doc-panel-header">
        <div className="doc-title-info">
          <div className="live-indicator-dot" />
          <span className="doc-title-text">{documentTitle}</span>
          <span className="doc-type-pill">{documentType}</span>
        </div>

        <div className="doc-panel-controls">
          {/* Offset Inspector pill */}
          {selectedOffset && (
            <div className="char-offset-badge">
              <span>Chars: [{selectedOffset.start}–{selectedOffset.end}]</span>
              <span style={{ opacity: 0.6 }}>({selectedOffset.end - selectedOffset.start} bytes)</span>
            </div>
          )}

          {/* Raw vs Cleaned view toggle */}
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('raw')}
              className={`segmented-btn ${viewMode === 'raw' ? 'active' : ''}`}
            >
              Raw Input
            </button>
            <button
              onClick={() => setViewMode('cleaned')}
              className={`segmented-btn ${viewMode === 'cleaned' ? 'active' : ''}`}
            >
              Cleaned (Normalized)
            </button>
          </div>
        </div>
      </div>

      {/* Adversarial Alert Banner */}
      {adversarialDetected && (
        <div className="adversarial-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>Adversarial Injection Detected & Neutralized: </strong>
            <span>{injectionDetails || 'Prompt injection attempt prevented. VeriAudit continues factual audit without manipulation.'}</span>
          </div>
        </div>
      )}

      {/* Document Content View */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="doc-content-scroller"
      >
        {isCustomDoc ? (
          <textarea
            value={documentText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your unstructured document, meeting transcript, or messy OCR text here..."
            className="doc-textarea"
          />
        ) : (
          <div className="doc-lines-list">
            {lines.map((line, idx) => {
              const lineNo = idx + 1;
              const isTargetLine = activeLineNum === lineNo;
              const lineContainsQuote = activeQuote && line.toLowerCase().includes(activeQuote.toLowerCase().trim());

              let highlightClass = '';
              if (isTargetLine || lineContainsQuote) {
                highlightClass = isFailQuote ? 'doc-line-highlight-fail' : 'doc-line-highlight-pass';
              }

              return (
                <div
                  key={idx}
                  ref={isTargetLine ? activeLineRef : null}
                  className={`doc-line-row ${highlightClass}`}
                >
                  {/* Line number gutter */}
                  <span className="doc-line-gutter">{lineNo}</span>

                  {/* Line text */}
                  <div className="doc-line-text">
                    {line.length > 0 ? line : <span className="doc-line-empty">empty line</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="doc-panel-footer">
        <div>
          <span>Lines: {lines.length}</span> • <span>Characters: {displayText.length}</span>
        </div>
        <div style={{ color: 'var(--accent-cyan-light)' }}>
          Click any citation in the report to highlight in source
        </div>
      </div>
    </div>
  );
};
