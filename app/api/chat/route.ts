import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { SYSTEM_PROMPT } from '../ai/chat/systemPrompt';
import { generateEmbedding } from '@/lib/embeddings';
import { cosineSimilarity } from '@/lib/math';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { messages, context, sessionId } = await req.json();

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        return new Response("User not found", { status: 404 });
    }

    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const session = await prisma.chatSession.create({
            data: {
                userId: user.id,
                summary: messages[messages.length - 1].content.substring(0, 50) + "...",
            },
        });
        currentSessionId = session.id;
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user') {
        await prisma.chatMessage.create({
            data: {
                sessionId: currentSessionId,
                role: 'user',
                content: lastUserMessage.content,
            },
        });
    }

    // --- RAG ---
    let relevantMemoriesString = "";
    try {
        const queryEmbedding = await generateEmbedding(lastUserMessage.content);
        if (queryEmbedding.length > 0) {
            const allMemories = await prisma.memory.findMany({ where: { userId: user.id } });
            const scoredMemories = allMemories.map(mem => ({
                content: mem.content,
                score: cosineSimilarity(queryEmbedding, mem.embedding)
            }));
            scoredMemories.sort((a, b) => b.score - a.score);
            const topMemories = scoredMemories.slice(0, 5);
            if (topMemories.length > 0) {
                relevantMemoriesString = `\n**RELEVANT MEMORIES (RAG):**\n${topMemories.map(m => `- ${m.content}`).join('\n')}`;
            }
        }
    } catch (e) { console.error("RAG Error", e); }

    let contextString = "";
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
- **Daily Summary**: ${context.dailySummary || "None yet"}
- **Weekly Summary**: ${context.weeklySummary || "None yet"}
${relevantMemoriesString}
    `;
    }

    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

    const result = await streamText({
        model: google('gemini-1.5-flash'),
        system: fullSystemInstruction,
        messages: convertToCoreMessages(messages),
        tools: {
            memorize: tool({
                description: 'Save a new long-term memory about the user.',
                parameters: z.object({
                    content: z.string().describe('The content to memorize'),
                    type: z.enum(['fact', 'preference', 'context']).describe('Type of memory'),
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
                        return { success: true, message: "Memory saved." };
                    } catch (e) {
                        console.error("Memorize failed", e);
                        return { success: false, message: "Failed to save memory." };
                    }
                },
            }),
        },
        onFinish: async ({ text, toolCalls }) => {
            // Save AI Response (Text)
            if (text) {
                await prisma.chatMessage.create({
                    data: {
                        sessionId: currentSessionId,
                        role: 'assistant',
                        content: text,
                    },
                });
            }

            // Note: Tool calls are also part of the conversation history, 
            // but for this MVP we primarily save the text response.
            // If the AI calls a tool, it might not output text.
        },
    });

    return result.toDataStreamResponse({
        headers: { 'x-session-id': currentSessionId }
    });
}
