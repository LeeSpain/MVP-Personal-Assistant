import { PrismaClient } from '@prisma/client';
import path from 'path';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
    try {
        // Try loading from current working directory
        require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

        // If still not found, try loading from parent (in case we are in a subdir)
        if (!process.env.DATABASE_URL) {
            require('dotenv').config({ path: path.resolve(process.cwd(), '../.env') });
        }
    } catch (e) {
        // Ignore if dotenv is not available
    }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientOptions: any = {
    log: ['query'],
};

if (process.env.DATABASE_URL) {
    prismaClientOptions.datasources = {
        db: {
            url: process.env.DATABASE_URL,
        },
    };
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
