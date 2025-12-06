import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        // Verify ownership
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const meeting = await prisma.meeting.findUnique({ where: { id } });
        if (!meeting || meeting.userId !== user.id) {
            return new NextResponse("Meeting not found or unauthorized", { status: 404 });
        }

        await prisma.meeting.delete({ where: { id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[MEETING_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const meeting = await prisma.meeting.findUnique({ where: { id } });
        if (!meeting || meeting.userId !== user.id) {
            return new NextResponse("Meeting not found or unauthorized", { status: 404 });
        }

        const updated = await prisma.meeting.update({
            where: { id },
            data: {
                status: body.status,
                // Add other fields here if needed
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[MEETING_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
