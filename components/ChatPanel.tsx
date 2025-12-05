
"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import Card from "./Card";
import { ChatMessage } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  voiceInputEnabled: boolean;
  voiceOutputEnabled: boolean;
  isProcessing: boolean;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  voiceInputEnabled,
  voiceOutputEnabled,
  isProcessing
}: ChatPanelProps) {
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
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Card title="Chat">
      <div className="flex h-full flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3">
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
            <div className="text-xs text-slate-400 animate-pulse">Thinking…</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="mt-auto flex items-center gap-2 border-t border-slate-800 pt-3"
        >
          {voiceInputEnabled && hasRecognitionSupport && (
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2 rounded-full transition-all ${isListening
                ? "bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-500"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              🎤
            </button>
          )}

          <input
            className="flex-1 rounded-full bg-slate-900/80 px-3 py-2 text-sm outline-none ring-0 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600 text-slate-200"
            placeholder={isListening ? "Listening..." : "Type a message..."}
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
      </div>
    </Card>
  );
}
