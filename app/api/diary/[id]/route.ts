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

        const entry = await prisma.diaryEntry.findUnique({ where: { id } });
        if (!entry || entry.userId !== user.id) {
            return new NextResponse("Entry not found or unauthorized", { status: 404 });
        }

        await prisma.diaryEntry.delete({ where: { id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DIARY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
