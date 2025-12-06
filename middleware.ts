// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
    matcher: [
        // Run Clerk on all dynamic routes but skip static files and Next internals
        "/((?!.+\\.[\\w]+$|_next).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
