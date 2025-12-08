// services/geminiService.ts
// Generic agent client used by Command Palette, Insights, and Summaries.
// It calls /api/chat on the server, which then chooses Gemini / OpenAI / DeepSeek.

import { PlannerAction, ChatRequest, ChatResponse } from '../types';

export interface GenAIResponse {
  text: string;
  actions?: PlannerAction[];
}

/**
 * High-level sendMessage helper.
 *
 * @param message The main instruction/prompt (string).
 * @param context Any extra context (object or string).
 * @param history Optional short chat history (role + content).
 */
export async function sendMessage(
  message: string,
  context: any,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<GenAIResponse> {
  try {
    // Build messages array for /api/chat from context + history + message
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] =
      [];

    if (context) {
      const ctxString =
        typeof context === 'string'
          ? context
          : JSON.stringify(context, null, 2);

      messages.push({
        role: 'system',
        content: `Context:\n${ctxString}`,
      });
    }

    if (history && Array.isArray(history)) {
      for (const h of history) {
        messages.push({
          role: h.role,
          content: h.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('geminiService.sendMessage error payload:', data);
      throw new Error(data.detail || data.error || 'Unknown agent error');
    }

    // /api/chat returns { reply, actions?, provider }
    const text: string = data.reply || '';
    const actions: PlannerAction[] = data.actions || [];

    return { text, actions };
  } catch (error: any) {
    console.error('Gemini Service Error:', error);
    return {
      text: `Error: ${error.message || 'Unknown error occurred'}`,
      actions: [],
    };
  }
}

// Export object for backward compatibility with App.tsx
export const geminiService = {
  sendMessage,
};
