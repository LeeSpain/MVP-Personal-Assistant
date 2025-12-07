// Local-only chat route with a built-in "context engine".
// No external AI, no env vars. Uses a generated default context
// (fake meetings, focus items, goals, summaries) so the agent
// feels more real. Later we can swap the context builder to use
// real APIs (Google Calendar, tasks, etc).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ------------------
// Types
// ------------------

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

type FocusItem = {
    title?: string;
    status?: string;
};

type DiaryEntry = {
    title?: string;
    content?: string;
    createdAt?: string;
};

type Goal = {
    title?: string;
    horizon?: 'today' | 'week' | 'month' | 'year' | string;
};

type AgentContext = {
    todaysMeetings: Meeting[];
    thisWeeksMeetings: Meeting[];
    focusItems: FocusItem[];
    recentDiary: DiaryEntry[];
    goals: Goal[];
    dailySummary: string | null;
    weeklySummary: string | null;
};

// ------------------
// "Behaviour description" (internal)
// ------------------

const BEHAVIOUR_DESCRIPTION = `
You are a warm, natural personal assistant.

You:
- Speak in plain text, no markdown.
- Keep answers short, clear, and friendly.
- Use any context you are given (meetings, focus items, diary, summaries, goals).
- Never say "I cannot access your calendar" if meetings are provided in context.
- If there is no data for something, you say that honestly but helpfully.
`;

// ------------------
// Utility helpers
// ------------------

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

function summarizeMeetings(label: string, meetings: Meeting[]): string {
    if (!meetings || meetings.length === 0) {
        return `I don’t see any ${label} appointments in your current context.`;
    }

    if (meetings.length === 1) {
        const m = meetings[0];
        return `You have one ${label} appointment: ${m.title || 'Untitled'} starting at ${m.startTime || 'an unspecified time'}.`;
    }

    const list = meetings
        .slice(0, 5)
        .map((m, i) => {
            const title = m.title || 'Untitled';
            const time = m.startTime || 'time not set';
            return `${i + 1}. ${title} at ${time}`;
        })
        .join(' ');

    return `You have ${meetings.length} ${label} appointments. Here are a few of them: ${list}`;
}

function summarizeFocus(focusItems: FocusItem[]): string {
    if (!focusItems || focusItems.length === 0) {
        return 'You don’t have any focus items listed in your context yet. If you tell me what you want to work on, I can help you break it down.';
    }

    const list = focusItems
        .slice(0, 5)
        .map((f, i) => {
            const title = f.title || 'Untitled';
            const status = f.status || 'no status';
            return `${i + 1}. ${title} (${status})`;
        })
        .join(' ');

    return `Here are some of the things you’re currently focused on: ${list}`;
}

function summarizeDiary(entries: DiaryEntry[]): string {
    if (!entries || entries.length === 0) {
        return 'I don’t see any diary entries in your context yet.';
    }

    const latest = entries[0];
    const title = latest.title || 'Untitled entry';
    const snippet = (latest.content || '').slice(0, 120);

    return `Your most recent diary entry is "${title}". A quick snippet: ${snippet || 'no content available yet.'}`;
}

function summarizeGoals(goals: Goal[]): string {
    if (!goals || goals.length === 0) {
        return 'I don’t see any goals listed in your context yet.';
    }

    const shortTerm = goals.filter(
        (g) => g.horizon === 'today' || g.horizon === 'week'
    );

    const list = (shortTerm.length ? shortTerm : goals)
        .slice(0, 5)
        .map((g, i) => `${i + 1}. ${g.title || 'Untitled goal'}`)
        .join(' ');

    return `Here are some of your goals based on the current context: ${list}`;
}

function planDayFromContext(
    todaysMeetings: Meeting[],
    focusItems: FocusItem[],
    goals: Goal[]
): string {
    const parts: string[] = [];

    if (todaysMeetings && todaysMeetings.length > 0) {
        const first = todaysMeetings[0];
        parts.push(
            `You have a key appointment today: ${first.title || 'Untitled'} at ${first.startTime || 'an unspecified time'
            }.`
        );
    }

    if (focusItems && focusItems.length > 0) {
        const firstFocus = focusItems[0];
        parts.push(
            `A good focus task would be: ${firstFocus.title || 'a main task you’ve set'}, especially to keep momentum.`
        );
    }

    if (goals && goals.length > 0) {
        const aGoal = goals[0];
        parts.push(
            `Try to take at least one small step towards this goal today: ${aGoal.title || 'one of your goals'}.`
        );
    }

    if (parts.length === 0) {
        return 'I don’t see anything specific in your context yet. If you tell me what you want your day to look like, I can help you turn it into a simple plan.';
    }

    return parts.join(' ');
}

// ------------------
// Context engine (temporary fake data)
// ------------------

function makeISO(hoursFromNow: number): string {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow, 0, 0, 0);
    return d.toISOString();
}

function makeISOInDays(dayOffset: number, hour: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
}

