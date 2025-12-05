
import { PlannerAction, ChatRequest, ChatResponse } from '../types';

export interface GenAIResponse {
  text: string;
  actions?: PlannerAction[];
}

export async function sendMessage(
  message: string,

  context: any,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<GenAIResponse> {

  try {
    const payload: ChatRequest = {
      message,
      context,
      history
    };

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data: ChatResponse = await res.json();

    return {
      text: data.reply,
      actions: data.actions
    };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return {
      text: `Error: ${error.message || "Unknown error occurred"}`,
      actions: []
    };
  }
}

// Export object for backward compatibility with App.tsx
export const geminiService = {
  sendMessage
};
