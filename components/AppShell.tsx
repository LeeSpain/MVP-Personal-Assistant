import React from 'react';
import { Topbar } from './Topbar';
import { Mode } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
  onOpenCommandPalette?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentMode,
  onModeChange,
  onOpenSettings,
  onOpenInsights,
  onOpenCommandPalette,
}) => {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-900 overflow-hidden font-sans">

      {/* ──────────────────────────────────────────────── */}
      {/* TOP HEADER / COCKPIT — FULL WIDTH */}
      {/* ──────────────────────────────────────────────── */}
      <header className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shadow-md shadow-slate-900/20">
        <Topbar
          currentMode={currentMode}
          onModeChange={onModeChange}
          onOpenSettings={onOpenSettings}
          onOpenInsights={onOpenInsights}
          onOpenCommandPalette={onOpenCommandPalette}
        />
      </header>

      {/* ──────────────────────────────────────────────── */}
      {/* MAIN WORKSPACE — FULL WIDTH */}
      {/* ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden bg-slate-100 w-full">
        {/* Full-width content area */}
        <div className="h-full w-full px-4 md:px-6 lg:px-10 py-6">
          {/* Responsive 3-column layout */}
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
