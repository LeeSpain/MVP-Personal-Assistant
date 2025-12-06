// components/DiaryPanel.tsx
"use client";

import { DiaryEntry, DiaryType } from "../types";
import Card from "./Card";
import { useLanguage } from "../contexts/LanguageContext";

interface DiaryPanelProps {
  entries: DiaryEntry[];
  onAddEntry: (type: DiaryType, title: string, content: string) => void;
  onDeleteEntry: (id: string) => void;
}

export default function DiaryPanel({ entries, onAddEntry, onDeleteEntry }: DiaryPanelProps) {
  const { t, language } = useLanguage();
  return (
    <Card title={t('diary.title')}>
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-300">
            {t('diary.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="text-xs text-slate-200 border-b border-slate-800 pb-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-indigo-400">{t(`diary.types.${entry.type.toLowerCase()}`)}</span>
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-500 hover:text-red-400">×</button>
                </div>
                <div className="font-medium">{entry.title}</div>
                <div className="text-slate-400 mt-1">{entry.content}</div>
                <div className="text-[10px] text-slate-500 mt-1">{new Date(entry.createdAt).toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
