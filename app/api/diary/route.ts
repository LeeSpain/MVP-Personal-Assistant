import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getOrCreateDefaultUser();

    try {
        const entries = await prisma.diaryEntry.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("[DIARY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getOrCreateDefaultUser();

    try {
        const body = await req.json();
        const { type, title, content } = body;

        const entry = await prisma.diaryEntry.create({
            data: {
                userId: user.id,
                type,
                title,
                content,
            },
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error("[DIARY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
