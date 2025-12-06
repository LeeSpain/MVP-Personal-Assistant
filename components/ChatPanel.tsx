
"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import Card from "./Card";
import { ChatMessage } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useLanguage } from "../contexts/LanguageContext";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  voiceInputEnabled: boolean;
  voiceOutputEnabled: boolean;
  onToggleVoiceOutput: () => void;
  onOpenHistory?: () => void;
  onOpenVoiceMode?: () => void;
  isProcessing: boolean;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  voiceInputEnabled,
  voiceOutputEnabled,
  onToggleVoiceOutput,
  onOpenHistory,
  onOpenVoiceMode,
  isProcessing
}: ChatPanelProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Input Hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition();

  // Sync transcript to input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const text = input;
    setInput("");
    resetTranscript(); // Clear voice transcript
    await onSendMessage(text);
  }

  const handleMicClick = () => {
    if (onOpenVoiceMode) {
      onOpenVoiceMode();
    } else {
      // Fallback to old behavior if prop not provided (though it should be)
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  return (
    <Card title={t('nav.chat')} className="relative">
      <div className="absolute top-0 right-0 z-10 flex gap-2">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="text-xs p-1.5 rounded-full bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="View Chat History"
          >
            🕰️
          </button>
        )}
        <button
          onClick={onToggleVoiceOutput}
          className={`text-xs p-1.5 rounded-full transition-colors ${voiceOutputEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          title={voiceOutputEnabled ? "Mute Voice Output" : "Enable Voice Output"}
        >
          {voiceOutputEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 min-h-0 custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user"
                ? "bg-violet-500 text-white"
                : "bg-slate-800 text-slate-100"
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="text-xs text-slate-400 animate-pulse">{t('chat.thinking')}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="mt-auto flex items-center gap-2 border-t border-slate-800 pt-3 shrink-0"
      >
        {hasRecognitionSupport && (
          <button
            type="button"
            onClick={voiceInputEnabled ? handleMicClick : undefined}
            className={`p-2 rounded-full transition-all ${!voiceInputEnabled
              ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
              : isListening
                ? "bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-500"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            title={
              !voiceInputEnabled
                ? "Enable voice input in Settings"
                : isListening
                  ? "Stop Listening"
                  : "Start Listening"
            }
          >
            🎤
          </button>
        )}

        <input
          className="flex-1 rounded-full bg-slate-900/80 px-3 py-2 text-sm outline-none ring-0 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600 text-slate-200"
          placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>

      {/* Context Hints */}
      <div className="mt-2 px-2 text-[10px] text-slate-500 text-center shrink-0">
        <span className="opacity-70">Try saying: </span>
        <span className="italic text-slate-400">
          "{t('chat.hints')[Math.floor(Math.random() * 4)]}"
        </span>
      </div>
    </Card>
  );
}
