import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

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
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: "placeholder@example.com", // Fallback
                }
            });
        }

        let googleEventId = null;
        let finalVideoLink = videoLink;

        // --- GOOGLE SYNC START ---
        const integration = await prisma.integration.findUnique({
            where: { userId_provider: { userId: user.id, provider: 'google' } }
        });

        if (integration && integration.accessToken) {
            try {
                const { google } = await import('googleapis');
                const { oauth2Client } = await import('@/lib/google');

                oauth2Client.setCredentials({
                    access_token: integration.accessToken,
                    refresh_token: integration.refreshToken || undefined,
                });

                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                const event = {
                    summary: title,
                    start: { dateTime: new Date(startTime).toISOString() },
                    end: { dateTime: endTime ? new Date(endTime).toISOString() : new Date(new Date(startTime).getTime() + 30 * 60000).toISOString() }, // Default 30 min
                };

                const gRes = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event,
                });

                googleEventId = gRes.data.id;
                if (gRes.data.hangoutLink) {
                    finalVideoLink = gRes.data.hangoutLink;
                }
            } catch (gError) {
                console.error("Failed to push to Google Calendar", gError);
                // Don't fail the whole request, just log it
            }
        }
        // --- GOOGLE SYNC END ---

        const meeting = await prisma.meeting.create({
            data: {
                userId: user.id,
                title,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                status: status || 'pending',
                videoLink: finalVideoLink,
                googleEventId,
            },
        });

        return NextResponse.json(meeting);
    } catch (error) {
        console.error("[MEETINGS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
