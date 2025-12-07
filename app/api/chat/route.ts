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
        const { messages } = body || {};

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No messages provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is not set' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Flatten the conversation into a single text prompt
        const conversationText = (messages as ChatMessage[])
            .map((m) => {
                const text =
                    typeof m.content === 'string'
                        ? m.content
                        : JSON.stringify(m.content);
                const label = m.role.toUpperCase();
                return `${label}: ${text}`;
            })
            .join('\n');

        const prompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${conversationText}\n\nASSISTANT:`;

        const geminiResponse = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' +
            apiKey,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }],
                        },
                    ],
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return new Response(
                JSON.stringify({
                    error: 'Gemini API error',
                    detail: errorText,
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await geminiResponse.json();

        const replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'I could not generate a response.';

        return new Response(
            JSON.stringify({ reply: replyText }),
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
