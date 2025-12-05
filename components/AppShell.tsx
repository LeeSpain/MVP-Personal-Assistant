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
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
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