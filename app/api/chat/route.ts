// app/api/chat/route.ts
// Unified chat endpoint that can use OpenRouter (default), Gemini, OpenAI, or DeepSeek.
// Frontend (App.tsx, VoiceMode, etc.) calls this with { messages: [...] }.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
    role: Role;
    content: string;
}

interface AgentResponse {
    reply: string;
    actions?: any[];
}

// ------------- OpenRouter (DEFAULT) -------------

async function callOpenRouter(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set');
    }

    // Default model via OpenRouter – you can change this string later if you want.
    const DEFAULT_MODEL = 'deepseek/deepseek-chat';
    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            // These headers are recommended by OpenRouter (can be anything identifying your app)
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'MVP Personal Assistant',
        },
        body: JSON.stringify({
            model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter error: ${errorText}`);
    }

    const data = await res.json();
    const reply =
        data.choices?.[0]?.message?.content || '(no reply from OpenRouter)';
    return { reply };
}

// ------------- Gemini (optional – only if GEMINI_API_KEY is set) -------------

async function callGemini(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const prompt = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

    const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        apiKey;

    const res = await fetch(url, {
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
    });

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

// ------------- Direct OpenAI (only if you add OPENAI_API_KEY) -------------

async function callOpenAI(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const OPENAI_MODEL = 'gpt-4o-mini';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: OPENAI_MODEL, // cheaper model for testing
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

// ------------- Direct DeepSeek (only if you add DEEPSEEK_API_KEY) -------------

async function callDeepSeek(messages: ChatMessage[]): Promise<AgentResponse> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not set');
    }

    const DEEPSEEK_MODEL = 'deepseek-chat';

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: DEEPSEEK_MODEL,
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

        // Choose provider: body.provider overrides env, env defaults to "openrouter"
        const envProvider = process.env.LLM_PROVIDER || 'openrouter';
        const provider = (bodyProvider || envProvider).toLowerCase();

        let agentResponse: AgentResponse;

        switch (provider) {
            case 'gemini':
                agentResponse = await callGemini(messages);
                break;
            case 'openai':
                agentResponse = await callOpenAI(messages);
                break;
            case 'deepseek':
                agentResponse = await callDeepSeek(messages);
                break;
            case 'openrouter':
            default:
                agentResponse = await callOpenRouter(messages);
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
