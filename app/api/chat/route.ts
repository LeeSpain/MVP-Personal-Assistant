import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: any;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, context } = body || {};

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No messages provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Construct Context String
        let contextString = "";
        if (context) {
            contextString += "=== USER CONTEXT ===\n";

            if (context.todaysMeetings && context.todaysMeetings.length > 0) {
                contextString += `\nTODAY'S MEETINGS:\n${JSON.stringify(context.todaysMeetings, null, 2)}\n`;
            }

            if (context.recentDiary && context.recentDiary.length > 0) {
                contextString += `\nRECENT DIARY ENTRIES:\n${JSON.stringify(context.recentDiary, null, 2)}\n`;
            }

            if (context.focusItems && context.focusItems.length > 0) {
                contextString += `\nCURRENT FOCUS:\n${JSON.stringify(context.focusItems, null, 2)}\n`;
            }

            if (context.goals) {
                contextString += `\nGOALS: ${context.goals}\n`;
            }

            if (context.aiBehavior) {
                contextString += `\nPREFERRED AI BEHAVIOR: ${context.aiBehavior}\n`;
            }

            contextString += "\n=== END USER CONTEXT ===\n";
        }

        // Combine System Prompt + Context
        const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

        // Construct the prompt from recent messages
        // We'll take the last few messages to give context, but keep it simple for now.
        // Gemini 1.5 Flash supports a list of contents.
        const contents = messages.map((m: ChatMessage) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
        }));

        // Prepend system instruction as a "user" message with a specific prefix if system_instruction is not supported,
        // OR use the system_instruction field. 
        // Since we are using v1beta, we can try to use the system_instruction field, 
        // BUT the user asked to "Prepend this to the SYSTEM_PROMPT before sending to Gemini".
        // To be safe and follow the instruction "Prepend this to the SYSTEM_PROMPT", we will combine them.
        // And then we will use the `system_instruction` field of the API.

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: fullSystemInstruction }]
                    },
                    contents: contents,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return new Response(
                JSON.stringify({ error: 'Gemini API Error', detail: errorText }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await response.json();

        // Parse the response
        // candidates[0].content.parts[*].text
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const reply = parts.map((p: any) => p.text).join('').trim();

        return new Response(
            JSON.stringify({ reply }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (err: any) {
        console.error('CHAT ROUTE ERROR:', err);
        return new Response(
            JSON.stringify({
                error: 'Internal error',
                detail: String(err?.message || err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
