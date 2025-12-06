import React from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addDays,
    startOfDay,
    differenceInMinutes,
    isWithinInterval
} from 'date-fns';
import { Meeting } from '../types';

interface CalendarViewProps {
    currentDate: Date;
    meetings: Meeting[];
    onUpdateStatus: (id: string, status: Meeting['status']) => void;
    onDelete: (id: string) => void;
    onDayClick: (day: Date) => void;
}

// --- Month View ---
export const MonthView: React.FC<CalendarViewProps> = ({ currentDate, meetings, onUpdateStatus, onDelete, onDayClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex flex-col h-full">
            {/* Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-800">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
                {days.map(day => {
                    const dayMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(day)}
                            className={`border-r border-b border-slate-800/50 p-1 min-h-[80px] relative group cursor-pointer hover:bg-slate-800/30 transition-colors ${!isCurrentMonth ? 'bg-slate-950/50 text-slate-600' : 'bg-transparent'
                                }`}
                        >
                            <div className={`text-xs font-medium mb-1 ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
                                {dayMeetings.map(meeting => (
                                    <div
                                        key={meeting.id}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening day modal when clicking a meeting
                                            // Maybe open meeting details? For now just stop prop.
                                        }}
                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-default transition-colors group/item relative ${meeting.status === 'confirmed' ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30' :
                                            meeting.status === 'cancelled' ? 'bg-slate-800 text-slate-500 line-through' :
                                                'bg-amber-500/10 text-amber-200 border border-amber-500/30 border-dashed'
                                            }`}
                                        title={`${meeting.title} (${format(new Date(meeting.startTime), 'HH:mm')})`}
                                    >
                                        {format(new Date(meeting.startTime), 'HH:mm')} {meeting.title}

                                        {/* Quick Actions on Hover */}
                                        <div className="absolute right-0 top-0 bottom-0 hidden group-hover/item:flex items-center bg-slate-900/90 px-1 gap-1">
                                            {meeting.status !== 'confirmed' && (
                                                <button onClick={() => onUpdateStatus(meeting.id, 'confirmed')} className="text-green-400 hover:text-green-300">✓</button>
                                            )}
                                            {meeting.status !== 'cancelled' && (
                                                <button onClick={() => onUpdateStatus(meeting.id, 'cancelled')} className="text-slate-400 hover:text-slate-300">×</button>
                                            )}
                                            <button onClick={() => onDelete(meeting.id)} className="text-red-400 hover:text-red-300">🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Week View ---
export const WeekView: React.FC<CalendarViewProps> = ({ currentDate, meetings, onUpdateStatus, onDelete, onDayClick }) => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 17 }).map((_, i) => i + 6); // 6 AM to 10 PM

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-slate-800 ml-10">
                {days.map(day => {
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(day)}
                            className="flex-1 py-2 text-center border-l border-slate-800/50 cursor-pointer hover:bg-slate-800/30 transition-colors"
                        >
                            <div className={`text-xs font-semibold uppercase ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                                {format(day, 'EEE')}
                            </div>
                            <div className={`text-sm font-bold ${isToday ? 'text-violet-400' : 'text-slate-300'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="relative min-h-[1020px]"> {/* 17 hours * 60px height */}
                    {/* Hour Lines */}
                    {hours.map((hour, i) => (
                        <div key={hour} className="absolute w-full flex items-center" style={{ top: `${i * 60}px` }}>
                            <div className="w-10 text-[10px] text-slate-500 text-right pr-2 -mt-2">
                                {hour}:00
                            </div>
                            <div className="flex-1 border-t border-slate-800/30 h-px"></div>
                        </div>
                    ))}

                    {/* Vertical Day Lines */}
                    <div className="absolute top-0 bottom-0 left-10 right-0 flex pointer-events-none">
                        {days.map((_, i) => (
                            <div key={i} className="flex-1 border-l border-slate-800/30 h-full"></div>
                        ))}
                    </div>

                    {/* Events */}
                    {meetings.map(meeting => {
                        const mStart = new Date(meeting.startTime);
                        // Check if meeting is in this week
                        if (!isWithinInterval(mStart, { start: startOfDay(startDate), end: addDays(startDate, 7) })) return null;

                        const dayIndex = (mStart.getDay() + 6) % 7; // Adjust for Monday start (0=Mon, 6=Sun)
                        const startHour = mStart.getHours();
                        const startMin = mStart.getMinutes();

                        if (startHour < 6 || startHour > 22) return null; // Out of view

                        const top = (startHour - 6) * 60 + startMin;
                        const height = 60; // Default 1 hour for now, ideally calculate duration

                        return (
                            <div
                                key={meeting.id}
                                className={`absolute left-10 right-0 z-10 mx-1 rounded p-1 text-[10px] overflow-hidden border cursor-pointer group ${meeting.status === 'confirmed' ? 'bg-indigo-600/80 text-white border-indigo-500' :
                                    meeting.status === 'cancelled' ? 'bg-slate-800/80 text-slate-500 border-slate-700 line-through' :
                                        'bg-amber-600/80 text-white border-amber-500 border-dashed'
                                    }`}
                                style={{
                                    width: `calc((100% - 40px) / 7 - 4px)`,
                                    left: `calc(40px + ((100% - 40px) / 7) * ${dayIndex} + 2px)`,
                                    top: `${top}px`,
                                    height: `${height}px`
                                }}
                            >
                                <div className="font-semibold truncate">{meeting.title}</div>
                                <div className="opacity-80">{format(mStart, 'HH:mm')}</div>

                                {/* Quick Actions Overlay */}
                                <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center gap-2">
                                    {meeting.status !== 'confirmed' && (
                                        <button onClick={() => onUpdateStatus(meeting.id, 'confirmed')} className="text-green-400 hover:text-green-300 text-xs">✓</button>
                                    )}
                                    <button onClick={() => onDelete(meeting.id)} className="text-red-400 hover:text-red-300 text-xs">🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- List View (Mobile Optimized) ---
export const ListView: React.FC<CalendarViewProps> = ({ currentDate, meetings, onUpdateStatus, onDelete, onDayClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {days.map(day => {
                const dayMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), day));
                if (dayMeetings.length === 0) return null;

                const isToday = isSameDay(day, new Date());

                return (
                    <div key={day.toString()} className="mb-4 px-4">
                        <div className={`text-xs font-bold uppercase mb-2 sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10 ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                            {format(day, 'EEEE, MMMM d')}
                        </div>
                        <div className="space-y-2">
                            {dayMeetings.map(meeting => (
                                <div key={meeting.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">{meeting.title}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span>{format(new Date(meeting.startTime), 'h:mm a')}</span>
                                            {meeting.status === 'cancelled' && <span className="text-red-400">(Cancelled)</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {meeting.status !== 'confirmed' && (
                                            <button onClick={() => onUpdateStatus(meeting.id, 'confirmed')} className="p-2 bg-slate-700 rounded-full text-green-400">✓</button>
                                        )}
                                        <button onClick={() => onDelete(meeting.id)} className="p-2 bg-slate-700 rounded-full text-red-400">🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            <div className="h-20"></div> {/* Spacer for bottom nav */}
        </div>
    );
};
