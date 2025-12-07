import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: any;
};

function buildContextString(context: any): string {
    if (!context || typeof context !== 'object') return '';

    const mode = context.mode ?? null;
    const focusItems = context.focusItems ?? [];
    const recentDiary = context.recentDiary ?? [];
    const todaysMeetings = context.todaysMeetings ?? [];
    const thisWeeksMeetings =
        context.thisWeeksMeetings ?? context.weekMeetings ?? [];
    const recentContacts = context.recentContacts ?? [];
    const goals = context.goals ?? null;
    const aiBehavior = context.aiBehavior ?? null;
    const userProfile = context.userProfile ?? null;
    const dailySummary = context.dailySummary ?? null;
    const weeklySummary = context.weeklySummary ?? null;

    return `
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

function buildConversationText(messages: ChatMessage[]): string {
    return messages
        .map((m) => {
            const text =
                typeof m.content === 'string'
                    ? m.content
                    : JSON.stringify(m.content);
            const label = m.role.toUpperCase();
            return `${label}: ${text}`;
        })
        .join('\n');
}

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

        const apiKey =
            process.env.OPENROUTER_API_KEY ||
            process.env['OPENROUTER_API_KEY'] ||
            '';

        // DEBUG: log once per request
        console.log(
            'ROUTE_VERSION_V3: OPENROUTER_API_KEY status:',
            apiKey ? `PRESENT (length=${apiKey.length})` : 'MISSING'
        );

        const conversationText = buildConversationText(
            messages as ChatMessage[]
        );
        const contextString = buildContextString(context);

        const fullPrompt = `
${SYSTEM_PROMPT}

${contextString}

Conversation so far:
${conversationText}

ASSISTANT:
`;

        // If no API key, fall back to local response instead of error
        if (!apiKey) {
            const lastUser = (messages as ChatMessage[])
                .filter((m) => m.role === 'user')
                .pop();
            const userText =
                lastUser && typeof lastUser.content === 'string'
                    ? lastUser.content
                    : '';

            const fallbackReply =
                userText && userText.trim().length > 0
                    ? `[LOCAL_FALLBACK_V3] You said: "${userText}". I’m currently running in local debug mode without access to the external AI service, but your chat pipeline is working end-to-end.`
                    : `[LOCAL_FALLBACK_V3] Hi, I’m running in local debug mode and don’t have access to the external AI service right now, but we can still plan and think things through together.`;

            return new Response(
                JSON.stringify({ reply: fallbackReply }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Call OpenRouter with DeepSeek R1 (free)
        const openrouterResponse = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + apiKey,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'MVP Personal Assistant Dev',
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1:free',
                    messages: [
                        { role: 'system', content: fullPrompt },
                        ...(messages as ChatMessage[]).map((m) => ({
                            role: m.role,
                            content:
                                typeof m.content === 'string'
                                    ? m.content
                                    : JSON.stringify(m.content),
                        })),
                    ],
                }),
            }
        );

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
            '[V3] I could not generate a response.';

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
