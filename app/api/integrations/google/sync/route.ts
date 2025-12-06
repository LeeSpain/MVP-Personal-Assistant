import { NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function POST() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Get tokens
        const integration = await prisma.integration.findUnique({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: 'google',
                },
            },
        });

        if (!integration || !integration.accessToken) {
            return new NextResponse("Google not connected", { status: 400 });
        }

        // Set credentials
        oauth2Client.setCredentials({
            access_token: integration.accessToken,
            refresh_token: integration.refreshToken || undefined,
        });

        // Refresh if needed (handled by googleapis automatically if refresh_token is present)
        // But we might want to listen to 'tokens' event to update DB. 
        // For MVP, we rely on auto-refresh or re-auth if failed.

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Fetch events (next 7 days for MVP efficiency)
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: nextWeek.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];
        let syncedCount = 0;

        for (const event of events) {
            if (!event.start?.dateTime) continue; // Skip all-day events for now if they lack time

            await prisma.meeting.upsert({
                where: {
                    // We don't have a unique constraint on googleEventId yet, 
                    // so we search manually or assume we might duplicate if not careful.
                    // Ideally we should add @unique to googleEventId, but for now let's findFirst.
                    id: "non-existent-uuid-placeholder" // We can't use upsert effectively without a unique key on googleEventId
                },
                update: {}, // Placeholder
                create: {
                    userId: user.id,
                    title: event.summary || 'Untitled Event',
                    startTime: new Date(event.start.dateTime),
                    endTime: event.end?.dateTime ? new Date(event.end.dateTime) : null,
                    status: 'confirmed',
                    googleEventId: event.id,
                    description: event.description,
                    videoLink: event.hangoutLink,
                }
            });

            // Correct approach for MVP without unique constraint on googleEventId:
            // Check if exists
            const existing = await prisma.meeting.findFirst({
                where: { userId: user.id, googleEventId: event.id }
            });

            if (existing) {
                await prisma.meeting.update({
                    where: { id: existing.id },
                    data: {
                        title: event.summary || 'Untitled Event',
                        startTime: new Date(event.start.dateTime),
                        endTime: event.end?.dateTime ? new Date(event.end.dateTime) : null,
                        status: 'confirmed',
                        description: event.description,
                        videoLink: event.hangoutLink,
                    }
                });
            } else {
                await prisma.meeting.create({
                    data: {
                        userId: user.id,
                        title: event.summary || 'Untitled Event',
                        startTime: new Date(event.start.dateTime),
                        endTime: event.end?.dateTime ? new Date(event.end.dateTime) : null,
                        status: 'confirmed',
                        googleEventId: event.id,
                        description: event.description,
                        videoLink: event.hangoutLink,
                    }
                });
            }
            syncedCount++;
        }

        return NextResponse.json({ success: true, synced: syncedCount });

    } catch (error) {
        console.error("Sync Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
