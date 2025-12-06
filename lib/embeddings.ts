import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Embeddings don't support empty strings well
        const cleanText = text.replace(/\n/g, " ").trim();
        if (!cleanText) return [];

        const result = await model.embedContent(cleanText);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}
