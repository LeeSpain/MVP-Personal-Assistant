// components/DiaryPanel.tsx
"use client";

import { DiaryEntry, DiaryType } from "../types";
import Card from "./Card";

interface DiaryPanelProps {
  entries: DiaryEntry[];
  onAddEntry: (type: DiaryType, title: string, content: string) => void;
  onDeleteEntry: (id: string) => void;
}

export default function DiaryPanel({ entries, onAddEntry, onDeleteEntry }: DiaryPanelProps) {
  return (
    <Card title="Diary">
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-300">
            No entries yet. Start chatting to generate reflections.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="text-xs text-slate-200 border-b border-slate-800 pb-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-indigo-400">{entry.type}</span>
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-500 hover:text-red-400">×</button>
                </div>
                <div className="font-medium">{entry.title}</div>
                <div className="text-slate-400 mt-1">{entry.content}</div>
                <div className="text-[10px] text-slate-500 mt-1">{new Date(entry.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
