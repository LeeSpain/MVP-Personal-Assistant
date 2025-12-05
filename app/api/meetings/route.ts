import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Find user by clerkId
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            // Create user if not exists (lazy creation)
            // In a real app, use webhooks. For MVP, this is a fallback.
            return NextResponse.json([]);
        }

        const meetings = await prisma.meeting.findMany({
            where: { userId: user.id },
            orderBy: { startTime: 'asc' },
        });

        return NextResponse.json(meetings);
    } catch (error) {
        console.error("[MEETINGS_GET]", error);
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
        const { title, startTime, endTime, status, videoLink } = body;

        // Ensure user exists
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            // Create user on the fly if needed
            // Ideally, use Clerk webhooks for this
            const userEmail = (await (await fetch(`https://api.clerk.com/v1/users/${userId}`, {
                headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
            })).json()).email_addresses[0].email_address; // Simplified fetch for MVP, might fail without key

            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: "placeholder@example.com", // Fallback if we can't get email easily without extra setup
                }
            });
        }

        const meeting = await prisma.meeting.create({
            data: {
                userId: user.id,
                title,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                status: status || 'pending',
                videoLink,
            },
        });

        return NextResponse.json(meeting);
    } catch (error) {
        console.error("[MEETINGS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
