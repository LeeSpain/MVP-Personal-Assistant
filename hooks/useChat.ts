import { useState, useCallback } from 'react';
import { ChatMessage, PlannerAction } from '../types';

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const sendMessage = async (content: string) => {
        setIsProcessing(true);

        // Optimistic user message
        const tempId = Date.now().toString();
        const userMsg: ChatMessage = {
            id: tempId,
            role: 'user',
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            // 1. Send to our backend to persist user message
            const saveRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    role: 'user',
                    sessionId
                }),
            });

            const saveData = await saveRes.json();
            if (saveData.sessionId && !sessionId) {
                setSessionId(saveData.sessionId);
            }

            // 2. Call AI (This part is tricky - usually we'd have a single endpoint that does both:
            // saves user msg, calls AI, saves AI msg, returns AI msg.
            // For now, let's assume we call a separate AI endpoint or the same one handles it.)

            // Let's use the existing /api/ai/chat logic but routed through our new structure?
            // Actually, the user's request is to connect frontend to backend.
            // The best approach is: Frontend -> /api/chat (saves user msg) -> Calls AI Service -> Saves AI msg -> Returns AI msg.

            // So we should probably refactor /api/chat/route.ts to handle the AI logic too.
            // But for this step, let's just ensure we are hitting an endpoint that returns a reply.

            const aiRes = await fetch('/api/ai/chat', { // Using the existing AI endpoint for intelligence
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            const aiData = await aiRes.json();

            // 3. Save AI response to DB
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: aiData.reply,
                    role: 'assistant',
                    sessionId: saveData.sessionId || sessionId
                }),
            });

            const aiMsg: ChatMessage = {
                id: Date.now().toString() + 'ai',
                role: 'assistant',
                content: aiData.reply,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);
            return aiData.actions as PlannerAction[];

        } catch (error) {
            console.error(error);
            return [];
        } finally {
            setIsProcessing(false);
        }
    };

    return { messages, isProcessing, sendMessage, setMessages };
}
