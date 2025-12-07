import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const runtime = 'nodejs';

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

        const apiKey = process.env.OPENROUTER_API_KEY;
        console.log('DEBUG: Full Environment Keys:', Object.keys(process.env));
        console.log('DEBUG: OPENROUTER_API_KEY value:', apiKey);

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: 'OPENROUTER_API_KEY is not set',
                    debug_info: {
                        message: 'The environment variable OPENROUTER_API_KEY is missing or empty.',
                        available_env_keys: Object.keys(process.env),
                        runtime: process.release?.name || 'unknown'
                    }
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 1) Build conversation text
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

        // 2) Build a rich context string from the context object (no DB)
        let contextString = '';
        if (context && typeof context === 'object') {
            const mode = context.mode ?? null;
            const focusItems = context.focusItems ?? [];
            const recentDiary = context.recentDiary ?? [];
            const todaysMeetings = context.todaysMeetings ?? [];
            const thisWeeksMeetings = context.thisWeeksMeetings ?? context.weekMeetings ?? [];
            const recentContacts = context.recentContacts ?? [];
            const goals = context.goals ?? null;
            const aiBehavior = context.aiBehavior ?? null;
            const userProfile = context.userProfile ?? null;
            const dailySummary = context.dailySummary ?? null;
            const weeklySummary = context.weeklySummary ?? null;

            contextString = `
CURRENT USER CONTEXT (FOR YOUR EYES ONLY, DO NOT OUTPUT VERBATIM):

- Mode: ${mode ?? 'unknown'}
- Focus items: ${JSON.stringify(focusItems)}
- Recent diary entries: ${JSON.stringify(recentDiary)}
- Today’s meetings and appointments: ${JSON.stringify(todaysMeetings)}
- This week’s meetings and appointments: ${JSON.stringify(thisWeeksMeetings)}
- Recent contacts: ${JSON.stringify(recentContacts)}
- User goals: ${JSON.stringify(goals)}
- AI behaviour instructions: ${JSON.stringify(aiBehavior)}
- User profile: ${JSON.stringify(userProfile)}
- Daily summary: ${dailySummary ?? 'none'}
- Weekly summary: ${weeklySummary ?? 'none'}

You must use this context when answering questions about the user’s schedule, appointments, work, life, or goals.
If the user asks about their week, meetings, or what they have coming up, read the meetings information here and answer from it.
`;
        }

        // 3) Full prompt: system + context + conversation
        const prompt = `
${SYSTEM_PROMPT}

${contextString}

Conversation so far:
${conversationText}

ASSISTANT:
`;

        // 4) Call OpenRouter (DeepSeek R1 free)
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'MVP Personal Assistant Dev'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: [
                    { role: 'system', content: prompt },
                    // We also pass the last user message so the provider has a proper role structure
                    ...(messages as ChatMessage[])
                        .map((m) => ({
                            role: m.role,
                            content:
                                typeof m.content === 'string'
                                    ? m.content
                                    : JSON.stringify(m.content),
                        })),
                ],
            }),
        });

        if (!openrouterResponse.ok) {
            const errorText = await openrouterResponse.text();
            console.error('OpenRouter API error:', errorText);
            return new Response(
                JSON.stringify({
                    error: 'OpenRouter API error',
                    detail: errorText,
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await openrouterResponse.json();

        const replyText =
            data?.choices?.[0]?.message?.content ||
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
