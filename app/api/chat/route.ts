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

        // Construct the prompt from recent messages
        // We'll take the last few messages to give context, but keep it simple for now.
        // Gemini 1.5 Flash supports a list of contents.
        const contents = messages.map((m: ChatMessage) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
        }));

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
