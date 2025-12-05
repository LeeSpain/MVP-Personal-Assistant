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
  onMobileTabChange
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
    <div className={`flex flex-col h-screen text-slate-100 overflow-hidden font-sans bg-gradient-to-br ${getModeStyles(currentMode)} transition-colors duration-700`}>
      <div className="shrink-0">
        <Topbar
          currentMode={currentMode}
          onModeChange={onModeChange}
          onOpenSettings={onOpenSettings}
          onOpenInsights={onOpenInsights}
          onOpenContacts={onOpenContacts}
          onOpenCommandPalette={onOpenCommandPalette}
        />
      </div>

      <main className="flex-1 overflow-hidden p-2 lg:p-6 relative">
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