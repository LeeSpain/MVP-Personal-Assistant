import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/user';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getOrCreateDefaultUser();

    try {
        const { id } = await params;

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
    const user = await getOrCreateDefaultUser();

    try {
        const { id } = await params;
        const body = await req.json();

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
