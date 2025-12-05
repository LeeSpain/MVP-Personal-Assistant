import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json([]);
        }

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
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, title, content } = body;

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

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
