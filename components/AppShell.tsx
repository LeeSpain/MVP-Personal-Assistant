import React from 'react';
import { Topbar } from './Topbar';
import { Mode } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentMode, onModeChange }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Topbar currentMode={currentMode} onModeChange={onModeChange} />
      
      <main className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </main>
    </div>
  );
};
