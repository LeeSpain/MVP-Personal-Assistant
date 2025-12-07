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

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
