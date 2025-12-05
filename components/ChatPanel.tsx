// components/ChatPanel.tsx
"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import Card from "./Card";
import { ChatMessage } from "../types";

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
    await onSendMessage(text);
  }

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
          <input
            className="flex-1 rounded-full bg-slate-900/80 px-3 py-2 text-sm outline-none ring-0 focus:ring-2 focus:ring-violet-500 text-slate-100 placeholder-slate-500"
            placeholder="Ask anything or describe what you want to do…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            Send
          </button>
        </form>
      </div>
    </Card>
  );
}
