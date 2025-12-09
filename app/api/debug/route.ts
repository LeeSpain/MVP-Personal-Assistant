import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const vars = {
        LLM_PROVIDER: process.env.LLM_PROVIDER,
        OPENROUTER_API_KEY_SET: !!process.env.OPENROUTER_API_KEY,
        GEMINI_API_KEY_SET: !!process.env.GEMINI_API_KEY,
        NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(vars);
}
