import { SYSTEM_PROMPT } from '../app/api/ai/chat/systemPrompt';

export async function generateAIResponse(message: string, context: any, history: any[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set (ai)');
    }

    // 1. Construct the Rich Context String
    let contextString = "";
    if (typeof context === 'object') {
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
- **Memories**: ${JSON.stringify(context.memories)}
- **Daily Summary**: ${context.dailySummary || "None yet"}
- **Weekly Summary**: ${context.weeklySummary || "None yet"}
    `;
    } else {
        contextString = `Context: ${context}`;
    }

    // 2. Build the System Instruction
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

    // 3. Construct Contents (Alternating Turns)
    const contents = [
        ...history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        })),
        {
            role: "user",
            parts: [{ text: message }]
        }
    ];

    // 4. Call Gemini API
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: fullSystemInstruction }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch from Gemini');
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error("No content generated");
    }

    // 5. Parse JSON
    try {
        const parsedResponse = JSON.parse(rawText);
        return {
            reply: parsedResponse.reply || "I processed that, but have no specific reply.",
            actions: parsedResponse.actions || []
        };
    } catch (e) {
        console.error("Failed to parse JSON response:", rawText);
        return {
            reply: rawText,
            actions: []
        };
    }
}
