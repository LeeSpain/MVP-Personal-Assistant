import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { message, role, sessionId } = body; // Expecting a single message to save

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let currentSessionId = sessionId;

        // Create session if not provided
        if (!currentSessionId) {
            const session = await prisma.chatSession.create({
                data: {
                    userId: user.id,
                    summary: "New Chat",
                },
            });
            currentSessionId = session.id;
        }

        const chatMessage = await prisma.chatMessage.create({
            data: {
                sessionId: currentSessionId,
                role, // 'user' or 'assistant'
                content: message,
            },
        });

        return NextResponse.json({ message: chatMessage, sessionId: currentSessionId });
    } catch (error) {
        console.error("[CHAT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
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

        // Get latest session for now, or list sessions
        const sessions = await prisma.chatSession.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: { messages: true },
            take: 1, // Just the latest for MVP
        });

        if (sessions.length === 0) {
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json(sessions[0]);
    } catch (error) {
        console.error("[CHAT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
