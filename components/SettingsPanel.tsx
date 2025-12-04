
import React from 'react';
import { Settings } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
  onReset: () => void;
  onClearChat: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, onClose, onReset, onClearChat }) => {
  const handleChange = (key: keyof Settings, value: any) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-800">Settings</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Goals */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Primary Goals</label>
            <textarea
              value={settings.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
              placeholder="e.g. Launch product V2, Improve work-life balance..."
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]"
            />
            <p className="text-[10px] text-slate-400">Your digital self will keep these in mind when advising you.</p>
          </div>

          {/* AI Behavior */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">AI Persona & Behavior</label>
            <textarea
              value={settings.aiBehavior}
              onChange={(e) => handleChange('aiBehavior', e.target.value)}
              placeholder="e.g. Act as a ruthless chief of staff. Be concise. No fluff."
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]"
            />
            <p className="text-[10px] text-slate-400">Define the personality and tone of your assistant.</p>
          </div>

          {/* Automation */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Automation</label>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">Auto-create meetings</span>
                <span className="text-xs text-slate-400">Allow AI to add meetings to calendar without asking.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoCreateMeetings}
                  onChange={(e) => handleChange('autoCreateMeetings', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">Confirm before email</span>
                <span className="text-xs text-slate-400">Draft emails instead of sending immediately.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.requireConfirmBeforeEmail}
                  onChange={(e) => handleChange('requireConfirmBeforeEmail', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 mt-4 border-t border-red-100">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                <span className="text-sm text-red-700">Clear chat history</span>
                <button 
                  onClick={onClearChat}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded hover:bg-red-50 transition-colors shadow-sm"
                >
                  Clear Chat
                </button>
              </div>

              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                <span className="text-sm text-red-700">Reset all data</span>
                <button 
                  onClick={onReset}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded hover:bg-red-50 transition-colors shadow-sm"
                >
                  Reset App
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