// This is where we will later plug real data from:
// - Google Calendar
// - DB (Prisma) for diary, focus, goals
// - Other platforms from "Settings"
async function buildContextFromSources(): Promise<AgentContext> {
    // Fake "today" meetings
    const todaysMeetings: Meeting[] = [
        {
            title: 'Check-in with yourself',
            description: 'Short review of priorities and energy.',
            startTime: makeISO(1),
            endTime: makeISO(2),
        },
        {
            title: 'Focus block',
            description: 'Deep work on your main task.',
            startTime: makeISO(3),
            endTime: makeISO(5),
        },
    ];

    // Fake "this week" meetings
    const thisWeeksMeetings: Meeting[] = [
        ...todaysMeetings,
        {
            title: 'Planning the week ahead',
            description: 'Review goals and adjust schedule.',
            startTime: makeISOInDays(2, 10),
            endTime: makeISOInDays(2, 11),
        },
        {
            title: 'Catch-up with key contact',
            description: 'Conversation about progress and ideas.',
            startTime: makeISOInDays(3, 15),
            endTime: makeISOInDays(3, 16),
        },
    ];

    const focusItems: FocusItem[] = [
        { title: 'Clarify your top 3 priorities', status: 'in-progress' },
        { title: 'Work on your main project for 90 minutes', status: 'planned' },
        { title: 'Review and clean up your inbox/tasks', status: 'optional' },
    ];

    const recentDiary: DiaryEntry[] = [
        {
            title: 'Yesterday’s reflection',
            content:
                'Felt a bit overwhelmed but made progress on the main project. Need to be clearer about what matters tomorrow.',
            createdAt: new Date().toISOString(),
        },
    ];

    const goals: Goal[] = [
        { title: 'Stabilise your weekly routine', horizon: 'week' },
        { title: 'Move your main project noticeably forward', horizon: 'week' },
        { title: 'Make time for at least one break outside each day', horizon: 'today' },
    ];

    const dailySummary =
        'Today is about focusing on one or two important tasks, protecting your focus block, and not overloading your schedule.';
    const weeklySummary =
        'This week is about stabilising your routine, making steady progress on your main project, and avoiding burnout.';

    return {
        todaysMeetings,
        thisWeeksMeetings,
        focusItems,
        recentDiary,
        goals,
        dailySummary,
        weeklySummary,
    };
}

// ------------------
// Main local brain
// ------------------

function generateLocalReply(userText: string, ctx: AgentContext): string {
    const {
        todaysMeetings,
        thisWeeksMeetings,
        focusItems,
        recentDiary,
        goals,
        dailySummary,
        weeklySummary,
    } = ctx;

    const lower = userText.toLowerCase();

    if (!userText || userText.trim().length === 0) {
        return 'I’m here and ready. Tell me what you want to check, plan, or figure out.';
    }

    // Greetings / small talk
    if (
        lower === 'hi' ||
        lower === 'hello' ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello ')
    ) {
        return 'Hey, I’m here. Do you want to look at your day, your week, or something else?';
    }

    if (lower.includes('how are you')) {
        return 'I’m doing fine and ready to help. What do you want to focus on today?';
    }

    // Appointments / meetings / schedule
    if (
        lower.includes('appointment') ||
        lower.includes('appointments') ||
        lower.includes('meeting') ||
        lower.includes('meetings') ||
        lower.includes('schedule')
    ) {
        if (lower.includes('today')) {
            return summarizeMeetings('today', todaysMeetings);
        }
        if (lower.includes('week') || lower.includes('this week')) {
            return summarizeMeetings('this week', thisWeeksMeetings);
        }
        const combined = [...todaysMeetings, ...thisWeeksMeetings];
        return summarizeMeetings('upcoming', combined);
    }

    // Focus / tasks / goals
    if (
        lower.includes('focus') ||
        lower.includes('task') ||
        lower.includes('tasks') ||
        lower.includes('to-do') ||
        lower.includes('todo') ||
        lower.includes('goal') ||
        lower.includes('goals')
    ) {
        if (lower.includes('goal') || lower.includes('goals')) {
            return summarizeGoals(goals);
        }
        return summarizeFocus(focusItems);
    }

    // Daily / weekly summaries
    if (lower.includes('today') && lower.includes('summary')) {
        if (dailySummary) {
            return `Here’s your current daily summary: ${dailySummary}`;
        }
        return 'I don’t see a daily summary in your context yet. If you tell me how your day went, I can help you turn it into one.';
    }

    if (lower.includes('week') && lower.includes('summary')) {
        if (weeklySummary) {
            return `Here’s your current weekly summary: ${weeklySummary}`;
        }
        return 'I don’t see a weekly summary in your context yet. We can create one together if you tell me the main things that happened.';
    }

    // Plan my day / week
    if (
        (lower.includes('plan') || lower.includes('planning')) &&
        (lower.includes('day') || lower.includes('today'))
    ) {
        return planDayFromContext(todaysMeetings, focusItems, goals);
    }

    if (
        (lower.includes('plan') || lower.includes('planning')) &&
        lower.includes('week')
    ) {
        const combined = [...todaysMeetings, ...thisWeeksMeetings];
        if (combined.length === 0 && goals.length === 0) {
            return 'I don’t see any meetings or goals in your context for this week yet. If you tell me what you want your week to look like, I can help you sketch out a simple plan.';
        }
        return 'For this week, keep your main meetings in view and pick one or two important tasks or goals each day. If you want, tell me what’s coming up and I’ll help you break it down day by day.';
    }

    // Diary / reflection
    if (
        lower.includes('diary') ||
        lower.includes('journal') ||
        lower.includes('reflection')
    ) {
        return summarizeDiary(recentDiary);
    }

    // Fallback
    return `Okay, I’ve got your message: "${userText}". Based on the current context I can help you review your schedule, focus items, goals, or recent entries, or we can just think through your plans. What would you like to look at next?`;
}

// ------------------
// POST handler
// ------------------

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

        // Build server-side context from our fake sources
        const serverContext = await buildContextFromSources();

        // If the frontend sends a context object, we merge it on top
        const mergedContext: AgentContext = context && typeof context === 'object'
            ? { ...serverContext, ...context }
            : serverContext;

        const userText = getLastUserMessage(messages as ChatMessage[]);
        const reply = generateLocalReply(userText, mergedContext);

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
