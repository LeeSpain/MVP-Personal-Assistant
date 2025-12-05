import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { DiaryEntry, Meeting, ChatMessage } from '../types';

interface SummaryRequest {
    diaryEntries: DiaryEntry[];
    meetings: Meeting[];
    chatHistory: ChatMessage[];
    timeframe: 'day' | 'week';
}

export const useMemorySummarizer = () => {
    const [isSummarizing, setIsSummarizing] = useState(false);

    const generateSummary = async (data: SummaryRequest): Promise<string | null> => {
        setIsSummarizing(true);
        try {
            const prompt = `
        Please summarize the following data for the last ${data.timeframe}.
        Focus on:
        - Key decisions made
        - Major themes or ideas
        - Open loops (unfinished tasks)
        - Emotional state or energy levels

        DATA:
        Diary: ${JSON.stringify(data.diaryEntries.map(d => ({ title: d.title, content: d.content })))}
        Meetings: ${JSON.stringify(data.meetings.map(m => ({ title: m.title, status: m.status })))}
        Recent Chat: ${JSON.stringify(data.chatHistory.slice(-10).map(c => ({ role: c.role, content: c.content })))}
      `;

            // We use a simplified context for the summarizer itself
            const response = await geminiService.sendMessage(prompt, "Summarization Task", []);
            return response.text;
        } catch (error) {
            console.error("Summarization failed:", error);
            return null;
        } finally {
            setIsSummarizing(false);
        }
    };

    return { generateSummary, isSummarizing };
};
