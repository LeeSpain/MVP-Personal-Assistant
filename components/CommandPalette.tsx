import React, { useState } from 'react';
import { PlannerAction, ActionType } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  isProcessing: boolean;
  lastCommandText: string | null;
  reply: string | null;
  actions: PlannerAction[];
  onPlanCommand: (commandText: string) => void;
  onExecute: () => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  isProcessing, 
  reply, 
  actions, 
  onPlanCommand, 
  onExecute, 
  onClose 
}) => {
  const [commandText, setCommandText] = useState('');

  if (!isOpen) return null;

  const handlePlan = () => {
    if (commandText.trim()) onPlanCommand(commandText);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-800 overflow-hidden text-slate-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-semibold text-white">Command Palette</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/50 flex-1">
          <div className="space-y-2">
            <textarea
              className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none placeholder-slate-500"
              rows={3}
              placeholder="e.g. Schedule a meeting with Lee next Tuesday..."
              value={commandText}
              onChange={e => setCommandText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePlan())}
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePlan}
                disabled={isProcessing || !commandText.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-500 transition-colors"
              >
                {isProcessing ? 'Planning...' : 'Plan Actions'}
              </button>
            </div>
          </div>

          {(reply || actions.length > 0) && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {reply && (
                <div className="bg-indigo-950/30 p-4 rounded-xl text-sm text-indigo-200 border border-indigo-900/50">
                  {reply}
                </div>
              )}
              {actions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned Actions</h3>
                  {actions.map((action, i) => (
                    <div key={i} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-sm shadow-sm flex items-center gap-3">
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-1 rounded uppercase">
                        {action.type.replace('CREATE_', '').replace('GENERATE_', '')}
                      </span>
                      <span className="text-slate-300 truncate flex-1">
                        {action.payload.title || action.payload.message || action.payload.content || 'Action'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Cancel</button>
          <button 
            onClick={onExecute}
            disabled={actions.length === 0}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            Execute Plan
          </button>
        </div>
      </div>
    </div>
  );
};