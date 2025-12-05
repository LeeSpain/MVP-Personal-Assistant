import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const executePlannerFunction: FunctionDeclaration = {
  name: 'execute_planner',
  description: 'Execute actions like creating diary entries, scheduling meetings, setting focus, or sending emails.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actions: {
        type: Type.ARRAY,
        description: 'List of actions to execute',
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: 'Action type: CREATE_DIARY, CREATE_MEETING, ADD_NOTIFICATION, SET_FOCUS, SEND_EMAIL, GENERATE_VIDEO_LINK'
            },
            payload: {
              type: Type.OBJECT,
              description: 'Parameters for the action',
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                message: { type: Type.STRING },
                time: { type: Type.STRING, description: 'ISO date string' },
                diaryType: { type: Type.STRING, description: 'Reflection, Decision, or Idea' },
                focusText: { type: Type.STRING },
                recipient: { type: Type.STRING },
                subject: { type: Type.STRING },
                contactName: { type: Type.STRING },
                channel: { type: Type.STRING },
                platform: { type: Type.STRING, description: 'zoom, meet, or teams' }
              }
            }
          },
          required: ['type', 'payload']
        }
      }
    },
    required: ['actions']
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, history } = body;

    // Use Gemini API Key from environment variables
    if (!process.env.API_KEY) {
       return NextResponse.json(
        { error: "Missing API_KEY environment variable" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Map history to Gemini format (user/model)
    let contents = [];
    if (Array.isArray(history)) {
      contents = history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message || '' }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: context,
        tools: [{ functionDeclarations: [executePlannerFunction] }],
      }
    });

    const candidate = response.candidates?.[0];
    const modelParts = candidate?.content?.parts || [];
    
    let replyText = "";
    let actions: any[] = [];

    for (const part of modelParts) {
      if (part.text) {
        replyText += part.text;
      }
      if (part.functionCall) {
        if (part.functionCall.name === 'execute_planner') {
             const args = part.functionCall.args as any;
             if (args && Array.isArray(args.actions)) {
                 actions.push(...args.actions);
             }
        }
      }
    }

    return NextResponse.json({ 
        reply: replyText,
        actions: actions
    });

  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        error: "Something went wrong talking to the AI.",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}