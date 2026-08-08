import React, { useState, useEffect } from 'react';
import type { RulePack, RuleRequirement, SeverityLevel } from '../types';

interface RulePackManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePack: RulePack;
  onSaveCustomRules: (rules: RuleRequirement[]) => void;
}

export const RulePackManagerModal: React.FC<RulePackManagerModalProps> = ({
  isOpen,
  onClose,
  activePack,
  onSaveCustomRules,
}) => {
  const [rules, setRules] = useState<RuleRequirement[]>(activePack.rules);
  const [newRuleId, setNewRuleId] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCategory] = useState('Custom Policy');
  const [newRuleSeverity, setNewRuleSeverity] = useState<SeverityLevel>('HIGH');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleNegative, setNewRuleNegative] = useState('');
  const [newRulePositive, setNewRulePositive] = useState('');

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

  const handleAddRule = () => {
    if (!newRuleId || !newRuleName || !newRuleDesc) return;

    const created: RuleRequirement = {
      id: newRuleId,
      name: newRuleName,
      description: newRuleDesc,
      category: newRuleCategory,
      severity: newRuleSeverity,
      mandatory_keywords: newRuleKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      negative_constraints: newRuleNegative.split(',').map((k) => k.trim()).filter(Boolean),
      positive_indicators: newRulePositive.split(',').map((k) => k.trim()).filter(Boolean),
      min_confidence: 0.8,
    };

    const updated = [...rules, created];
    setRules(updated);
    onSaveCustomRules(updated);

    // Reset inputs
    setNewRuleId('');
    setNewRuleName('');
    setNewRuleDesc('');
    setNewRuleKeywords('');
    setNewRuleNegative('');
    setNewRulePositive('');
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    onSaveCustomRules(updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: 'var(--accent-indigo)' }}>
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Rule Pack Studio: {activePack.name}
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Inspect formal compliance requirements, trigger keywords, and author custom rules
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

        {/* Content */}
        <div className="modal-body">
          {/* Add New Rule Form */}
          <div style={{ background: 'rgba(10, 15, 26, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              + Add Custom Compliance Rule
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Rule ID</label>
                <input
                  type="text"
                  value={newRuleId}
                  onChange={(e) => setNewRuleId(e.target.value)}
                  placeholder="CUST-001"
                  style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Rule Name</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Dual Sign-off Policy"
                  style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Severity</label>
                <select
                  value={newRuleSeverity}
                  onChange={(e) => setNewRuleSeverity(e.target.value as SeverityLevel)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Requirement Description</label>
              <textarea
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="Describe exact criteria required for compliance..."
                rows={2}
                style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 11.5, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Mandatory Keywords</label>
                <input
                  type="text"
                  value={newRuleKeywords}
                  onChange={(e) => setNewRuleKeywords(e.target.value)}
                  placeholder="mfa, 2fa, key"
                  style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Positive Proof Indicators</label>
                <input
                  type="text"
                  value={newRulePositive}
                  onChange={(e) => setNewRulePositive(e.target.value)}
                  placeholder="enforced for all"
                  style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Negative Constraints (Violations)</label>
                <input
                  type="text"
                  value={newRuleNegative}
                  onChange={(e) => setNewRuleNegative(e.target.value)}
                  placeholder="password only"
                  style={{ width: '100%', background: '#0a0e1a', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11.5 }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleAddRule}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: 11.5 }}
              >
                Save & Add Rule
              </button>
            </div>
          </div>

          {/* Active Rules List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Active Rules in Pack ({rules.length})
            </h3>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'rgba(10, 15, 26, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan-light)', fontSize: 11 }}>{r.id}</span>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: 12.5 }}>{r.name}</span>
                    <span className={`rule-severity-tag ${r.severity === 'CRITICAL' ? 'severity-critical' : 'severity-high'}`}>
                      {r.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.description}</p>
                </div>

                <button
                  onClick={() => handleDeleteRule(r.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}
                  title="Remove rule"
                >
                  ✕
                </button>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
};
