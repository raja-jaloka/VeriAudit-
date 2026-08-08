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
  const [fileFormat, setFileFormat] = useState<string>('TXT');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setUploadError(null);

    const ext = (file.name.split('.').pop() || 'TXT').toLowerCase();
    setFileFormat(ext.toUpperCase());

    const isBinary = ext === 'pdf' || ext === 'docx' || ext === 'doc';

    // 1. For text-based formats (.txt, .md, .json, .csv, .tsv, .log), read instantly on client
    if (!isBinary) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setDocText(content);
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setDocTitle(cleanName);

          if (ext === 'json') setDocType('structured_json');
          else if (ext === 'csv' || ext === 'tsv') setDocType('tabular_data');
          else if (file.name.toLowerCase().includes('transcript')) setDocType('meeting_transcript');
          else if (file.name.toLowerCase().includes('policy')) setDocType('policy');
          else setDocType('unstructured_raw');
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. For binary formats (.pdf, .docx), use fast backend parser
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server failed to parse ${ext.toUpperCase()} file.`);
      }

      const data = await res.json();
      setDocText(data.text || '');
      setDocTitle(data.title || file.name.replace(/\.[^/.]+$/, ''));
      setDocType(data.doc_type || 'unstructured_raw');
    } catch (err: any) {
      console.error('File parse error:', err);
      setUploadError(`Failed to extract text from ${file.name}. You can paste text directly below.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
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
                Instant Multi-Format Document Ingestion
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Upload PDF, Word (.docx), CSV, JSON, Markdown, or meeting transcripts with instant character-offset mapping
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
          {/* Format Badges Support List */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}>
              📄 PDF (.pdf)
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
              📝 Word (.docx / .doc)
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#86efac', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
              📊 Excel / CSV (.csv, .tsv)
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 600 }}>
              🗄️ JSON (.json)
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 600 }}>
              📋 Text (.txt, .md, .log)
            </span>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: '2px dashed rgba(6, 182, 212, 0.4)',
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
              accept=".pdf,.docx,.doc,.csv,.tsv,.json,.txt,.md,.log"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--accent-cyan)' }}>
                {isUploading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', display: 'block' }}>
                {isUploading ? (
                  'Extracting structured text stream (< 15ms)...'
                ) : fileName ? (
                  `Loaded: ${fileName} [${fileFormat}] (${fileSize ? (fileSize / 1024).toFixed(1) + ' KB' : ''})`
                ) : (
                  'Drag and drop PDF, Word, CSV, JSON, or Text file here, or click to browse'
                )}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                Instant parsing extracts text streams, tables, XML paragraphs, and line offsets with zero delay
              </span>
            </label>
          </div>

          {uploadError && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: 11 }}>
              ⚠️ {uploadError}
            </div>
          )}

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
                placeholder="e.g. Master Services Agreement / Q3 Security Review"
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
                <option value="pdf_document">PDF Document / Report</option>
                <option value="word_document">Word Document (.docx)</option>
                <option value="contract">Legal Agreement / NDA</option>
                <option value="tabular_data">Spreadsheet / CSV Data</option>
                <option value="unstructured_raw">Raw Unstructured Text</option>
              </select>
            </div>
          </div>

          {/* Document Textarea Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Extracted Text & Line Stream Preview
              </label>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-light)' }}>
                {docText.length} characters • {docText.split('\n').length} lines
              </span>
            </div>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Extracted file text will appear here instantly, or paste text directly..."
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
              disabled={!docText.trim() || isUploading}
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
