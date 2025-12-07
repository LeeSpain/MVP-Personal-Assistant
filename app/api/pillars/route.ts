import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ALL_KEYS = ['deepWork', 'execution', 'relationship', 'recovery'] as const;
type PillarKey = (typeof ALL_KEYS)[number];

type PillarSettingPayload = {
    key: PillarKey;
    name?: string;
    enabled?: boolean;
    dailyTargetMinutes?: number | null;
    description?: string | null;
};

// Build default pillars if none exist yet
function buildDefaultPillars(userId: string) {
    return [
        {
            userId,
            key: 'deepWork',
            name: 'Deep Work',
            enabled: true,
            dailyTargetMinutes: 120,
            description:
                'Long, focused blocks on your most important, cognitively demanding work with minimal interruptions.',
        },
        {
            userId,
            key: 'execution',
            name: 'Execution',
            enabled: true,
            dailyTargetMinutes: 90,
            description:
                'Getting through shorter tasks, admin, follow-ups, and concrete actions that move things forward.',
        },
        {
            userId,
            key: 'relationship',
            name: 'Relationship',
            enabled: true,
            dailyTargetMinutes: 45,
            description:
                'Time spent maintaining and improving relationships, communication, and important conversations.',
        },
        {
            userId,
            key: 'recovery',
            name: 'Recovery',
            enabled: true,
            dailyTargetMinutes: 60,
            description:
                'Rest, movement, sleep, and activities that recharge your energy and prevent burnout.',
        },
    ];
}

// GET: return current pillar settings (create defaults if empty)
export async function GET(_req: NextRequest) {
    try {
        const user = await getOrCreateDefaultUser();

        let pillars = await prisma.pillarSetting.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' },
        });

        if (pillars.length === 0) {
            const defaults = buildDefaultPillars(user.id);
            await prisma.pillarSetting.createMany({ data: defaults });

            pillars = await prisma.pillarSetting.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'asc' },
            });
        }

        return new Response(JSON.stringify({ pillars }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        console.error('GET /api/pillars error:', err);
        return new Response(
            JSON.stringify({
                error: 'Failed to load pillar settings',
                detail: String(err?.message || err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// PATCH: update one or more pillars
export async function PATCH(req: NextRequest) {
    try {
        const user = await getOrCreateDefaultUser();
        const body = await req.json();

        const payloads: PillarSettingPayload[] = Array.isArray(body)
            ? body
            : [body];

        for (const p of payloads) {
            if (!p.key || !ALL_KEYS.includes(p.key)) {
                continue;
            }

            const existing = await prisma.pillarSetting.findFirst({
                where: { userId: user.id, key: p.key },
            });

            if (existing) {
                await prisma.pillarSetting.update({
                    where: { id: existing.id },
                    data: {
                        name: p.name ?? existing.name,
                        enabled: p.enabled ?? existing.enabled,
                        dailyTargetMinutes:
                            p.dailyTargetMinutes !== undefined
                                ? p.dailyTargetMinutes
                                : existing.dailyTargetMinutes,
                        description:
                            p.description !== undefined
                                ? p.description
                                : existing.description,
                    },
                });
            } else {
                await prisma.pillarSetting.create({
                    data: {
                        userId: user.id,
                        key: p.key,
                        name: p.name || p.key,
                        enabled: p.enabled ?? true,
                        dailyTargetMinutes:
                            p.dailyTargetMinutes !== undefined
                                ? p.dailyTargetMinutes
                                : null,
                        description: p.description ?? null,
                    },
                });
            }
        }

        const pillars = await prisma.pillarSetting.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' },
        });

        return new Response(JSON.stringify({ pillars }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        console.error('PATCH /api/pillars error:', err);
        return new Response(
            JSON.stringify({
                error: 'Failed to update pillar settings',
                detail: String(err?.message || err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
