import { prisma } from './lib/prisma';
import { getOrCreateDefaultUser } from './lib/user';

async function migrateData() {
    console.log("Starting migration...");

    // 1. Get the new default user
    const defaultUser = await getOrCreateDefaultUser();
    console.log(`Target User (Default): ${defaultUser.id} (${defaultUser.email})`);

    // 2. Find old users (anyone who is NOT the default user)
    const oldUsers = await prisma.user.findMany({
        where: {
            id: { not: defaultUser.id },
        },
    });

    if (oldUsers.length === 0) {
        console.log("No old users found to migrate.");
        return;
    }

    console.log(`Found ${oldUsers.length} old user(s) to migrate.`);

    for (const oldUser of oldUsers) {
        console.log(`Migrating data from Old User: ${oldUser.id} (${oldUser.email || 'No Email'})`);

        // Migrate Meetings
        const meetings = await prisma.meeting.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${meetings.count} meetings.`);

        // Migrate Diary Entries
        const diary = await prisma.diaryEntry.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${diary.count} diary entries.`);

        // Migrate Chat Sessions
        const chats = await prisma.chatSession.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${chats.count} chat sessions.`);

        // Migrate Contacts
        const contacts = await prisma.contact.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${contacts.count} contacts.`);

        // Migrate Notifications
        const notifications = await prisma.notification.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${notifications.count} notifications.`);

        // Migrate Memories
        const memories = await prisma.memory.updateMany({
            where: { userId: oldUser.id },
            data: { userId: defaultUser.id },
        });
        console.log(`- Migrated ${memories.count} memories.`);

        // Migrate Integrations (Handle unique constraint conflict)
        // We can't just updateMany because (userId, provider) must be unique.
        // If the default user already has an integration for a provider, we skip or overwrite.
        // For simplicity in MVP, we'll try to move them if they don't exist on target.
        const oldIntegrations = await prisma.integration.findMany({
            where: { userId: oldUser.id }
        });

        for (const integration of oldIntegrations) {
            const existing = await prisma.integration.findUnique({
                where: {
                    userId_provider: {
                        userId: defaultUser.id,
                        provider: integration.provider
                    }
                }
            });

            if (!existing) {
                await prisma.integration.update({
                    where: { id: integration.id },
                    data: { userId: defaultUser.id }
                });
                console.log(`- Migrated ${integration.provider} integration.`);
            } else {
                console.log(`- Skipped ${integration.provider} integration (already exists for target).`);
            }
        }

        // Delete the old user to clean up
        // Note: Cascading deletes might handle remaining relations, but we moved the important stuff.
        // We'll leave the user for now just in case, or delete if confident.
        // Let's delete to avoid confusion.
        try {
            await prisma.user.delete({ where: { id: oldUser.id } });
            console.log(`- Deleted old user record.`);
        } catch (e) {
            console.error(`- Failed to delete old user: ${e}`);
        }
    }

    console.log("Migration complete.");
}

migrateData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
