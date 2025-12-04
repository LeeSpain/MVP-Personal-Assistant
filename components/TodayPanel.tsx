
import React from 'react';
import { Meeting, Notification } from '../types';

interface TodayPanelProps {
  meetings: Meeting[];
  notifications: Notification[];
  focusItems: string[];
  onUpdateMeetingStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
}

export const TodayPanel: React.FC<TodayPanelProps> = ({ meetings, notifications, focusItems, onUpdateMeetingStatus }) => {
  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* Today's Focus */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4">Today's Focus</h3>
        <ul className="space-y-3">
          {focusItems.length === 0 ? (
            <li className="text-sm text-slate-400 italic">No focus items set.</li>
          ) : (
            focusItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                {item}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Upcoming Meetings</h3>
        </div>
        <div className="p-2 overflow-y-auto">
          {meetings.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No meetings.</div>
          ) : (
            meetings.map(m => (
              <div key={m.id} className={`p-3 hover:bg-slate-50 rounded-lg flex gap-3 transition-colors ${m.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <div className={`flex flex-col items-center justify-center min-w-[3.5rem] rounded-md py-1 ${m.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'}`}>
                   <span className="text-[10px] font-bold uppercase">{m.startTime.toLocaleString('en-US', { weekday: 'short' })}</span>
                   <span className="text-sm font-bold">{m.startTime.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${m.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{m.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      {m.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <select
                      value={m.status}
                      onChange={(e) => onUpdateMeetingStatus(m.id, e.target.value as any)}
                      className={`text-[10px] font-medium uppercase border-none bg-transparent focus:ring-0 cursor-pointer ${
                        m.status === 'confirmed' ? 'text-emerald-600' :
                        m.status === 'cancelled' ? 'text-red-500' :
                        'text-amber-600'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Notifications</h3>
        </div>
        <div className="divide-y divide-slate-100 overflow-y-auto">
          {notifications.map(n => (
            <div key={n.id} className="p-4 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <p className="leading-snug">{n.message}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};