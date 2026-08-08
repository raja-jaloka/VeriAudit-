import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SplitPaneDocumentViewer } from './components/SplitPaneDocumentViewer';
import { AuditReportView } from './components/AuditReportView';
import { BenchmarkModal } from './components/BenchmarkModal';
import { RulePackManagerModal } from './components/RulePackManagerModal';
import { ExportModal } from './components/ExportModal';
import { ImportDocumentModal } from './components/ImportDocumentModal';
import type {
  AuditReport,
  RulePack,
  SampleDocumentPreset,
  GroundedCitation,
  RuleRequirement,
} from './types';

const API_BASE = 'http://localhost:8000/api';

export const App: React.FC = () => {
  const [rulePacks, setRulePacks] = useState<RulePack[]>([]);
  const [selectedRulePackId, setSelectedRulePackId] = useState<string>('procurement_expense');
  const [sampleDocs, setSampleDocs] = useState<SampleDocumentPreset[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('procurement_zoom_transcript');

  const [documentText, setDocumentText] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('Q3 Procurement Review - Zoom Transcript');
  const [documentType, setDocumentType] = useState<string>('meeting_transcript');
  const [cleanedText, setCleanedText] = useState<string>('');

  const [customRules, setCustomRules] = useState<RuleRequirement[] | null>(null);
  const [isDevisingRules, setIsDevisingRules] = useState<boolean>(false);
  const [hasDevisedRules, setHasDevisedRules] = useState<boolean>(false);

  const [report, setReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const [activeCitation, setActiveCitation] = useState<GroundedCitation | null>(null);
  const [activeCounterEvidence, setActiveCounterEvidence] = useState<GroundedCitation | null>(null);

  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isRuleManagerOpen, setIsRuleManagerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  // 1. Initial data fetch: Rule Packs & Sample Presets
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [packsRes, docsRes] = await Promise.all([
          fetch(`${API_BASE}/rule-packs`),
          fetch(`${API_BASE}/sample-documents`),
        ]);

        if (packsRes.ok && docsRes.ok) {
          const packsData: RulePack[] = await packsRes.json();
          const docsData: SampleDocumentPreset[] = await docsRes.json();

          setRulePacks(packsData);
          setSampleDocs(docsData);

          if (docsData.length > 0) {
            const first = docsData[0];
            setSelectedSampleId(first.id);
            setDocumentText(first.text);
            setDocumentTitle(first.title);
            setDocumentType(first.doc_type);
            setSelectedRulePackId(first.rule_pack_id);

            // Auto-run initial audit for instant demonstration
            runAudit(first.text, first.title, first.doc_type, first.rule_pack_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Handle Preset Sample Selection
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setHasDevisedRules(false);
    if (sampleId === 'custom') {
      setDocumentText('');
      setDocumentTitle('Custom Document');
      setDocumentType('unstructured_raw');
      setReport(null);
      return;
    }

    const matched = sampleDocs.find((d) => d.id === sampleId);
    if (matched) {
      setDocumentText(matched.text);
      setDocumentTitle(matched.title);
      setDocumentType(matched.doc_type);
      setSelectedRulePackId(matched.rule_pack_id);
      runAudit(matched.text, matched.title, matched.doc_type, matched.rule_pack_id);
    }
  };

  // Handle Imported Document Upload
  const handleImportDocument = (text: string, title: string, docType: string) => {
    setSelectedSampleId('custom');
    setDocumentText(text);
    setDocumentTitle(title);
    setDocumentType(docType);
    setHasDevisedRules(false);
    runAudit(text, title, docType, selectedRulePackId, customRules);
  };

  // Handle Rule Pack Selection
  const handleSelectRulePack = (packId: string) => {
    setSelectedRulePackId(packId);
    setCustomRules(null);
    setHasDevisedRules(false);
    runAudit(documentText, documentTitle, documentType, packId);
  };

  // Auto-Devise Rules directly from the Document
  const handleDeviseRules = async () => {
    if (!documentText.trim()) return;

    setIsDevisingRules(true);
    try {
      const res = await fetch(`${API_BASE}/devise-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: documentText,
          document_title: documentTitle,
          document_type: documentType,
        }),
      });

      if (res.ok) {
        const devisedPack: RulePack = await res.json();
        setCustomRules(devisedPack.rules);
        setSelectedRulePackId('custom');
        setHasDevisedRules(true);

        // Run audit against the dynamically devised rules with tested confidence scores
        runAudit(documentText, documentTitle, documentType, 'custom', devisedPack.rules);
      }
    } catch (err) {
      console.error('Failed to devise rules:', err);
    } finally {
      setIsDevisingRules(false);
    }
  };

  // Execute Grounded Audit with dynamic confidence testing
  const runAudit = async (
    textToAudit: string = documentText,
    title: string = documentTitle,
    docType: string = documentType,
    packId: string = selectedRulePackId,
    overrideRules: RuleRequirement[] | null = customRules
  ) => {
    if (!textToAudit.trim()) return;

    setIsAuditing(true);
    setActiveCitation(null);
    setActiveCounterEvidence(null);

    try {
      const payload: any = {
        document_text: textToAudit,
        document_title: title,
        document_type: docType,
        rule_pack_id: packId,
      };

      if (overrideRules && overrideRules.length > 0) {
        payload.custom_rules = overrideRules;
      }

      const res = await fetch(`${API_BASE}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Audit execution failed');
      }

      const auditData: AuditReport = await res.json();
      setReport(auditData);
      setCleanedText(auditData.cleaned_text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Citation selection for bi-directional scroll & glow
  const handleSelectCitation = (
    citation: GroundedCitation | null,
    isCounter: boolean = false
  ) => {
    if (isCounter) {
      setActiveCounterEvidence(citation);
      setActiveCitation(null);
    } else {
      setActiveCitation(citation);
      setActiveCounterEvidence(null);
    }
  };

  const activePack = rulePacks.find((p) => p.id === selectedRulePackId) || {
    id: 'custom',
    name: hasDevisedRules ? '✨ Document-Devised Rules' : 'Custom Policy Rules',
    version: '1.0.0',
    description: 'Rules devised and analyzed directly from document',
    rules: customRules || [],
  };

  return (
    <div className="app-wrapper">
      {/* Top Navbar Header */}
      <Header
        rulePacks={rulePacks}
        selectedRulePackId={selectedRulePackId}
        onSelectRulePack={handleSelectRulePack}
        sampleDocs={sampleDocs}
        selectedSampleId={selectedSampleId}
        onSelectSampleDoc={handleSelectSample}
        onRunAudit={() => runAudit()}
        isAuditing={isAuditing}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenRuleManager={() => setIsRuleManagerOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onDeviseRules={handleDeviseRules}
        isDevisingRules={isDevisingRules}
        hasDevisedRules={hasDevisedRules}
      />

      {/* Main Split-Pane Layout */}
      <main className="main-container">
        {/* Left Column: Interactive Source Document Viewer */}
        <section style={{ height: '100%' }}>
          <SplitPaneDocumentViewer
            documentText={documentText}
            documentTitle={documentTitle}
            documentType={documentType}
            onTextChange={(newText) => setDocumentText(newText)}
            cleanedText={cleanedText}
            activeCitation={activeCitation}
            activeCounterEvidence={activeCounterEvidence}
            adversarialDetected={report?.adversarial_injection_detected}
            injectionDetails={report?.injection_details}
            isCustomDoc={selectedSampleId === 'custom'}
          />
        </section>

        {/* Right Column: Verifiable Grounded Audit Report View */}
        <section style={{ height: '100%' }}>
          <AuditReportView
            report={report}
            isLoading={isAuditing}
            onSelectCitation={handleSelectCitation}
            activeCitation={activeCitation}
          />
        </section>
      </main>

      {/* Import Document Modal */}
      <ImportDocumentModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportDocument}
      />

      {/* Benchmark Evaluation Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* Rule Pack Studio Modal */}
      <RulePackManagerModal
        isOpen={isRuleManagerOpen}
        onClose={() => setIsRuleManagerOpen(false)}
        activePack={activePack}
        onSaveCustomRules={(updated) => {
          setCustomRules(updated);
          runAudit(documentText, documentTitle, documentType, selectedRulePackId, updated);
        }}
      />

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        report={report}
      />
    </div>
  );
};

export default App;
