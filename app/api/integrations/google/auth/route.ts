import { NextResponse } from 'next/server';
import { oauth2Client, SCOPES } from '@/lib/google';
import { getOrCreateDefaultUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getOrCreateDefaultUser();

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: SCOPES,
        prompt: 'consent', // Force consent to ensure refresh token is returned
        state: user.id // Pass userId to callback to verify or track
    });

    return NextResponse.redirect(url);
}
