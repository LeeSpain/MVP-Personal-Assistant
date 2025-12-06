import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = "owner@local-app";
const DEFAULT_USER_NAME = "Owner";
const DEFAULT_CLERK_ID = "local-single-user";

export async function getOrCreateDefaultUser() {
    let user = await prisma.user.findUnique({
        where: { email: DEFAULT_USER_EMAIL },
    });

    if (!user) {
        // Check if a user with the default clerkId exists (edge case)
        const existingClerkUser = await prisma.user.findUnique({
            where: { clerkId: DEFAULT_CLERK_ID }
        });

        if (existingClerkUser) {
            return existingClerkUser;
        }

        user = await prisma.user.create({
            data: {
                email: DEFAULT_USER_EMAIL,
                name: DEFAULT_USER_NAME,
                clerkId: DEFAULT_CLERK_ID,
            },
        });
    }

    return user;
}
