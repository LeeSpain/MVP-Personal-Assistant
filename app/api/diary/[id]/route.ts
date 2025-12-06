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
