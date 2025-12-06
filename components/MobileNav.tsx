import React from 'react';
import { BookOpen, MessageSquare, Sun, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type MobileTab = 'diary' | 'chat' | 'today' | 'calendar';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
    { id: 'diary', label: t('nav.diary'), icon: BookOpen },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare },
    { id: 'today', label: t('nav.today'), icon: Sun },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
  ];

  return (
    <div className="lg:hidden h-[80px] bg-slate-950/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 pb-safe z-50 shrink-0 fixed bottom-0 left-0 right-0 shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 group`}
          >
            {/* Active Indicator Glow */}
            {isActive && (
              <div className="absolute -top-1 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            )}

            <Icon
              size={24}
              className={`transition-all duration-300 ${isActive ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 group-hover:text-slate-300'}`}
              strokeWidth={isActive ? 2.5 : 2}
            />

            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};