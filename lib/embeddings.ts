import { GoogleGenerativeAI } from "@google/generative-ai";

let model: any = null;

function getModel() {
    if (model) return model;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set (embeddings)");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "embedding-001" });
    return model;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Embeddings don't support empty strings well
        const cleanText = text.replace(/\n/g, " ").trim();
        if (!cleanText) return [];

        const result = await getModel().embedContent(cleanText);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}
