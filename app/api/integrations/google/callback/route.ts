import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return new NextResponse(`Google Auth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        return new NextResponse("No code provided", { status: 400 });
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user email to identify the connection
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Find internal user
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Save tokens
        await prisma.integration.upsert({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: 'google',
                },
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token, // Only returned on first consent or prompt='consent'
                expiresAt: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
                email: email,
            },
            create: {
                userId: user.id,
                provider: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
                email: email,
            },
        });

        // Redirect back to settings or success page
        return NextResponse.redirect(new URL('/', req.url));

    } catch (error) {
        console.error("Google Callback Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
