// components/TodayPanel.tsx
"use client";

import { useState } from "react";
import Card from "./Card";
import { Meeting, Notification, Contact } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

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

export default function TodayPanel({
  meetings,
  notifications,
  focusItems,
  contacts,
  onUpdateMeetingStatus,
  onAddFocusItem,
  onDeleteMeeting,
  onDismissNotification,
  onDeleteFocusItem
}: TodayPanelProps) {
  const { t, language } = useLanguage();
  const [focusInput, setFocusInput] = useState("");

  const handleAddFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (focusInput.trim()) {
      onAddFocusItem(focusInput.trim());
      setFocusInput("");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Notifications */}
      {notifications.length > 0 && (
        <Card title={t('today.notifications')}>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="text-xs bg-slate-800/50 p-2 rounded border border-slate-700 flex justify-between items-start">
                <span className="text-slate-200">{n.message}</span>
                <button onClick={() => onDismissNotification(n.id)} className="text-slate-500 hover:text-slate-300 ml-2">×</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Focus */}
      <Card title={t('today.focus')}>
        <ul className="space-y-2 mb-3">
          {focusItems.map((item, i) => (
            <li key={i} className="text-xs text-slate-200 flex justify-between group">
              <span>• {item}</span>
              <button onClick={() => onDeleteFocusItem(i)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100">×</button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddFocus} className="flex gap-2">
          <input
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-violet-500 outline-none"
            placeholder={t('today.addFocus')}
            value={focusInput}
            onChange={(e) => setFocusInput(e.target.value)}
          />
          <button type="submit" className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:bg-slate-700">+</button>
        </form>
      </Card>

      {/* Meetings */}
      <Card title={t('today.schedule')}>
        {meetings.length === 0 ? (
          <p className="text-xs text-slate-400">{t('today.emptySchedule')}</p>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li key={m.id} className="text-xs border-l-2 border-indigo-500 pl-2 py-1">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-200">{m.title}</span>
                  <div className="flex gap-1">
                    {m.videoLink && (
                      <a href={m.videoLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">📹</a>
                    )}
                    <button onClick={() => onDeleteMeeting(m.id)} className="text-slate-600 hover:text-red-400">×</button>
                  </div>
                </div>
                <div className="text-slate-400 text-[10px]">
                  {new Date(m.startTime).toLocaleTimeString(language === 'nl' ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
