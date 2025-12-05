import React from 'react';

export type MobileTab = 'diary' | 'chat' | 'today';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="lg:hidden h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 pb-safe z-30 shrink-0">
      <button
        onClick={() => onTabChange('diary')}
        className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${
          activeTab === 'diary' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className="text-[10px] font-medium">Diary</span>
      </button>
      <button
        onClick={() => onTabChange('chat')}
        className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${
          activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className="text-[10px] font-medium">Chat</span>
      </button>
      <button
        onClick={() => onTabChange('today')}
        className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${
          activeTab === 'today' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className="text-[10px] font-medium">Today</span>
      </button>
    </div>
  );
};