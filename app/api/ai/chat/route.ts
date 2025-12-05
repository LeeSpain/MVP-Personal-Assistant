import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './systemPrompt';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set in environment variables.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { message, context, history } = body;

    // 1. Construct the Rich Context String
    // The frontend now sends a JSON object for context. We need to format it for the LLM.
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
      `;
    } else {
      contextString = `Context: ${context}`;
    }

    // 2. Build the Full Prompt
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: fullSystemInstruction }]
      },
      ...history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    // 3. Call Gemini API with JSON Mode
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            responseMimeType: "application/json" // Force JSON output
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch from Gemini' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("No content generated");
    }

    // 4. Parse the JSON Response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse JSON response:", rawText);
      // Fallback if model fails to return valid JSON
      return NextResponse.json({
        reply: rawText, // Return raw text as reply
        actions: []
      });
    }

    return NextResponse.json({
      reply: parsedResponse.reply || "I processed that, but have no specific reply.",
      actions: parsedResponse.actions || []
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}