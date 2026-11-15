import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';
import {
  buildIndustryChatContext,
  GEMINI_CHAT_MODELS,
  SYSTEM_INSTRUCTION_PRESETS,
  type GeminiChatModelId
} from '../utils/geminiChatConfig';
import {
  appendChatMessageInFirestore,
  createChatSessionInFirestore,
  deleteChatSessionInFirestore,
  subscribeToChatMessages,
  subscribeToUserChatSessions,
  updateChatSessionConfigInFirestore,
  type PersistedChatSession
} from '../services/firestorePersistence';

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  fedPillars: Record<string, boolean>;
}

interface LocalChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  model: GeminiChatModelId;
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  industry,
  nodesMap,
  fedPillars
}) => {
  const { user, authReady } = useFirebase();
  const isVerifiedUser = Boolean(authReady && user && user.emailVerified);

  const [selectedModel, setSelectedModel] = useState<GeminiChatModelId>('gemini-4-hydrogen');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SYSTEM_INSTRUCTION_PRESETS[0].id);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    SYSTEM_INSTRUCTION_PRESETS[0].instruction
  );
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState<boolean>(false);
  const [includeIndustryContext, setIncludeIndustryContext] = useState<boolean>(true);

  const [sessions, setSessions] = useState<PersistedChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const industryContextString = useMemo(
    () => buildIndustryChatContext(industry, nodesMap, fedPillars),
    [industry, nodesMap, fedPillars]
  );

  // Subscribe to Firestore chat sessions when authenticated
  useEffect(() => {
    if (!isOpen || !isVerifiedUser || !user) return;

    const unsubscribe = subscribeToUserChatSessions(
      user.uid,
      (loadedSessions) => {
        setSessions(loadedSessions);
        if (!activeSessionId && loadedSessions.length > 0) {
          const latest = loadedSessions[0];
          setActiveSessionId(latest.id);
          setSelectedModel(latest.model);
          setSelectedPresetId(latest.rolePresetId);
          setSystemInstruction(latest.systemInstruction);
        }
      },
      (err) => {
        setChatError(err.message);
      }
    );
    return () => unsubscribe();
  }, [isOpen, isVerifiedUser, user, activeSessionId]);

  // Subscribe to Firestore messages for active session
  useEffect(() => {
    if (!isOpen || !isVerifiedUser || !user || !activeSessionId) return;

    const unsubscribe = subscribeToChatMessages(
      user.uid,
      activeSessionId,
      (loadedMessages) => {
        setMessages(
          loadedMessages.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.text,
            model: m.model
          }))
        );
      },
      (err) => {
        setChatError(err.message);
      }
    );
    return () => unsubscribe();
  }, [isOpen, isVerifiedUser, user, activeSessionId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!isOpen) return null;

  const activeModelMeta =
    GEMINI_CHAT_MODELS.find((m) => m.id === selectedModel) || GEMINI_CHAT_MODELS[0];

  const handleSelectPreset = (presetId: string) => {
    const preset = SYSTEM_INSTRUCTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setSystemInstruction(preset.instruction);
    setSelectedModel(preset.recommendedModel);
    if (isVerifiedUser && user && activeSessionId) {
      void updateChatSessionConfigInFirestore({
        uid: user.uid,
        sessionId: activeSessionId,
        model: preset.recommendedModel,
        rolePresetId: preset.id,
        systemInstruction: preset.instruction,
        industryContext: industry.name
      }).catch((err) => console.error('Failed to update chat preset:', err));
    }
  };

  const handleStartNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setChatError(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!isVerifiedUser || !user) return;
    try {
      await deleteChatSessionInFirestore(user.uid, sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setChatError(err?.message || 'Unable to delete chat session.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setChatError(null);
    setInputText('');
    setIsSending(true);

    const priorHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    const userMsg: LocalChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: trimmed,
      model: selectedModel
    };
    setMessages((prev) => [...prev, userMsg]);

    let sessionId = activeSessionId;
    if (isVerifiedUser && user) {
      try {
        if (!sessionId) {
          sessionId = `chat_${Date.now()}`;
          await createChatSessionInFirestore({
            uid: user.uid,
            sessionId,
            title: trimmed.slice(0, 72),
            model: selectedModel,
            rolePresetId: selectedPresetId,
            systemInstruction,
            industryContext: industry.name
          });
          setActiveSessionId(sessionId);
        }
        await appendChatMessageInFirestore({
          uid: user.uid,
          sessionId,
          messageId: userMsg.id,
          role: 'user',
          text: trimmed,
          model: selectedModel,
          nextMessageCount: priorHistory.length + 1,
          updatedTitle: priorHistory.length === 0 ? trimmed.slice(0, 72) : undefined
        });
      } catch (persistErr: any) {
        console.error('Failed to persist user message:', persistErr);
      }
    }

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          systemInstruction,
          history: priorHistory,
          message: trimmed,
          industryContext: includeIndustryContext ? industryContextString : ''
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Gemini chat returned HTTP ${response.status}`);
      }

      const replyMsg: LocalChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: String(data.reply || ''),
        model: (data.model as GeminiChatModelId) || selectedModel
      };
      setMessages((prev) => [...prev, replyMsg]);

      if (isVerifiedUser && user && sessionId) {
        await appendChatMessageInFirestore({
          uid: user.uid,
          sessionId,
          messageId: replyMsg.id,
          role: 'model',
          text: replyMsg.text,
          model: replyMsg.model,
          nextMessageCount: priorHistory.length + 2
        });
      }
    } catch (err: any) {
      setChatError(err?.message || 'Unable to reach Gemini chat backend.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-copilot-title"
      data-testid="gemini-chatbot-drawer"
    >
      <div className="bg-white w-full max-w-2xl h-full flex flex-col border-l border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
              <h2 id="gemini-copilot-title" className="text-sm font-bold text-slate-900">
                Gemini Strategy &amp; OKR Copilot
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Multi-turn conversation grounded in {industry.name} ({industry.quarter})
              {isVerifiedUser ? ' · Synced to Firestore' : ' · Local session'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleStartNewSession}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Gemini Copilot"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model & Role System Instruction Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="gemini-model-select" className="text-[11px] font-semibold text-slate-600 block mb-1">
                Gemini Model (Task Complexity)
              </label>
              <select
                id="gemini-model-select"
                data-testid="gemini-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiChatModelId)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GEMINI_CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.tier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gemini-role-select" className="text-[11px] font-semibold text-slate-600 block mb-1">
                Agent Role System Instruction
              </label>
              <select
                id="gemini-role-select"
                data-testid="gemini-role-select"
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SYSTEM_INSTRUCTION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>{activeModelMeta.recommendedFor}</span>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={includeIndustryContext}
                  onChange={(e) => setIncludeIndustryContext(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ground in {industry.name} data</span>
              </label>

              <button
                type="button"
                onClick={() => setIsEditingSystemPrompt((prev) => !prev)}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{isEditingSystemPrompt ? 'Hide Prompt' : 'Edit Instruction'}</span>
              </button>
            </div>
          </div>

          {isEditingSystemPrompt && (
            <textarea
              rows={2}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              aria-label="Custom system instruction"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {/* Signed-in Saved Sessions Strip */}
          {isVerifiedUser && sessions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">Saved:</span>
              {sessions.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] shrink-0 ${
                    s.id === activeSessionId
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setSelectedModel(s.model);
                      setSelectedPresetId(s.rolePresetId);
                      setSystemInstruction(s.systemInstruction);
                    }}
                    className="max-w-[140px] truncate cursor-pointer"
                  >
                    {s.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSession(s.id)}
                    aria-label={`Delete session ${s.title}`}
                    className="text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                Ask Gemini about {industry.name} OKRs, Risks, or 5-Pillar Knowledge
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Start a multi-turn strategy discussion. Switch between{' '}
                <strong className="text-slate-800">Gemini 4 Hydrogen</strong>,{' '}
                <strong className="text-slate-800">Gemini 4 Argon</strong>,{' '}
                <strong className="text-slate-800">Gemini 4 Carbon</strong>, and{' '}
                <strong className="text-slate-800">Gemini 3.1 Flash Lite</strong> anytime.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  `Audit the most critical Behind OKR in ${industry.name} and propose remediation timings.`,
                  `Synthesize key takeaways across our 5-Pillar Knowledge Base for ${industry.quarter}.`,
                  `What trade-offs should we make between capital budget and squad capacity overload?`,
                  `Draft an executive 3-bullet status brief for ${industry.name} leadership.`
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(prompt)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-[11px] text-slate-700 font-medium cursor-pointer transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-medium">
                    <span>{msg.role === 'user' ? 'You' : msg.model}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{selectedModel} is reasoning...</span>
            </div>
          )}

          {chatError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{chatError}</span>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Composer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-end gap-2">
          <textarea
            rows={2}
            data-testid="gemini-chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage(e);
              }
            }}
            placeholder={`Message ${selectedModel} about ${industry.name}... (Enter to send)`}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            type="submit"
            data-testid="gemini-chat-send-btn"
            disabled={!inputText.trim() || isSending}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
