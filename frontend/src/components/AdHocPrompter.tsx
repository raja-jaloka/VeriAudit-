import React, { useState } from 'react';
import type { RuleAuditResult } from '../types';

interface AdHocPrompterProps {
  documentText: string;
  documentTitle: string;
  documentType: string;
  onAddPromptRule: (result: RuleAuditResult) => void;
}

export const AdHocPrompter: React.FC<AdHocPrompterProps> = ({
  documentText,
  documentTitle,
  documentType,
  onAddPromptRule,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samplePrompts = [
    'Did anyone book a flight over $500?',
    'What is the homework assignment and rubric criteria?',
    'Did Gatsby discuss his war background with Nick?',
    'Is MFA strictly enforced for production consoles?',
    'Are there any unitemized expense claims?',
  ];

  const handleExecutePrompt = async (queryToRun: string = prompt) => {
    if (!queryToRun.trim() || !documentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:8000/api/prompt-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: documentText,
          prompt: queryToRun,
          document_title: documentTitle,
          document_type: documentType,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to run ad-hoc prompt audit');
      }

      const result: RuleAuditResult = await res.json();
      onAddPromptRule(result);
      setPrompt('');
    } catch (err) {
      console.error('Ad-hoc prompt audit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecutePrompt();
    }
  };

  return (
    <div
      style={{
        background: 'rgba(10, 15, 26, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
            }}
          >
            Ad-Hoc Natural Language Rule Prompter
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 10,
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan-light)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            Instant Grounding &lt; 2ms
          </span>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Type any custom question or compliance check on the active document
        </span>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 'What is the required homework?' or 'Did anyone purchase first class flights?'"
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 12.5,
              color: '#ffffff',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
        </div>

        <button
          onClick={() => handleExecutePrompt()}
          disabled={!prompt.trim() || isSubmitting}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: 12,
            opacity: !prompt.trim() || isSubmitting ? 0.6 : 1,
            cursor: !prompt.trim() || isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? (
            <span>Auditing...</span>
          ) : (
            <>
              <span>⚡ Audit Prompt</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>(Enter)</span>
            </>
          )}
        </button>
      </div>

      {/* Sample clickable prompt pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
          Try Examples:
        </span>
        {samplePrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrompt(sp);
              handleExecutePrompt(sp);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 10.5,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {sp}
          </button>
        ))}
      </div>
    </div>
  );
};
