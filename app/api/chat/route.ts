// Local-only chat route: no external AI, no env variables.
// Uses simple rules and context to generate responses.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: any;
};

type Meeting = {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
};

function extractText(content: any): string {
    if (typeof content === 'string') return content;
    try {
        return JSON.stringify(content);
    } catch {
        return String(content ?? '');
    }
}

function getLastUserMessage(messages: ChatMessage[]): string {
    const last = messages.filter((m) => m.role === 'user').pop();
    return last ? extractText(last.content).trim() : '';
}

function summarizeMeetings(meetings: Meeting[]): string {
    if (!meetings || meetings.length === 0) {
        return 'I don’t see any meetings or appointments in your current context.';
    }

    if (meetings.length === 1) {
        const m = meetings[0];
        return `You have one appointment: ${m.title || 'Untitled'} starting at ${m.startTime || 'an unspecified time'}.`;
    }

    const list = meetings
        .slice(0, 5)
        .map((m, i) => {
            const title = m.title || 'Untitled';
            const time = m.startTime || 'time not set';
            return `${i + 1}. ${title} at ${time}`;
        })
        .join(' ');

    return `You have ${meetings.length} appointments in your context. Here are the first few: ${list}`;
}

function generateLocalReply(userText: string, rawContext: any): string {
    const context = rawContext && typeof rawContext === 'object' ? rawContext : {};

    const todaysMeetings: Meeting[] = context.todaysMeetings || [];
    const thisWeeksMeetings: Meeting[] =
        context.thisWeeksMeetings || context.weekMeetings || [];

    const lower = userText.toLowerCase();

    // 1) Appointments / meetings questions
    if (
        lower.includes('appointment') ||
        lower.includes('appointments') ||
        lower.includes('meeting') ||
        lower.includes('meetings') ||
        lower.includes('schedule')
    ) {
        if (lower.includes('today')) {
            return summarizeMeetings(todaysMeetings);
        }
        if (lower.includes('week') || lower.includes('this week')) {
            return summarizeMeetings(thisWeeksMeetings);
        }
        // generic schedule question
        const combined = [...todaysMeetings, ...thisWeeksMeetings];
        return summarizeMeetings(combined);
    }

    // 2) Greetings / small talk
    if (
        lower === 'hi' ||
        lower === 'hello' ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello ')
    ) {
        return 'Hey, I’m here. Tell me what you’d like to focus on or ask about.';
    }

    if (lower.includes('how are you')) {
        return 'I’m doing fine and ready to help. What’s on your mind right now?';
    }

    // 3) Fallback: echo-style but more natural
    if (userText.length > 0) {
        return `I’ve got your message: "${userText}". I’m currently running in local test mode without an external AI model, but I can still help you plan, organise, or think through things step by step. What would you like to work on next?`;
    }

    return 'I’m here and ready. Tell me what you want to check, plan, or figure out.';
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

        const userText = getLastUserMessage(messages as ChatMessage[]);
        const reply = generateLocalReply(userText, context);

        return new Response(
            JSON.stringify({ reply }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        console.error('LOCAL CHAT ROUTE ERROR:', err);
        return new Response(
            JSON.stringify({
                error: 'Internal error',
                detail: String(err?.message || err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
