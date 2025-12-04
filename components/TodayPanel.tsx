
import React, { useState } from 'react';
import { Meeting, Notification, Contact } from '../types';

interface TodayPanelProps {
  meetings: Meeting[];
  notifications: Notification[];
  focusItems: string[];
  contacts: Contact[];
  onUpdateMeetingStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  onAddFocusItem: (text: string) => void;
  onDeleteMeeting: (id: string) => void;
  onDismissNotification: (id: string) => void;
  onDeleteFocusItem: (index: number) => void;
}

export const TodayPanel: React.FC<TodayPanelProps> = ({ 
  meetings, 
  notifications, 
  focusItems, 
  contacts,
  onUpdateMeetingStatus,
  onAddFocusItem,
  onDeleteMeeting,
  onDismissNotification,
  onDeleteFocusItem
}) => {
  const [newFocus, setNewFocus] = useState('');

  const handleFocusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFocus.trim()) return;
    onAddFocusItem(newFocus.trim());
    setNewFocus('');
  };

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* Today's Focus */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4">Today's Focus</h3>
        <ul className="space-y-3 mb-4">
          {focusItems.length === 0 ? (
            <li className="text-sm text-slate-400 italic">No focus items set.</li>
          ) : (
            focusItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-700 group justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {item}
                </div>
                <button 
                  onClick={() => onDeleteFocusItem(i)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
                >
                  ✕
                </button>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={handleFocusSubmit} className="relative">
          <input
            type="text"
            value={newFocus}
            onChange={(e) => setNewFocus(e.target.value)}
            placeholder="+ Add focus item..."
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
          />
        </form>
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
              <div key={m.id} className={`p-3 hover:bg-slate-50 rounded-lg flex gap-3 transition-colors group relative ${m.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <div className={`flex flex-col items-center justify-center min-w-[3.5rem] rounded-md py-1 ${m.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'}`}>
                   <span className="text-[10px] font-bold uppercase">{m.startTime.toLocaleString('en-US', { weekday: 'short' })}</span>
                   <span className="text-sm font-bold">{m.startTime.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0 pr-6">
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
                  
                  {m.videoLink && m.status !== 'cancelled' && (
                    <div className="mt-2">
                      <a 
                        href={m.videoLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center text-[10px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join Call
                      </a>
                    </div>
                  )}

                </div>
                {/* Delete Meeting Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteMeeting(m.id); }}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  title="Delete Meeting"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                     <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.49 1.478l-.56 12.553A3.75 3.75 0 0115.58 23h-7.16a3.75 3.75 0 01-3.744-3.752L4.09 6.695a48.774 48.774 0 01-3.473-.512.75.75 0 01-.49-1.478 48.856 48.856 0 013.878-.512h.227c.074-1.332.618-2.614 1.503-3.558a.75.75 0 011.134.975c-.53.565-.89 1.341-.99 2.227h5.886c-.1-.886-.46-1.662-.99-2.227a.75.75 0 011.134-.975c.885.944 1.43 2.226 1.503 3.558h.227zM7.5 6.75l.48 9.6a.75.75 0 001.498-.076l-.48-9.6a.75.75 0 00-1.498.076zm5.25.75a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0v-8.25zm2.752-.674a.75.75 0 00-1.498.076l.48 9.6a.75.75 0 001.498-.076l-.48-9.6z" clipRule="evenodd" />
                   </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Contacts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 shrink-0">
         <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">Key Contacts</h3>
         <div className="space-y-2">
            {contacts.length === 0 ? (
               <div className="text-xs text-slate-400 italic">No contacts added.</div>
            ) : (
               contacts.slice(0, 3).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between text-sm">
                     <span className="font-medium text-slate-700">{contact.name}</span>
                     <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{contact.primaryChannel}</span>
                  </div>
               ))
            )}
            {contacts.length > 3 && (
               <div className="text-xs text-center text-slate-400 mt-2">
                  + {contacts.length - 3} more
               </div>
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
            <div key={n.id} className="p-4 text-sm text-slate-600 hover:bg-slate-50 transition-colors group relative pr-8">
              <p className="leading-snug">{n.message}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button 
                  onClick={() => onDismissNotification(n.id)}
                  className="absolute top-4 right-2 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  title="Dismiss"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
