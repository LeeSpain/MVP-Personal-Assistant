// components/ChatPanel.tsx
"use client";

import { FormEvent, useState } from "react";
import Card from "./Card";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your personal assistant. Tell me what you want to plan, remember, or understand and I'll help you break it into steps.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reach AI");
      }

      const data = await res.json();
      const replyContent =
        data?.reply?.content ??
        "I’m here, but I couldn’t parse a reply from the model.";

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content:
          typeof replyContent === "string"
            ? replyContent
            : Array.isArray(replyContent)
            ? replyContent.map((c: any) => c?.text ?? "").join("\n")
            : String(replyContent),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Chat">
      <div className="flex h-full flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-slate-400">Thinking…</div>
          )}
          {error && (
            <div className="text-xs text-red-400">Error: {error}</div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="mt-auto flex items-center gap-2 border-t border-slate-800 pt-3"
        >
          <input
            className="flex-1 rounded-full bg-slate-900/80 px-3 py-2 text-sm outline-none ring-0 focus:ring-2 focus:ring-violet-500"
            placeholder="Ask anything or describe what you want to do…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </Card>
  );
}
