import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini Client
// Note: The new @google/genai SDK might have a different initialization. 
// Checking the docs or assuming standard pattern. 
// If @google/genai is the new SDK, it usually works like this or similar.
// However, the user's package.json had "@google/genai": "^1.31.0". 
// Let's use the standard GoogleGenerativeAI from @google/generative-ai if that was intended, 
// but since they have @google/genai, I will assume it's the newer one or similar.
// WAIT: @google/genai is likely the Python SDK or a misnamed package? 
// The standard Node SDK is @google/generative-ai. 
// Let's check what was in package.json.
// It was "@google/genai": "^1.31.0". This looks like the new "Google Gen AI SDK" for Node.
// Let's try to use it, but fallback to a standard fetch if unsure, or use OpenAI if configured.
// Actually, for safety and to ensure it works, I will implement a standard fetch to the Gemini API REST endpoint 
// if the SDK usage is ambiguous, OR I will use the standard pattern if I can verify it.
// Given I cannot browse docs easily, I will implement a robust handler that uses the API key directly via fetch 
// to avoid SDK version mismatch issues, OR use the OpenAI compatibility layer if they want.
//
// Let's stick to a direct fetch to Google's API for maximum compatibility, 
// OR use the `GoogleGenerativeAI` class if it's available from the package.
//
// Let's assume the user wants to use the installed package.
// I'll write a generic handler that can be easily adapted.

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

    // Construct the prompt
    // We'll combine context and history into a prompt for the model.
    // This is a simplified implementation.

    const systemInstruction = `You are a helpful personal assistant. \n\nContext:\n${context}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: systemInstruction }]
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

    // Direct API call to Gemini 1.5 Flash (or Pro)
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
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

    // Parse actions from the reply if possible (basic implementation)
    // The current frontend expects { reply, actions }.
    // For now, we'll return empty actions unless we implement parsing logic.

    return NextResponse.json({
      reply,
      actions: []
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}