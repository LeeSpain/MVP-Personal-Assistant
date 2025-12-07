import { useState, useEffect } from "react";
import Modal from "./Modal";
import { DiaryEntry, Meeting, ActionLogEntry, ChatMessage, Contact } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface InsightsPanelProps {
  diaryEntries: DiaryEntry[];
  meetings: Meeting[];
  actionLog: ActionLogEntry[];
  chatMessages: ChatMessage[];
  contacts: Contact[];
  onClose: () => void;
  onGenerateInsights: () => Promise<string>;
}

export default function InsightsPanel({
  diaryEntries,
  meetings,
  actionLog,
  chatMessages,
  contacts,
  onClose,
  onGenerateInsights
}: InsightsPanelProps) {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // --- Real Metrics Calculation ---

  // 1. Chat Sessions (Last 7 Days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const chatsThisWeek = chatMessages.filter(m => m.role === 'assistant' && new Date(m.timestamp) > oneWeekAgo).length;

  // 2. Open Loops (Pending Meetings + Focus Items inferred)
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;
  const ideaEntries = diaryEntries.filter(d => d.type === 'Idea').length;
  const openLoopsCount = pendingMeetings + ideaEntries;

  // 3. Focus Balance (Deep Work vs Execution)
  const deepWorkCount = meetings.length;
  const executionCount = actionLog.length; // Actions taken
  const focusBalance = executionCount > 0 ? Math.round((deepWorkCount / executionCount) * 10) / 10 : 0;

  // 4. Relationship Touches
  const relationshipTouches = contacts.reduce((acc, contact) => {
    const mentions = diaryEntries.filter(d => d.content.includes(contact.name)).length;
    return acc + mentions;
  }, 0);


  useEffect(() => {
    if (!suggestions) {
      setIsLoadingSuggestions(true);
      onGenerateInsights()
        .then(text => setSuggestions(text))
        .catch(err => console.error("Failed to generate insights", err))
        .finally(() => setIsLoadingSuggestions(false));
    }
  }, [onGenerateInsights, suggestions]);

  return (
    <Modal open={true} title={t('insights.title')} onClose={onClose} className="max-w-6xl h-[85vh]">
      <div className="space-y-6 h-full flex flex-col">

        {/* Top Row: Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <MetricCard
            label={t('insights.metrics.activity')}
            value={chatsThisWeek.toString()}
            subtext="Chat sessions"
            icon="💬"
            trend="Active"
          />
          <MetricCard
            label={t('insights.metrics.loops')}
            value={openLoopsCount.toString()}
            subtext="Pending items"
            icon="⭕"
            trend={openLoopsCount > 5 ? "High" : "Stable"}
            trendColor={openLoopsCount > 5 ? "text-amber-400" : "text-emerald-400"}
          />
          <MetricCard
            label={t('insights.metrics.focus')}
            value={focusBalance.toString()}
            subtext="Deep Work / Exec"
            icon="⚖️"
          />
          <MetricCard
            label={t('insights.metrics.network')}
            value={relationshipTouches.toString()}
            subtext="Contact mentions"
            icon="👥"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* Left Column: AI Analysis (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  {t('insights.analysis')}
                </h3>
                {isLoadingSuggestions && <span className="text-xs text-slate-500">Processing...</span>}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingSuggestions ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
                    <div className="h-20 bg-slate-700/30 rounded w-full mt-4"></div>
                  </div>
                ) : suggestions ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed font-light text-base">
                      {suggestions}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-center mt-10">
                    Unable to generate insights at this time.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Breakdown (1/3 width) */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* Focus Breakdown */}
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {t('insights.breakdown')}
              </h3>
              <div className="space-y-4">
                <ProgressBar label="Deep Work (Meetings)" value={deepWorkCount} max={deepWorkCount + executionCount + 5} color="bg-blue-500" />
                <ProgressBar label="Execution (Actions)" value={executionCount} max={deepWorkCount + executionCount + 5} color="bg-emerald-500" />
                <ProgressBar label="Ideation (Entries)" value={ideaEntries} max={Math.max(ideaEntries * 2, 10)} color="bg-purple-500" />
              </div>
            </div>

            {/* Quick Stats / Summary */}
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 flex-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {t('insights.status')}
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                  <span>Diary Entries</span>
                  <span className="font-mono text-slate-100">{diaryEntries.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                  <span>Total Meetings</span>
                  <span className="font-mono text-slate-100">{meetings.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                  <span>Actions Logged</span>
                  <span className="font-mono text-slate-100">{actionLog.length}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Contacts</span>
                  <span className="font-mono text-slate-100">{contacts.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            {t('insights.close')}
          </button>
        </div>

      </div>
    </Modal>
  );
}

// --- Subcomponents for cleaner code ---

function MetricCard({ label, value, subtext, icon, trend, trendColor }: { label: string, value: string, subtext: string, icon: string, trend?: string, trendColor?: string }) {
  return (
    <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xl opacity-80 group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-slate-100">{value}</span>
        {trend && <span className={`text-xs font-medium mb-1.5 ${trendColor || 'text-slate-400'}`}>{trend}</span>}
      </div>
      <div className="text-xs text-slate-500 mt-1">{subtext}</div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-mono">{value}</span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
