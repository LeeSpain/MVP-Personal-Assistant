import { useState, useEffect, useCallback } from 'react';
import { DiaryEntry, DiaryType } from '../types';

export function useDiary() {
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDiary = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/diary');
            if (!res.ok) throw new Error('Failed to fetch diary');
            const data = await res.json();
            const parsed = data.map((d: any) => ({
                ...d,
                createdAt: new Date(d.createdAt),
            }));
            setDiaryEntries(parsed);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDiary();
    }, [fetchDiary]);

    const addDiaryEntry = async (type: DiaryType, title: string, content: string) => {
        try {
            const res = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, title, content }),
            });
            if (!res.ok) throw new Error('Failed to create diary entry');
            const newEntry = await res.json();
            // Optimistic or refetch
            await fetchDiary();
            return newEntry;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteDiaryEntry = async (id: string) => {
        // Optimistic update
        setDiaryEntries(prev => prev.filter(e => e.id !== id));
        try {
            const res = await fetch(`/api/diary/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete diary entry');
        } catch (err) {
            console.error(err);
            fetchDiary(); // Re-sync
        }
    };

    return { diaryEntries, isLoading, error, addDiaryEntry, deleteDiaryEntry, refresh: fetchDiary };
}
