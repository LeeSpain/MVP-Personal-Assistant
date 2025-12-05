import React from 'react';
import { Mode } from '../types';
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

interface TopbarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
  onOpenContacts: () => void;
  onOpenCommandPalette: () => void;
  onGenerateDailySummary: () => void;
  onGenerateWeeklySummary: () => void;
  isSummarizing: boolean;
}

const MODES: Mode[] = ['Deep Work', 'Execution', 'Relationship', 'Recovery'];

export const Topbar: React.FC<TopbarProps> = ({
  currentMode,
  onModeChange,
  onOpenSettings,
  onOpenInsights,
  onOpenContacts,
  onOpenCommandPalette,
  onGenerateDailySummary,
  onGenerateWeeklySummary,
  isSummarizing
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 lg:px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-lg">M</div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-slate-100">Martijn’s Digital Self</div>
          <div className="text-xs text-slate-400 hidden sm:block">Personal AI Dashboard</div>
        </div>
      </div>

      <div className="hidden md:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentMode === mode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onGenerateDailySummary}
          disabled={isSummarizing}
          className="hidden md:inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          {isSummarizing ? '...' : 'Day'}
        </button>
        <button
          onClick={onGenerateWeeklySummary}
          disabled={isSummarizing}
          className="hidden md:inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          {isSummarizing ? '...' : 'Week'}
        </button>
        <div className="w-px h-6 bg-slate-800 mx-1"></div>
        <button onClick={onOpenCommandPalette} className="hidden md:inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Command</button>
        <button onClick={onOpenContacts} className="hidden md:inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Contacts</button>
        <button onClick={onOpenInsights} className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Insights</button>
        <button onClick={onOpenSettings} className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Settings</button>

        <div className="ml-2 pl-2 border-l border-slate-800 flex items-center">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs px-3 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};