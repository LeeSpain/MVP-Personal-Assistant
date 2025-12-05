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
  onDeleteFocusItem,
}) => {
  const [focusInput, setFocusInput] = useState('');

  const handleAddFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusInput.trim()) return;
    onAddFocusItem(focusInput.trim());
    setFocusInput('');
  };

  const upcomingMeetings = [...meetings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className="h-full flex flex-col bg-white/90 border border-slate-200 shadow-lg shadow-slate-900/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Today
          </span>
          <span className="text-sm font-semibold text-slate-800">
            Control Center
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-slate-50/60">
        {/* Focus */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Focus
            </h3>
          </div>

          <form onSubmit={handleAddFocus} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              placeholder="Add a focus item..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="text-[11px] px-3 py-1.5 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
            >
              Add
            </button>
          </form>

          {focusItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No focus items set.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {focusItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-xs text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {item}
                  </div>
                  <button
                    onClick={() => onDeleteFocusItem(idx)}
                    className="text-slate-300 hover:text-red-500 text-[10px] px-1"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Meetings */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meetings
            </h3>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No meetings scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingMeetings.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-800">
                      {m.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.startTime.toLocaleString()}
                    </span>
                    {m.videoLink && (
                      <a
                        href={m.videoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 text-[11px] text-cyan-600 hover:text-cyan-700"
                      >
                        Join call
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                        m.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200',
                      ].join(' ')}
                    >
                      {m.status}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdateMeetingStatus(m.id, 'confirmed')}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => onUpdateMeetingStatus(m.id, 'cancelled')}
                        className="text-[10px] text-rose-500 hover:text-rose-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onDeleteMeeting(m.id)}
                        className="text-[10px] text-slate-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notifications */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notifications
            </h3>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-200"
                >
                  <div className="pr-2 text-slate-700">{n.message}</div>
                  <button
                    onClick={() => onDismissNotification(n.id)}
                    className="text-[10px] text-slate-300 hover:text-slate-500 px-1"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contacts mini-list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Key Contacts
            </h3>
          </div>
          {contacts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No contacts configured yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {contacts.slice(0, 4).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-200"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.primaryChannel} · {c.address}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
