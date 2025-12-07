import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, convertToCoreMessages } from 'ai';
import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

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

        // Simple AI call with NO database, NO sessions, NO memory, NO Prisma
        const response = await generateText({
            model: google('gemini-1.5-flash-001'),
            system: SYSTEM_PROMPT,
            messages: convertToCoreMessages(messages),
        });

        const replyText = response.text || 'I could not generate a response.';

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
