import React from 'react';
import { Mode } from '../types';

interface TopbarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const MODES: Mode[] = ['Deep Work', 'Execution', 'Relationship', 'Recovery'];

export const Topbar: React.FC<TopbarProps> = ({ currentMode, onModeChange }) => {
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
        {/* Mobile Mode Selector Placeholder (simplified) */}
        <select 
          className="md:hidden bg-slate-50 border border-slate-200 text-xs rounded-md px-2 py-1"
          value={currentMode}
          onChange={(e) => onModeChange(e.target.value as Mode)}
        >
          {MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm cursor-pointer">
          M
        </div>
      </div>
    </header>
  );
};
