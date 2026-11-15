import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  AlertTriangle
} from 'lucide-react';
import type { IndustryDataBundle, KnowledgeBasePillar } from '../types/orchestration';
import {
  buildDeterministicIngestionPreview,
  extractTextFromStructuredFile,
  mergePreviewIntoKnowledgeBase,
  PILLAR_TITLES,
  type KnowledgePillarId,
  type ParsedDocumentPreview
} from '../utils/ragIngestion';

interface KnowledgeBaseImporterProps {
  isOpen: boolean;
  onClose: () => void;
  industry: IndustryDataBundle;
  onCommitKnowledgeBase: (
    updatedPillars: KnowledgeBasePillar[],
    preview: ParsedDocumentPreview
  ) => void | Promise<void>;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Unable to read binary file "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Unable to read text file "${file.name}".`));
    reader.readAsText(file);
  });
}

export const KnowledgeBaseImporter: React.FC<KnowledgeBaseImporterProps> = ({
  isOpen,
  onClose,
  industry,
  onCommitKnowledgeBase
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('');
  const [targetPillar, setTargetPillar] = useState<KnowledgePillarId | 'auto'>('auto');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedDocumentPreview | null>(null);

  if (!isOpen) return null;

  const handleFileSelection = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setDocTitle(file.name);
    setErrorMessage(null);
    setPreview(null);
  };

  const handleParseWithRag = async () => {
    if (!selectedFile && !pastedText.trim()) {
      setErrorMessage('Select a local policy/performance document or paste document text to parse.');
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const fileName = selectedFile?.name || (docTitle.trim() || 'industry-policy-note.txt');
      const isPdf =
        selectedFile?.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

      let textContent = pastedText.trim();
      let base64Content = '';

      if (selectedFile) {
        if (isPdf) {
          base64Content = await readFileAsBase64(selectedFile);
        } else {
          const rawText = await readFileAsText(selectedFile);
          textContent = extractTextFromStructuredFile(selectedFile.name, rawText);
        }
      }

      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryName: industry.name,
          sector: industry.sector,
          targetPillarId: targetPillar,
          fileName,
          mimeType: selectedFile?.type || (isPdf ? 'application/pdf' : 'text/plain'),
          textContent,
          base64Content
        })
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `RAG server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.preview) {
        throw new Error('RAG pipeline returned an empty preview.');
      }
      setPreview(data.preview as ParsedDocumentPreview);
    } catch (err: any) {
      // If a text payload was supplied and backend is unreachable, still provide deterministic preview cleanly
      if (pastedText.trim() || (selectedFile && !selectedFile.name.toLowerCase().endsWith('.pdf'))) {
        try {
          const fallbackName = selectedFile?.name || docTitle.trim() || 'local-report.txt';
          const rawText =
            pastedText.trim() || (selectedFile ? await readFileAsText(selectedFile) : '');
          const localPreview = buildDeterministicIngestionPreview({
            fileName: fallbackName,
            textContent: extractTextFromStructuredFile(fallbackName, rawText),
            targetPillarId: targetPillar,
            industryName: industry.name
          });
          setPreview(localPreview);
          return;
        } catch {
          // Fall through to error display
        }
      }
      setErrorMessage(err?.message || 'Failed to parse document with RAG pipeline.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdatePreviewPillar = (nextPillarId: KnowledgePillarId) => {
    if (!preview) return;
    setPreview({
      ...preview,
      targetPillarId: nextPillarId,
      targetPillarTitle: PILLAR_TITLES[nextPillarId]
    });
  };

  const handleRemoveChunk = (chunkId: string) => {
    if (!preview) return;
    setPreview({
      ...preview,
      chunks: preview.chunks.filter((c) => c.id !== chunkId)
    });
  };

  const handleCommit = async () => {
    if (!preview || preview.chunks.length === 0) {
      setErrorMessage('Parse a document with at least one semantic chunk before updating the Knowledge Base.');
      return;
    }
    setIsCommitting(true);
    setErrorMessage(null);
    try {
      const updatedPillars = mergePreviewIntoKnowledgeBase(industry.knowledgeBase, preview);
      await onCommitKnowledgeBase(updatedPillars, preview);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update Knowledge Base pillars.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-importer-title"
      data-testid="kb-importer-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
              <h2 id="kb-importer-title" className="text-base font-bold text-slate-900">
                Import Industry Document into 5-Pillar AI Knowledge Base
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Select a local policy PDF, regulatory brief, or performance report for{' '}
              <strong className="text-slate-800">{industry.name}</strong> to parse via the RAG pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Knowledge Base Importer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* File Dropzone + Target Pillar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7 space-y-2">
              <label className="text-xs font-semibold text-slate-800 block">
                Local Document File (.pdf, .txt, .md, .csv, .json)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const dropped = e.dataTransfer.files?.[0] || null;
                  handleFileSelection(dropped);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border border-dashed p-5 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  data-testid="kb-importer-file-input"
                  accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json"
                  className="hidden"
                  onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center gap-1.5">
                  {selectedFile ? (
                    <>
                      <FileText className="w-6 h-6 text-emerald-600" />
                      <p className="text-xs font-semibold text-slate-900">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Click to replace file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-indigo-600" />
                      <p className="text-xs font-semibold text-slate-800">
                        Click to browse or drop a policy / performance report here
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports PDF, Markdown, CSV, JSON, and plain text documents
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-3">
              <div>
                <label htmlFor="kb-target-pillar" className="text-xs font-semibold text-slate-800 block mb-1">
                  Target Knowledge Pillar
                </label>
                <select
                  id="kb-target-pillar"
                  value={targetPillar}
                  onChange={(e) => setTargetPillar(e.target.value as KnowledgePillarId | 'auto')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">Auto-Classify via RAG Pipeline</option>
                  {(Object.keys(PILLAR_TITLES) as KnowledgePillarId[]).map((pid) => (
                    <option key={pid} value={pid}>
                      {PILLAR_TITLES[pid]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="kb-doc-title" className="text-xs font-semibold text-slate-800 block mb-1">
                  Source Label
                </label>
                <input
                  id="kb-doc-title"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. APRA_CPS_230_Resilience_Report.pdf"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Direct Excerpt / Report Content */}
          <div className="space-y-1.5">
            <label htmlFor="kb-paste-text" className="text-xs font-semibold text-slate-800 block">
              Document Excerpt or Policy Text (optional when uploading a file)
            </label>
            <textarea
              id="kb-paste-text"
              data-testid="kb-importer-textarea"
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste policy clauses, compliance deadlines, NPS telemetry, or quarterly performance metrics to ingest..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Extracts semantic vector chunks, updates pillar KPIs, and makes content searchable immediately.
            </span>
            <button
              type="button"
              data-testid="kb-parse-rag-btn"
              onClick={handleParseWithRag}
              disabled={isParsing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing via RAG...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse with RAG Pipeline</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed RAG Preview */}
          {preview && (
            <div
              data-testid="kb-rag-preview"
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>RAG Extraction Ready</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-600 font-medium">{preview.fileName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="kb-preview-pillar" className="text-[11px] text-slate-600 font-medium">
                    Assign Pillar:
                  </label>
                  <select
                    id="kb-preview-pillar"
                    value={preview.targetPillarId}
                    onChange={(e) => handleUpdatePreviewPillar(e.target.value as KnowledgePillarId)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-indigo-700"
                  >
                    {(Object.keys(PILLAR_TITLES) as KnowledgePillarId[]).map((pid) => (
                      <option key={pid} value={pid}>
                        {PILLAR_TITLES[pid]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Updated Metric Headline</span>
                  <span className="font-bold text-indigo-700 tabular-nums">{preview.metricHighlight}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Trend / Source Tag</span>
                  <span className="font-semibold text-slate-800">{preview.trendTag}</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Executive Summary</span>
                <p className="text-slate-800 leading-relaxed">{preview.summary}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Extracted Vector Chunks ({preview.chunks.length})</span>
                  <span className="text-slate-400">Indexed for Agent RAG Retrieval</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {preview.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 flex items-start justify-between gap-2"
                    >
                      <p className="leading-relaxed">{chunk.text}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveChunk(chunk.id)}
                        aria-label="Remove chunk"
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="kb-commit-btn"
            disabled={!preview || preview.chunks.length === 0 || isCommitting}
            onClick={handleCommit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {isCommitting
                ? 'Updating Knowledge Base...'
                : `Update ${preview ? preview.targetPillarTitle : '5-Pillar Knowledge Base'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
