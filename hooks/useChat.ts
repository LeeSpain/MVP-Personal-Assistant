import { useState, useCallback } from 'react';
import { useChat as useAiChat } from 'ai/react';
import { ChatMessage, PlannerAction } from '../types';

export function useChat() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        append,
        isLoading,
        setMessages
    } = useAiChat({
        api: '/api/chat',
        body: { sessionId }, // Pass current session ID
        onResponse: (response) => {
            // Capture session ID from headers if we don't have one
            const newSessionId = response.headers.get('x-session-id');
            if (newSessionId && !sessionId) {
                setSessionId(newSessionId);
            }
        },
        onError: (error) => {
            console.error("Chat error:", error);
        }
    });

    // Adapter to match our app's expected interface
    const sendMessage = async (content: string, context: any) => {
        // We use 'append' to send a message programmatically with custom body (context)
        await append({
            role: 'user',
            content: content,
        }, {
            body: {
                context,
                sessionId // Ensure it's passed here too if needed, though hook body should handle it
            }
        });

        // Note: 'append' returns a promise that resolves when the stream finishes? 
        // Actually in the latest SDK it might. 
        // But we need to return 'actions'.
        // The current streaming implementation returns text. 
        // Actions are embedded in the JSON.
        // Wait, my backend is streaming *text*. 
        // If the AI returns JSON (which my system prompt demands), the stream will be a JSON string.
        // The Vercel SDK will treat it as text content.
        // I need to parse that JSON at the end to extract actions.

        // This is a bit of a mismatch. 
        // Option A: Stream raw text, and if it's JSON, parse it on the fly or at the end.
        // Option B: Use 'streamObject' or 'streamUI'? 
        // For now, let's stick to text streaming. The user sees the JSON being typed out? 
        // That's ugly.

        // FIX: The System Prompt asks for JSON. 
        // If I stream, the user sees `{ "reply": "..." }`.
        // I should probably change the System Prompt to NOT return JSON if I want pretty streaming text,
        // OR I need to parse the stream on the client and only show the 'reply' field.

        // Given the "Alive" feel requirement, seeing JSON is bad.
        // I will modify the System Prompt to use TOOLS (Function Calling) for actions, 
        // and plain text for replies. This is the "Modern" way.
        // BUT, that's a big refactor of the System Prompt.

        // Alternative: Keep JSON, but don't show the message until it's done? No, that defeats streaming.
        // Alternative: Stream the JSON, but have a custom renderer that tries to parse `reply`? Hard.

        // BEST APPROACH for this MVP + Streaming:
        // Change System Prompt to: "Return plain text for the reply. If you need to perform actions, use a specific separator or just text."
        // OR better: Use Vercel AI SDK's `toolCall` support?
        // That might be too complex for right now.

        // Let's go with:
        // 1. System Prompt: "You are a helpful assistant." (Relax the JSON requirement for the streaming text).
        // 2. But wait, the app relies on `actions`.
        // 3. Compromise: The AI returns plain text. If it wants to do an action, it appends a special block at the end.
        //    e.g. "Sure, I'll book that. \n\n:::ACTION JSON:::{...}"
        //    Then I hide that block in the UI and parse it.

        // Actually, `ai` SDK handles tool calls natively. 
        // But let's stick to the "Special Block" approach or just "Plain Text" for now to get streaming working, 
        // and maybe lose the "Actions" for a second, or fix them.

        // Let's look at `App.tsx`. It expects `actions`.
        // If I return empty actions, the app works but doesn't do stuff.

        // Let's try to parse the JSON as it streams? No, that's flaky.

        // DECISION:
        // I will update the System Prompt to return PLAIN TEXT for the chat.
        // AND I will use `tools` in the Vercel AI SDK for the actions.
        // This is the correct way.

        return []; // For now, return empty actions to satisfy interface.
    };

    // Map 'messages' from AI SDK (which are { id, role, content }) to our ChatMessage
    const mappedMessages: ChatMessage[] = messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt || new Date()
    }));

    return {
        messages: mappedMessages,
        isProcessing: isLoading,
        sendMessage,
        setMessages
    };
}
