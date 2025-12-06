import { clerkMiddleware } from "@clerk/nextjs/server";

import { NextRequest, NextFetchEvent } from "next/server";

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.error("Middleware Debug: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is MISSING");
        return new Response(JSON.stringify({ error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing in Vercel Environment Variables" }), { status: 500, headers: { "content-type": "application/json" } });
    } else {
        console.log("Middleware Debug: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is SET");
    }

    if (!process.env.CLERK_SECRET_KEY) {
        console.error("Middleware Debug: CLERK_SECRET_KEY is MISSING");
        return new Response(JSON.stringify({ error: "CLERK_SECRET_KEY is missing in Vercel Environment Variables" }), { status: 500, headers: { "content-type": "application/json" } });
    } else {
        console.log("Middleware Debug: CLERK_SECRET_KEY is SET");
    }

    return clerkMiddleware()(req, event);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
