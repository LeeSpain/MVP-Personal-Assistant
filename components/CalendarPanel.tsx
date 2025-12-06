import { useState } from 'react';
import Card from './Card';
import { MonthView, WeekView, ListView } from './CalendarViews';
import { Meeting } from '../types';
import { addMonths, subMonths, addWeeks, subWeeks, format, isSameDay } from 'date-fns';
import DayDetailModal from './DayDetailModal';

interface CalendarPanelProps {
    meetings: Meeting[];
    onUpdateMeetingStatus: (id: string, status: Meeting['status']) => void;
    onDeleteMeeting: (id: string) => void;
}

export default function CalendarPanel({
    meetings,
    onUpdateMeetingStatus,
    onDeleteMeeting
}: CalendarPanelProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'list'>('month');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const handlePrev = () => {
        if (view === 'month') {
            setCurrentDate(prev => subMonths(prev, 1));
        } else {
            setCurrentDate(prev => subWeeks(prev, 1));
        }
    };

    const handleNext = () => {
        if (view === 'month') {
            setCurrentDate(prev => addMonths(prev, 1));
        } else {
            setCurrentDate(prev => addWeeks(prev, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleDayClick = (day: Date) => {
        setSelectedDay(day);
    };

    return (
        <Card title="Calendar">
            <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">◀</button>
                        <button onClick={handleToday} className="text-[10px] font-semibold px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-200">Today</button>
                        <button onClick={handleNext} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">▶</button>
                        <span className="text-xs font-bold text-slate-200 ml-1 truncate max-w-[100px] sm:max-w-none">
                            {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d")}
                        </span>
                    </div>

                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 shrink-0">
                        <button
                            onClick={() => setView('month')}
                            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${view === 'month' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${view === 'week' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${view === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            List
                        </button>
                    </div>
                </div>

                {/* View Content */}
                <div className="flex-1 border border-slate-800 rounded-lg bg-slate-900/30 overflow-hidden min-h-0">
                    {view === 'month' ? (
                        <MonthView
                            currentDate={currentDate}
                            meetings={meetings}
                            onUpdateStatus={onUpdateMeetingStatus}
                            onDelete={onDeleteMeeting}
                            onDayClick={handleDayClick}
                        />
                    ) : view === 'week' ? (
                        <WeekView
                            currentDate={currentDate}
                            meetings={meetings}
                            onUpdateStatus={onUpdateMeetingStatus}
                            onDelete={onDeleteMeeting}
                            onDayClick={handleDayClick}
                        />
                    ) : (
                        <ListView
                            currentDate={currentDate}
                            meetings={meetings}
                            onUpdateStatus={onUpdateMeetingStatus}
                            onDelete={onDeleteMeeting}
                            onDayClick={handleDayClick}
                        />
                    )}
                </div>
            </div>

            <DayDetailModal
                date={selectedDay}
                onClose={() => setSelectedDay(null)}
                meetings={selectedDay ? meetings.filter(m => isSameDay(new Date(m.startTime), selectedDay)) : []}
                onUpdateStatus={onUpdateMeetingStatus}
                onDelete={onDeleteMeeting}
            />
        </Card>
    );
}
