import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from './systemPrompt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not set (route)' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { message, context, history } = body;

    // 1. Construct the Rich Context String
    let contextString = '';
    if (typeof context === 'object' && context !== null) {
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
- **Language**: ${context.language === 'nl' ? 'Dutch (Nederlands)' : 'English'
        }
- **Daily Summary**: ${context.dailySummary || 'None yet'}
- **Weekly Summary**: ${context.weeklySummary || 'None yet'}

IMPORTANT: You MUST respond in ${context.language === 'nl' ? 'Dutch (Nederlands)' : 'English'
        }.
      `;
    } else {
      contextString = `Context: ${context}`;
    }

    // 2. Build the System Instruction
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${contextString}`;

    // 3. Build messages array for OpenRouter (system + history + current user)
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] =
      [];

    messages.push({
      role: 'system',
      content: fullSystemInstruction,
    });

    if (Array.isArray(history)) {
      for (const msg of history) {
        // history comes as { role: 'user' | 'assistant', content: string }
        const role =
          msg.role === 'assistant'
            ? 'assistant'
            : 'user'; // normalize anything else to 'user'
        messages.push({
          role,
          content: msg.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: message,
    });

    // 4. Call OpenRouter (DeepSeek by default) and ask for JSON output
    const model =
      process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MVP Personal Assistant – Planner',
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API Error:', errorData || (await response.text()));
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            'Failed to fetch from OpenRouter (planner route)',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText: string | undefined =
      data.choices?.[0]?.message?.content || '';

    if (!rawText) {
      throw new Error('No content generated');
    }

    // 5. Parse the JSON Response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse JSON response from model:', rawText);
      // Fallback if the model doesn't return valid JSON
      return NextResponse.json({
        reply: rawText,
        actions: [],
      });
    }

    return NextResponse.json({
      reply: parsedResponse.reply || 'I processed that, but have no specific reply.',
      actions: parsedResponse.actions || [],
    });
  } catch (error: any) {
    console.error('API Route Error (planner):', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
