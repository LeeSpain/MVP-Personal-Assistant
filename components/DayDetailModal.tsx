import React from 'react';
import Modal from './Modal';
import { Meeting } from '../types';
import { format } from 'date-fns';

interface DayDetailModalProps {
    date: Date | null;
    onClose: () => void;
    meetings: Meeting[];
    onUpdateStatus: (id: string, status: Meeting['status']) => void;
    onDelete: (id: string) => void;
}

export default function DayDetailModal({ date, onClose, meetings, onUpdateStatus, onDelete }: DayDetailModalProps) {
    if (!date) return null;

    const sortedMeetings = [...meetings].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <Modal open={!!date} title={format(date, 'EEEE, MMMM do, yyyy')} onClose={onClose} className="max-w-md">
            <div className="space-y-4">
                {sortedMeetings.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic">
                        No meetings scheduled for this day.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedMeetings.map(meeting => (
                            <div
                                key={meeting.id}
                                className={`p-3 rounded-lg border flex justify-between items-start group ${meeting.status === 'confirmed' ? 'bg-slate-800/50 border-slate-700' :
                                        meeting.status === 'cancelled' ? 'bg-slate-900/50 border-slate-800 opacity-60' :
                                            'bg-amber-900/10 border-amber-900/30'
                                    }`}
                            >
                                <div>
                                    <div className={`font-medium text-sm ${meeting.status === 'cancelled' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                        {meeting.title}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {format(new Date(meeting.startTime), 'h:mm a')}
                                        {meeting.videoLink && (
                                            <a href={meeting.videoLink} target="_blank" rel="noreferrer" className="ml-2 text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                                                📹 Join
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {meeting.status !== 'confirmed' && meeting.status !== 'cancelled' && (
                                        <button
                                            onClick={() => onUpdateStatus(meeting.id, 'confirmed')}
                                            className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                            title="Confirm"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    {meeting.status !== 'cancelled' && (
                                        <button
                                            onClick={() => onUpdateStatus(meeting.id, 'cancelled')}
                                            className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
                                            title="Cancel"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(meeting.id)}
                                        className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
