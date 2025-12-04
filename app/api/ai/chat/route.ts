
import { NextResponse } from 'next/server';
import { GoogleGenAI, FunctionDeclaration, Type, Content } from "@google/genai";
import { ChatRequest, ChatResponse, PlannerAction, ActionType } from '../../../../types';
import { SYSTEM_INSTRUCTION } from '../../../../constants';

// --- Tool Definitions for Gemini ---
const toolsDef: FunctionDeclaration[] = [
  {
    name: 'execute_planner',
    description: 'Executes a list of actions based on the user\'s request. Use this when the user asks to perform specific tasks like scheduling, journaling, email, or setting reminders.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        actions: {
          type: Type.ARRAY,
          description: 'A list of actions to execute.',
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                enum: [
                  ActionType.CREATE_DIARY,
                  ActionType.CREATE_MEETING,
                  ActionType.ADD_NOTIFICATION,
                  ActionType.SET_FOCUS,
                  ActionType.SEND_EMAIL,
                  ActionType.GENERATE_VIDEO_LINK
                ],
                description: 'The type of action to perform.'
              },
              payload: {
                type: Type.OBJECT,
                description: 'The data required for the action.',
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  diaryType: { 
                    type: Type.STRING, 
                    enum: ['Reflection', 'Decision', 'Idea'],
                    description: 'Required for CREATE_DIARY. Classifies the entry.'
                  },
                  time: { type: Type.STRING, description: 'ISO date string' },
                  attendees: { type: Type.ARRAY, items: { type: Type.STRING } },
                  message: { type: Type.STRING },
                  focusText: { type: Type.STRING },
                  tag: { type: Type.STRING, enum: ['info', 'alert', 'success'] },
                  recipient: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                  platform: { type: Type.STRING, enum: ['zoom', 'meet', 'teams'] }
                }
              }
            },
            required: ['type', 'payload']
          }
        }
      },
      required: ['actions']
    }
  }
];

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history, context } = body;

    // -----------------------------------------------------------
    // 1. REAL AI MODE (If API_KEY is present)
    // -----------------------------------------------------------
    if (process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';

        // 1. Prepare Content
        // We filter out the last message from history if it matches the current message
        // to avoid duplication, as we will append the current message with context below.
        const cleanHistory = history.filter((msg, index) => {
          const isLast = index === history.length - 1;
          return !(isLast && msg.role === 'user' && msg.content === message);
        });

        const contents: Content[] = cleanHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        // 2. Add current message with context
        const promptContext = context ? `System Context:\n${context}\n\n` : '';
        contents.push({
          role: 'user',
          parts: [{ text: `${promptContext}User Request: ${message}` }]
        });
        
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: toolsDef }],
          }
        });

        let reply = response.text || "";
        let actions: PlannerAction[] = [];

        // Check for function calls using the SDK getter
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          // Iterate over all function calls (Gemini can return multiple)
          for (const call of functionCalls) {
            if (call.name === 'execute_planner') {
              const args = call.args as any;
              if (args && args.actions) {
                actions = [...actions, ...args.actions];
              }
            }
          }
        }

        // Fallback reply if only actions are returned
        if (!reply && actions.length > 0) {
          reply = "I'm handling that for you right now.";
        } else if (!reply) {
          reply = "I processed your request.";
        }

        return NextResponse.json({ reply, actions } as ChatResponse);

      } catch (geminiError) {
        console.error("Gemini API Error:", geminiError);
        // We can either throw here or fall through to mock mode. 
        // For a production app, we usually want to report the error.
        return NextResponse.json(
          { error: 'Failed to communicate with AI service', reply: '', actions: [] }, 
          { status: 502 }
        );
      }
    }

    // -----------------------------------------------------------
    // 2. MOCK MODE (Fallback)
    // -----------------------------------------------------------
    console.log("Running in Mock Mode (No API Key found)");
    
    let reply = "I've received your message. I'm currently operating in Mock Mode (connect an API key to activate my full brain).";
    let actions: PlannerAction[] = [];
    const lowerMsg = message.toLowerCase();

    // Mock Intent Detection
    if (lowerMsg.includes('meeting') || lowerMsg.includes('schedule') || lowerMsg.includes('calendar')) {
      reply = "I can help with that. I've prepared a calendar invite for you.";
      actions.push({
        type: ActionType.CREATE_MEETING,
        payload: {
          title: 'New Meeting',
          time: new Date(Date.now() + 86400000).toISOString(),
          attendees: ['martijn@example.com']
        }
      });
    } else if (lowerMsg.includes('diary') || lowerMsg.includes('journal') || lowerMsg.includes('note')) {
      reply = "I've logged that into your digital diary.";
      actions.push({
        type: ActionType.CREATE_DIARY,
        payload: {
          title: 'Quick Note',
          content: message,
          diaryType: 'Idea'
        }
      });
    } else if (lowerMsg.includes('focus')) {
      reply = "Setting your focus now.";
      actions.push({
        type: ActionType.SET_FOCUS,
        payload: {
          focusText: message.replace('focus', '').trim() || "Deep Work"
        }
      });
    } else if (lowerMsg.includes('email')) {
      reply = "Drafting email...";
      actions.push({
        type: ActionType.SEND_EMAIL,
        payload: {
          recipient: 'test@example.com',
          subject: 'Mock Email',
          body: message
        }
      });
    } else if (lowerMsg.includes('video') || lowerMsg.includes('zoom')) {
      reply = "Generating video link...";
      actions.push({
        type: ActionType.GENERATE_VIDEO_LINK,
        payload: {
          platform: 'zoom'
        }
      });
    } else {
      reply = `I heard: "${message}". I can simulate creating meetings or notes if you use those keywords.`;
    }

    return NextResponse.json({ reply, actions } as ChatResponse);

  } catch (error) {
    console.error('Error in /api/ai/chat:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
