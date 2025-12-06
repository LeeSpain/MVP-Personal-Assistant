import { NextResponse } from 'next/server';
import { oauth2Client, SCOPES } from '@/lib/google';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: SCOPES,
        prompt: 'consent', // Force consent to ensure refresh token is returned
        state: userId // Pass userId to callback to verify or track
    });

    return NextResponse.redirect(url);
}
