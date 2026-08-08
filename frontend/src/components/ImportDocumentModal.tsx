import React, { useState, useEffect } from 'react';

interface ImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string, title: string, docType: string) => void;
}

export const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [docText, setDocText] = useState('');
  const [docTitle, setDocTitle] = useState('Imported Document');
  const [docType, setDocType] = useState('unstructured_raw');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

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

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setDocTitle(nameWithoutExt);

    // Detect type
    if (file.name.toLowerCase().includes('transcript')) {
      setDocType('meeting_transcript');
    } else if (file.name.toLowerCase().includes('policy')) {
      setDocType('policy');
    } else if (file.name.toLowerCase().includes('nda') || file.name.toLowerCase().includes('contract')) {
      setDocType('contract');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleConfirm = () => {
    if (!docText.trim()) return;
    onImport(docText, docTitle, docType);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div
              className="modal-icon-badge"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: 'var(--accent-cyan)',
              }}
            >
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Import & Extract Unstructured Document
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Upload transcripts, policies, OCR scans, or contracts to run zero-hallucination compliance audits
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

        {/* Modal Body */}
        <div className="modal-body">
          {/* Drag & Drop File Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: '2px dashed rgba(6, 182, 212, 0.35)',
              borderRadius: 14,
              padding: '24px 20px',
              textAlign: 'center',
              background: 'rgba(6, 182, 212, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv,.log,.pdf"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--accent-cyan)' }}>
                <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', display: 'block' }}>
                {fileName ? `Selected: ${fileName} (${fileSize ? (fileSize / 1024).toFixed(1) + ' KB' : ''})` : 'Drag and drop your file here, or click to browse'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                Supports raw text, meeting transcripts, markdown, OCR text, policy files (.txt, .md, .json, .log)
              </span>
            </label>
          </div>

          {/* Document Metadata Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Q3 Executive Procurement Transcript"
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Document Classification
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#ffffff',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="meeting_transcript">Meeting Transcript (Audio/Speech)</option>
                <option value="policy">Security & Governance Policy</option>
                <option value="ocr_scan">Scanned OCR Contract</option>
                <option value="clinical">Clinical Healthcare Record</option>
                <option value="unstructured_raw">Raw Unstructured Text</option>
              </select>
            </div>
          </div>

          {/* Document Textarea Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Document Content / Raw Text Preview
              </label>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-light)' }}>
                {docText.length} characters • {docText.split('\n').length} lines
              </span>
            </div>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste or edit unstructured text here..."
              rows={8}
              style={{
                width: '100%',
                background: 'rgba(10, 15, 26, 0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#f1f5f9',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              ← Go Back to Audit Workbench
            </button>

            <button
              onClick={handleConfirm}
              disabled={!docText.trim()}
              className="btn-primary"
            >
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Import & Run Verifiable Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
