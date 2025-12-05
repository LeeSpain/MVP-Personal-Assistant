import { useState, useEffect, useCallback } from 'react';
import { Meeting } from '../types';

export function useMeetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMeetings = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/meetings');
            if (!res.ok) throw new Error('Failed to fetch meetings');
            const data = await res.json();
            // Convert date strings back to Date objects
            const parsed = data.map((m: any) => ({
                ...m,
                startTime: new Date(m.startTime),
                endTime: m.endTime ? new Date(m.endTime) : undefined,
                createdAt: new Date(m.createdAt),
                updatedAt: new Date(m.updatedAt),
            }));
            setMeetings(parsed);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const addMeeting = async (meeting: Partial<Meeting>) => {
        try {
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meeting),
            });
            if (!res.ok) throw new Error('Failed to create meeting');
            const newMeeting = await res.json();
            // Optimistic update or refetch
            await fetchMeetings();
            return newMeeting;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateMeetingStatus = async (id: string, status: Meeting['status']) => {
        // For MVP, we might not have a specific PATCH endpoint yet, 
        // but we can assume we'd add one or just re-create/update.
        // Let's implement a simple optimistic update for now
        setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m));

        // TODO: Implement actual API call
        // await fetch(`/api/meetings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    };

    const deleteMeeting = async (id: string) => {
        setMeetings(prev => prev.filter(m => m.id !== id));
        // TODO: Implement actual API call
        // await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    };

    return { meetings, isLoading, error, addMeeting, updateMeetingStatus, deleteMeeting, refresh: fetchMeetings };
}
