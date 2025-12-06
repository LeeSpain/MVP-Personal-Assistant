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
        // Optimistic update
        setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m));

        try {
            const res = await fetch(`/api/meetings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update meeting status');
        } catch (err) {
            console.error(err);
            // Revert on error? For MVP, just log.
            fetchMeetings(); // Re-sync
        }
    };

    const deleteMeeting = async (id: string) => {
        // Optimistic update
        setMeetings(prev => prev.filter(m => m.id !== id));

        try {
            const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete meeting');
        } catch (err) {
            console.error(err);
            fetchMeetings(); // Re-sync
        }
    };

    return { meetings, isLoading, error, addMeeting, updateMeetingStatus, deleteMeeting, refresh: fetchMeetings };
}
