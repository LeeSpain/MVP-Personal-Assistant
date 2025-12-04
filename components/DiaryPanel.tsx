
import React, { useState } from 'react';
import { DiaryEntry, DiaryType } from '../types';

interface DiaryPanelProps {
  entries: DiaryEntry[];
  onAddEntry: (type: DiaryType, title: string, content: string) => void;
  onDeleteEntry: (id: string) => void;
}

type FilterType = 'All' | DiaryType;

export const DiaryPanel: React.FC<DiaryPanelProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [type, setType] = useState<DiaryType>('Reflection');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;
    onAddEntry(type, title, content);
    setContent('');
    setTitle('');
    setIsFormOpen(false);
    setFilter('All'); // Reset filter to show new entry
  };

  const filteredEntries = filter === 'All' 
    ? entries 
    : entries.filter(entry => entry.type === filter);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Diary & Notes</h3>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
        >
          {isFormOpen ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Filter Bar */}
      {!isFormOpen && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-slate-50 no-scrollbar">
          {(['All', 'Reflection', 'Decision', 'Idea'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                filter === f 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No {filter !== 'All' ? filter.toLowerCase() : ''} entries found.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="p-4 hover:bg-slate-50 rounded-lg transition-colors group mb-2 border border-transparent hover:border-slate-100 relative">
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  entry.type === 'Decision' ? 'bg-emerald-100 text-emerald-700' :
                  entry.type === 'Idea' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {entry.type}
                </span>
                <span className="text-[10px] text-slate-400">
                  {entry.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h4 className="font-medium text-slate-800 text-sm mb-1 pr-6">{entry.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {entry.content}
              </p>
              
              {/* Delete Button (Visible on Hover) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteEntry(entry.id); }}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                title="Delete Entry"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.49 1.478l-.56 12.553A3.75 3.75 0 0115.58 23h-7.16a3.75 3.75 0 01-3.744-3.752L4.09 6.695a48.774 48.774 0 01-3.473-.512.75.75 0 01-.49-1.478 48.856 48.856 0 013.878-.512h.227c.074-1.332.618-2.614 1.503-3.558a.75.75 0 011.134.975c-.53.565-.89 1.341-.99 2.227h5.886c-.1-.886-.46-1.662-.99-2.227a.75.75 0 011.134-.975c.885.944 1.43 2.226 1.503 3.558h.227zM7.5 6.75l.48 9.6a.75.75 0 001.498-.076l-.48-9.6a.75.75 0 00-1.498.076zm5.25.75a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0v-8.25zm2.752-.674a.75.75 0 00-1.498.076l.48 9.6a.75.75 0 001.498-.076l-.48-9.6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Form Area */}
      {isFormOpen && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              {(['Reflection', 'Decision', 'Idea'] as DiaryType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded border ${
                    type === t 
                      ? 'bg-white border-slate-300 text-slate-800 shadow-sm' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input 
              type="text"
              placeholder="Title..."
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Write your thoughts..."
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white text-xs font-medium py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              Save Entry
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
