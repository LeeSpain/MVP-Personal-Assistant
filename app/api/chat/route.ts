// Local-only chat route with a built-in "context engine" and four independent pillars.
// Now uses PillarSetting from the database via Prisma + getOrCreateDefaultUser.

import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/user';

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

type PillarKey = 'deepWork' | 'execution' | 'relationship' | 'recovery';

type PillarSetting = {
    key: PillarKey;
    name: string;
    enabled: boolean;
    dailyTargetMinutes?: number | null;
    description?: string | null;
};

type PillarMap = Record<PillarKey, PillarSetting>;

type AgentContext = {
    todaysMeetings: Meeting[];
    thisWeeksMeetings: Meeting[];
    focusItems: FocusItem[];
    recentDiary: DiaryEntry[];
    goals: Goal[];
    dailySummary: string | null;
    weeklySummary: string | null;
    pillars: PillarMap;
    activePillar?: PillarKey | null;
};

// ------------------
// Behaviour description (internal)
// ------------------

const BEHAVIOUR_DESCRIPTION = `
You are a warm, natural personal assistant.

You:
- Speak in plain text, no markdown.
- Keep answers short, clear, and friendly.
- Use any context you are given (meetings, focus items, diary, summaries, goals, pillars).
- Never say "I cannot access your calendar" if meetings are provided in context.
- Treat each pillar (Deep Work, Execution, Relationship, Recovery) as independent, with its own settings.
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
            `A good work block would be: ${firstFocus.title || 'a main task you’ve set'}, especially to keep momentum.`
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
// Pillars helpers
// ------------------

function buildDefaultPillars(): PillarMap {
    return {
        deepWork: {
            key: 'deepWork',
            name: 'Deep Work',
            enabled: true,
            dailyTargetMinutes: 120,
            description:
                'Long, focused blocks on your most important, cognitively demanding work with minimal interruptions.',
        },
        execution: {
            key: 'execution',
            name: 'Execution',
            enabled: true,
            dailyTargetMinutes: 90,
            description:
                'Getting through shorter tasks, admin, follow-ups, and concrete actions that move things forward.',
        },
        relationship: {
            key: 'relationship',
            name: 'Relationship',
            enabled: true,
            dailyTargetMinutes: 45,
            description:
                'Time spent maintaining and improving relationships, communication, and important conversations.',
        },
        recovery: {
            key: 'recovery',
            name: 'Recovery',
            enabled: true,
            dailyTargetMinutes: 60,
            description:
                'Rest, movement, sleep, and activities that recharge your energy and prevent burnout.',
        },
    };
}

function mergePillars(
    defaults: PillarMap,
    dbPillars: PillarSetting[]
): PillarMap {
    const result: PillarMap = { ...defaults };
    for (const p of dbPillars) {
        if (!['deepWork', 'execution', 'relationship', 'recovery'].includes(p.key)) {
            continue;
        }
        const key = p.key as PillarKey;
        result[key] = {
            key,
            name: p.name || defaults[key].name,
            enabled:
                typeof p.enabled === 'boolean' ? p.enabled : defaults[key].enabled,
            dailyTargetMinutes:
                p.dailyTargetMinutes !== undefined
                    ? p.dailyTargetMinutes
                    : defaults[key].dailyTargetMinutes,
            description: p.description ?? defaults[key].description,
        };
    }
    return result;
}

function describePillar(pillar: PillarSetting): string {
    const base = `${pillar.name} is currently ${pillar.enabled ? 'enabled' : 'disabled'
        }.`;
    const target =
        pillar.dailyTargetMinutes && pillar.dailyTargetMinutes > 0
            ? ` Your daily target for this is about ${pillar.dailyTargetMinutes} minutes.`
            : '';
    const desc = pillar.description
        ? ` In simple terms: ${pillar.description}`
        : '';
    return base + target + desc;
}

function pillarFromText(text: string): PillarKey | null {
    const lower = text.toLowerCase();

    if (lower.includes('deep work') || lower.includes('deepwork')) {
        return 'deepWork';
    }
    if (lower.includes('execution')) {
        return 'execution';
    }
    if (
        lower.includes('relationship') ||
        lower.includes('relationships') ||
        lower.includes('connection') ||
        lower.includes('people')
    ) {
        return 'relationship';
    }
    if (
        lower.includes('recovery') ||
        lower.includes('rest') ||
        lower.includes('recharge') ||
        lower.includes('energy')
    ) {
        return 'recovery';
    }

    return null;
}

function suggestForPillar(
    pillar: PillarSetting,
    ctx: AgentContext
): string {
    const { focusItems, goals } = ctx;

    if (!pillar.enabled) {
        return `${pillar.name} is currently disabled in your settings. If you want to work on it, we can treat it as active for now and build a small plan.`;
    }

    switch (pillar.key) {
        case 'deepWork': {
            const mainGoal =
                goals.find((g) => g.horizon === 'week' || g.horizon === 'month') ||
                goals[0];

            return (
                describePillar(pillar) +
                ' For a deep work block today, pick one important task or project and protect 60–90 minutes for it. ' +
                (mainGoal
                    ? `A good candidate would be something that moves this goal: "${mainGoal.title}".`
                    : 'Choose the one thing that would make you feel genuinely satisfied if you made progress on it today.')
            );
        }
        case 'execution': {
            const executionFocus = focusItems[0];
            return (
                describePillar(pillar) +
                ' For execution, choose 3–5 small, concrete tasks and clear them in a focused burst. ' +
                (executionFocus
                    ? `You could start with: "${executionFocus.title}".`
                    : 'Look at your small admin tasks or follow-ups and bundle a few of them into one session.')
            );
        }
        case 'relationship': {
            return (
                describePillar(pillar) +
                ' For relationships, choose one person to check in with, or one relationship that would benefit from a bit of time or attention today. A call, a message, or a short conversation is enough to count.'
            );
        }
        case 'recovery': {
            return (
                describePillar(pillar) +
                ' For recovery, plan at least one real break where you step away from screens, move a little, or do something that helps your mind reset. Even 10–20 minutes makes a difference.'
            );
        }
        default:
            return describePillar(pillar);
    }
}

// ------------------
// Fake schedule context (we'll later replace with real data)
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

async function buildBaseContext(): Promise<Omit<AgentContext, 'pillars'>> {
    const todaysMeetings: Meeting[] = [
        {
            title: 'Morning focus block',
            description: 'Deep work on your main project.',
            startTime: makeISO(1),
            endTime: makeISO(3),
        },
        {
            title: 'Quick admin and emails',
            description: 'Execution session for small tasks.',
            startTime: makeISO(4),
            endTime: makeISO(5),
        },
    ];

    const thisWeeksMeetings: Meeting[] = [
        ...todaysMeetings,
        {
            title: 'Weekly planning review',
            description: 'Look over the week, goals, and upcoming tasks.',
            startTime: makeISOInDays(2, 10),
            endTime: makeISOInDays(2, 11),
        },
        {
            title: 'Catch-up call with an important person',
            description: 'Relationship catch-up.',
            startTime: makeISOInDays(3, 16),
            endTime: makeISOInDays(3, 17),
        },
    ];

    const focusItems: FocusItem[] = [
        { title: 'Main project deep work block', status: 'in-progress' },
        { title: 'Clear admin tasks and emails', status: 'planned' },
        { title: 'Message or call someone important', status: 'planned' },
    ];

    const recentDiary: DiaryEntry[] = [
        {
            title: 'Yesterday’s reflection',
            content:
                'Made some progress but felt pulled in different directions. Need clearer blocks for deep work and more intentional breaks.',
            createdAt: new Date().toISOString(),
        },
    ];

    const goals: Goal[] = [
        { title: 'Move your main project forward consistently', horizon: 'week' },
        { title: 'Keep your admin and execution under control', horizon: 'week' },
        { title: 'Invest small but regular energy into key relationships', horizon: 'week' },
        { title: 'Avoid burnout by adding real recovery time', horizon: 'week' },
    ];

    const dailySummary =
        'Today is about one deep work block, one execution burst, and at least a small step for relationships and recovery.';
    const weeklySummary =
        'This week is about balancing deep work, getting things done, staying connected, and not burning out.';

    return {
        todaysMeetings,
        thisWeeksMeetings,
        focusItems,
        recentDiary,
        goals,
        dailySummary,
        weeklySummary,
        activePillar: null,
    };
}

// ------------------
// Load pillars from DB
// ------------------

async function loadPillarsForUser(userId: string): Promise<PillarMap> {
    const defaults = buildDefaultPillars();

    const dbPillars = await prisma.pillarSetting.findMany({
        where: { userId },
    });

    if (dbPillars.length === 0) {
        return defaults;
    }

    return mergePillars(
        defaults,
        dbPillars.map((p) => ({
            key: p.key as PillarKey,
            name: p.name,
            enabled: p.enabled,
            dailyTargetMinutes: p.dailyTargetMinutes,
            description: p.description,
        }))
    );
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
        pillars,
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
        return 'Hey, I’m here. Do you want to look at your day, your week, or one of the four areas: Deep Work, Execution, Relationship, or Recovery?';
    }

    if (lower.includes('how are you')) {
        return 'I’m doing fine and ready to help. What do you want to focus on today? Deep Work, Execution, Relationship, or Recovery?';
    }

    // Pillar-specific questions
    const pillarKey = pillarFromText(userText);
    if (pillarKey) {
        const pillar = pillars[pillarKey];
        if (!pillar) {
            return 'That area is not configured yet in your context.';
        }

        if (
            lower.includes('what should i do') ||
            lower.includes('what to do') ||
            lower.includes('plan') ||
            lower.includes('help me with')
        ) {
            return suggestForPillar(pillar, ctx);
        }

        return describePillar(pillar);
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
    return `Okay, I’ve got your message: "${userText}". Based on the current context I can help you review your schedule, focus items, goals, or any of the four pillars (Deep Work, Execution, Relationship, Recovery), or we can just think through your plans. What would you like to look at next?`;
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

        const user = await getOrCreateDefaultUser();

        const baseContext = await buildBaseContext();
        const pillars = await loadPillarsForUser(user.id);

        const mergedContext: AgentContext =
            context && typeof context === 'object'
                ? { ...baseContext, ...context, pillars }
                : { ...baseContext, pillars };

        const userText = getLastUserMessage(messages as ChatMessage[]);
        const reply = generateLocalReply(userText, mergedContext);

        return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
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
