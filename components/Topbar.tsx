
import React from 'react';
import { Mode } from '../types';

interface TopbarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
}

const MODES: Mode[] = ['Deep Work', 'Execution', 'Relationship', 'Recovery'];

export const Topbar: React.FC<TopbarProps> = ({ currentMode, onModeChange, onOpenSettings, onOpenInsights }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
          M
        </div>
        <h1 className="font-semibold text-slate-800 tracking-tight hidden sm:block">
          Martijn’s Digital Self
        </h1>
      </div>

      {/* Center: Mode Selector */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          {MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Actions / Avatar */}
      <div className="flex items-center gap-4">
        {/* Mobile Mode Selector */}
        <select 
          className="md:hidden bg-slate-50 border border-slate-200 text-xs rounded-md px-2 py-1"
          value={currentMode}
          onChange={(e) => onModeChange(e.target.value as Mode)}
        >
          {MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenInsights}
            className="inline-flex items-center text-xs px-3 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Insights
          </button>
          
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center text-xs px-3 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Settings
          </button>
        </div>
        
        {/* Mobile Icons */}
        <button 
          onClick={onOpenInsights}
          className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
          title="Insights"
        >
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
             <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
             <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
           </svg>
        </button>

        <button 
          onClick={onOpenSettings}
          className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
          title="Settings"
        >
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.819l1.019-.393c.115-.044.283-.032.45.083a7.49 7.49 0 00.985.57c.182.088.277.228.297.348l.178 1.072c.15.904.932 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.393a1.875 1.875 0 002.28-.819l.922-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.819l-1.02.393c-.114.044-.282.033-.45-.083a7.491 7.491 0 00-.985-.57c-.182-.089-.277-.229-.297-.348l-.178-1.072a1.875 1.875 0 00-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm cursor-pointer">
          M
        </div>
      </div>
    </header>
  );
};
