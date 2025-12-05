import { useState, useEffect } from "react";
import Card from "./Card";
import Modal from "./Modal";
import { DiaryEntry, Meeting, ActionLogEntry, ChatMessage, Contact } from "../types";

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
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // --- Real Metrics Calculation ---

  // 1. Chat Sessions (Last 7 Days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const chatsThisWeek = chatMessages.filter(m => m.role === 'assistant' && new Date(m.timestamp) > oneWeekAgo).length;

  // 2. Open Loops (Pending Meetings + Focus Items inferred)
  // We don't have direct access to focusItems here, so we'll use pending meetings as a proxy for now, 
  // or maybe just count "Idea" type diary entries.
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;
  const ideaEntries = diaryEntries.filter(d => d.type === 'Idea').length;
  const openLoopsCount = pendingMeetings + ideaEntries;

  // 3. Focus Balance (Deep Work vs Execution)
  // Deep Work = Meetings > 30 mins (approx)
  // Execution = Notifications / Short tasks
  const deepWorkCount = meetings.length;
  const executionCount = actionLog.length; // Actions taken
  const focusBalance = executionCount > 0 ? Math.round((deepWorkCount / executionCount) * 10) / 10 : 0; // Ratio

  // 4. Relationship Touches
  // Count diary entries that mention contact names (simple check)
  const relationshipTouches = contacts.reduce((acc, contact) => {
    const mentions = diaryEntries.filter(d => d.content.includes(contact.name)).length;
    return acc + mentions;
  }, 0);


  useEffect(() => {
    if (open && !suggestions) {
      setIsLoadingSuggestions(true);
      onGenerateInsights()
        .then(text => setSuggestions(text))
        .catch(err => console.error("Failed to generate insights", err))
        .finally(() => setIsLoadingSuggestions(false));
    }
  }, [open]);

  return (
    <>
      {/* Small pill-style card */}
      <Card title="Insights">
        <p className="text-xs text-slate-300 mb-3">
          Patterns and trends from your chats, diary and tasks.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          View insights
        </button>
      </Card>

      {/* Full-screen style CRM insights modal */}
      <Modal open={open} title="Assistant Insights" onClose={() => setOpen(false)}>
        {/* High level summary */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            High-Level Summary
          </h3>
          <p className="text-sm text-slate-200">
            You have logged {diaryEntries.length} diary entries and scheduled {meetings.length} meetings.
            Your assistant has performed {actionLog.length} actions.
          </p>
        </section>

        {/* Focus areas */}
        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Deep Work
              </div>
              <div className="text-sm font-semibold mb-1">
                Projects & Strategy
              </div>
              <p className="text-[11px] text-slate-300">
                {deepWorkCount} meetings scheduled.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Execution
              </div>
              <div className="text-sm font-semibold mb-1">
                Day-to-Day Actions
              </div>
              <p className="text-[11px] text-slate-300">
                {executionCount} actions executed.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Relationships
              </div>
              <div className="text-sm font-semibold mb-1">
                People & Communication
              </div>
              <p className="text-[11px] text-slate-300">
                {relationshipTouches} mentions of contacts.
              </p>
            </div>
          </div>
        </section>

        {/* Actionable items */}
        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            AI Suggested Follow-Ups
          </h3>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            {isLoadingSuggestions ? (
              <div className="text-xs text-slate-400 animate-pulse">Analyzing your data...</div>
            ) : suggestions ? (
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {suggestions}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No suggestions available.</div>
            )}
          </div>
        </section>

        {/* Real Metrics */}
        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Live Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-200">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">This week</div>
              <div className="text-lg font-semibold">{chatsThisWeek}</div>
              <div className="text-[11px] text-slate-400">
                Chat sessions
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">Open loops</div>
              <div className="text-lg font-semibold">{openLoopsCount}</div>
              <div className="text-[11px] text-slate-400">
                Pending items
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">Focus balance</div>
              <div className="text-lg font-semibold">{focusBalance}</div>
              <div className="text-[11px] text-slate-400">
                Deep / Exec Ratio
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">
                Relationship touches
              </div>
              <div className="text-lg font-semibold">{relationshipTouches}</div>
              <div className="text-[11px] text-slate-400">
                Contact mentions
              </div>
            </div>
          </div>
        </section>

        <div className="pt-3 border-t border-slate-800 flex justify-end mt-4">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
