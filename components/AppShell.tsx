import React from 'react';
import { Topbar } from './Topbar';
import { MobileNav, MobileTab } from './MobileNav';
import { Mode } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
  onOpenContacts: () => void;
  onOpenCommandPalette: () => void;
  activeMobileTab?: MobileTab;
  onMobileTabChange?: (tab: MobileTab) => void;
  onGenerateDailySummary: () => void;
  onGenerateWeeklySummary: () => void;
  isSummarizing: boolean;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  currentMode,
  onModeChange,
  onOpenSettings,
  onOpenInsights,
  onOpenContacts,
  onOpenCommandPalette,
  activeMobileTab,
  onMobileTabChange,
  onGenerateDailySummary,
  onGenerateWeeklySummary,
  isSummarizing
}) => {
  const getModeStyles = (m: Mode) => {
    switch (m) {
      case 'Deep Work': return 'bg-slate-950 from-slate-900 to-slate-950'; // Calm, dark
      case 'Execution': return 'bg-slate-950 from-slate-900 to-indigo-950/20'; // Energetic hint
      case 'Relationship': return 'bg-slate-950 from-slate-900 to-rose-950/20'; // Warm
      case 'Recovery': return 'bg-slate-950 from-slate-900 to-emerald-950/20'; // Gentle
      default: return 'bg-slate-950';
    }
  };

  return (
    <div className={`flex flex-col h-screen text-slate-100 overflow-hidden font-sans bg-gradient-to-br ${getModeStyles(currentMode)} transition-colors duration-700 relative`}>
      <div className="absolute top-0 left-0 right-0 z-50">
        <Topbar
          currentMode={currentMode}
          onModeChange={onModeChange}
          onOpenSettings={onOpenSettings}
          onOpenInsights={onOpenInsights}
          onOpenContacts={onOpenContacts}
          onOpenCommandPalette={onOpenCommandPalette}
          onGenerateDailySummary={onGenerateDailySummary}
          onGenerateWeeklySummary={onGenerateWeeklySummary}
          isSummarizing={isSummarizing}
        />
      </div>

      <main className="flex-1 overflow-hidden p-2 lg:p-6 pt-[4.5rem] lg:pt-[5.5rem] relative z-0">
        <div className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </main>

      {activeMobileTab && onMobileTabChange && (
        <MobileNav activeTab={activeMobileTab} onTabChange={onMobileTabChange} />
      )}
    </div>
  );
};

export default AppShell;