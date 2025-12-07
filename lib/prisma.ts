import { PrismaClient } from '@prisma/client';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
    try {
        require('dotenv').config();
    } catch (e) {
        // Ignore if dotenv is not available
    }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
