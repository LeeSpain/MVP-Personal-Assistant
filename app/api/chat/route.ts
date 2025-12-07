import { google } from '@ai-sdk/google';
import { generateText, convertToCoreMessages, tool } from 'ai';
import { prisma } from '@/lib/prisma';
import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';
import { generateEmbedding } from '@/lib/embeddings';
import { cosineSimilarity } from '@/lib/math';
import { z } from 'zod';
import { getOrCreateDefaultUser } from '@/lib/user';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const user = await getOrCreateDefaultUser();

        const { messages, context, sessionId } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No messages provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // --- Chat session handling ---
        let currentSessionId = sessionId as string | null;
        if (!currentSessionId) {
            const summarySource = messages[messages.length - 1];
            const summaryText =
                typeof summarySource.content === 'string'
                    ? summarySource.content
                    : JSON.stringify(summarySource.content);

            const session = await prisma.chatSession.create({
                data: {
                    userId: user.id,
                    summary: summaryText.substring(0, 50) + '...',
                },
            });
            currentSessionId = session.id;
        }

        const lastUserMessage = messages[messages.length - 1];

        if (lastUserMessage.role === 'user') {
            const contentText =
                typeof lastUserMessage.content === 'string'
                    ? lastUserMessage.content
                    : JSON.stringify(lastUserMessage.content);

            await prisma.chatMessage.create({
                data: {
                    sessionId: currentSessionId,
                    role: 'user',
                    content: contentText,
                },
            });
        }

        // --- RAG (Memories) ---
        let relevantMemoriesString = '';
        try {
            const userText =
                typeof lastUserMessage.content === 'string'
                    ? lastUserMessage.content
                    : JSON.stringify(lastUserMessage.content);

            const queryEmbedding = await generateEmbedding(userText);
            if (queryEmbedding.length > 0) {
                const allMemories = await prisma.memory.findMany({
                    where: { userId: user.id },
                });
                const scoredMemories = allMemories.map((mem) => ({
                    content: mem.content,
                    score: cosineSimilarity(queryEmbedding, mem.embedding),
                }));
                scoredMemories.sort((a, b) => b.score - a.score);
                const topMemories = scoredMemories.slice(0, 5);
                if (topMemories.length > 0) {
                    relevantMemoriesString =
                        '\n**RELEVANT MEMORIES (RAG):**\n' +
                        topMemories.map((m) => `- ${m.content}`).join('\n');
                }
            }
        } catch (e) {
            console.error('RAG Error', e);
        }

        // --- Context formatting ---
        let contextString = '';
        if (context && typeof context === 'object') {
            contextString = `
**CURRENT CONTEXT:**
- **Date**: ${new Date().toLocaleString()}
- **Mode**: ${context.mode}
- **Focus**: ${JSON.stringify(context.focusItems)}
- **Recent Diary**: ${JSON.stringify(context.recentDiary)}
- **Today's Schedule**: ${JSON.stringify(context.todaysMeetings)}
- **Contacts**: ${JSON.stringify(context.recentContacts)}
- **User Goals**: ${context.goals}
- **AI Behavior**: ${context.aiBehavior}
- **User Profile**: ${JSON.stringify(context.userProfile)}
- **Daily Summary**: ${context.dailySummary || 'None yet'}
- **Weekly Summary**: ${context.weeklySummary || 'None yet'}
${relevantMemoriesString}
`;
        }

        const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

        // --- AI call (non-streaming, simple JSON) ---
        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            system: fullSystemInstruction,
            messages: convertToCoreMessages(messages),
            tools: {
                memorize: tool({
                    description: 'Save a new long-term memory about the user.',
                    parameters: z.object({
                        content: z.string().describe('The content to memorize'),
                        type: z
                            .enum(['fact', 'preference', 'context'])
                            .describe('Type of memory'),
                        tags: z.array(z.string()).describe('Tags for the memory'),
                    }),
                    execute: async ({ content, type, tags }) => {
                        try {
                            const embedding = await generateEmbedding(content);
                            await prisma.memory.create({
                                data: {
                                    userId: user.id,
                                    content,
                                    type,
                                    tags,
                                    embedding,
                                },
                            });
                            return { success: true, message: 'Memory saved.' };
                        } catch (e) {
                            console.error('Memorize failed', e);
                            return { success: false, message: 'Failed to save memory.' };
                        }
                    },
                }),
            },
            maxSteps: 5,
        });

        const replyText = text || 'I could not generate a response.';

        // Save assistant message
        await prisma.chatMessage.create({
            data: {
                sessionId: currentSessionId,
                role: 'assistant',
                content: replyText,
            },
        });

        return new Response(
            JSON.stringify({
                reply: replyText,
                sessionId: currentSessionId,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        console.error('CHAT ROUTE ERROR:', err);
        return new Response(
            JSON.stringify({
                error: 'Internal error',
                detail: String(err?.message || err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
