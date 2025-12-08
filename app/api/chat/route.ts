// app/api/chat/route.ts
// Unified chat endpoint that can use Gemini, OpenAI, or DeepSeek.
// Frontend: App.tsx -> handleSendMessage() sends { messages: [...] } here.

import { NextResponse } from 'next/server';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
    role: Role;
    content: string;
}

interface AgentResponse {
    reply: string;
    actions?: any[];
}

// Allow dynamic on Vercel / Next
export const dynamic = 'force-dynamic';

// ------------- Provider clients -------------

async function callGemini(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    // Simple strategy: join all messages into one prompt
    const prompt = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

    const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' +
        apiKey,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini error: ${errorText}`);
    }

    const data = await res.json();
    const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        '(no reply from Gemini)';
    return { reply };
}

async function callOpenAI(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // cheaper model for testing
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI error: ${errorText}`);
    }

    const data = await res.json();
    const reply =
        data.choices?.[0]?.message?.content || '(no reply from OpenAI)';
    return { reply };
}

async function callDeepSeek(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not set');
    }

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`DeepSeek error: ${errorText}`);
    }

    const data = await res.json();
    const reply =
        data.choices?.[0]?.message?.content || '(no reply from DeepSeek)';
    return { reply };
}

// ------------- Route handler -------------

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body.messages as ChatMessage[] | undefined;
        const bodyProvider = (body.provider as string | undefined) || undefined;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Missing or invalid "messages" array' },
                { status: 400 }
            );
        }

        // Choose provider: body.provider overrides env, env defaults to gemini
        const envProvider = process.env.LLM_PROVIDER || 'gemini';
        const provider = (bodyProvider || envProvider).toLowerCase();

        let agentResponse: AgentResponse;

        switch (provider) {
            case 'openai':
                agentResponse = await callOpenAI(messages);
                break;
            case 'deepseek':
                agentResponse = await callDeepSeek(messages);
                break;
            case 'gemini':
            default:
                agentResponse = await callGemini(messages);
                break;
        }

        return NextResponse.json({
            reply: agentResponse.reply,
            actions: agentResponse.actions || [],
            provider,
        });
    } catch (err: any) {
        console.error('Error in /api/chat:', err);
        return NextResponse.json(
            {
                error: 'Agent error',
                detail: err?.message || String(err),
            },
            { status: 500 }
        );
    }
}
