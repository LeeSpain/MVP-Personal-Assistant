
import { PlannerAction, ChatRequest, ChatResponse } from '../types';

export interface GenAIResponse {
  text: string;
  actions?: PlannerAction[];
}

export async function sendMessage(
  message: string, 
  context: string,
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
      throw new Error(`API Error: ${res.statusText}`);
    }

    const data: ChatResponse = await res.json();

    return {
      text: data.reply,
      actions: data.actions
    };

  } catch (error) {
    console.error("Gemini Service Error:", error);
    return {
      text: "I'm having trouble reaching the server right now. Please try again.",
      actions: []
    };
  }
}

// Export object for backward compatibility with App.tsx
export const geminiService = {
  sendMessage
};
