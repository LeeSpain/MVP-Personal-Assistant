
import React, { useState } from 'react';
import { DiaryEntry, Meeting, ActionLogEntry } from '../types';
import { sendMessage } from '../services/geminiService';

interface InsightsPanelProps {
  diaryEntries: DiaryEntry[];
  meetings: Meeting[];
  actionLog: ActionLogEntry[];
  onClose: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ diaryEntries, meetings, actionLog, onClose }) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLogDetails = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const sortedMeetings = [...meetings]
    .filter(m => m.status !== 'cancelled' && m.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  const recentDiary = [...diaryEntries]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const recentLogs = [...actionLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      // 1. Build Context
      const contextLines: string[] = [];
      contextLines.push("You are my Digital Self. You are answering questions only about my memory: diary entries, meetings, and action log. Do NOT invent data.");

      contextLines.push("\nRecent diary entries:");
      recentDiary.forEach(d => {
        contextLines.push(`- [${d.createdAt.toISOString().split('T')[0]}] (${d.type}) ${d.content.substring(0, 100)}...`);
      });

      contextLines.push("\nUpcoming meetings:");
      sortedMeetings.forEach(m => {
        contextLines.push(`- [${m.startTime.toLocaleString()}] ${m.title} (status: ${m.status}, video: ${m.videoLink ? 'yes' : 'no'})`);
      });

      contextLines.push("\nRecent actions:");
      recentLogs.slice(0, 5).forEach(l => {
        contextLines.push(`- [${new Date(l.timestamp).toLocaleString()}] ${l.description}`);
      });

      const context = contextLines.join("\n");

      // 2. Call Service
      const response = await sendMessage(question, context, []);
      setAnswer(response.text);

    } catch (err) {
      console.error(err);
      setError("Failed to get an answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-800">Memory & Insights</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          
          {/* 1. Recent Diary Entries */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Recent Diary Entries
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentDiary.length === 0 ? (
                <div className="col-span-full p-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm text-center">
                  No diary entries found.
                </div>
              ) : (
                recentDiary.map(entry => (
                  <div key={entry.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        entry.type === 'Decision' ? 'bg-emerald-100 text-emerald-700' :
                        entry.type === 'Idea' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {entry.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-800 text-sm mb-1 line-clamp-1" title={entry.title}>{entry.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{entry.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 2. Upcoming Meetings */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Upcoming Meetings
            </h3>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {sortedMeetings.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">No upcoming meetings scheduled.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sortedMeetings.map(m => (
                    <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-700 rounded-md">
                          <span className="text-[9px] font-bold uppercase">{m.startTime.toLocaleString('en-US', { weekday: 'short' })}</span>
                          <span className="text-xs font-bold">{m.startTime.getDate()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{m.title}</div>
                          <div className="text-xs text-slate-500">
                            {m.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {m.status}
                          </div>
                        </div>
                      </div>
                      {m.videoLink && (
                        <a 
                          href={m.videoLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. Action Log */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Recent AI Actions
            </h3>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No actions recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLogs.map(log => (
                    <div key={log.id} className="group">
                      <div 
                        className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                        onClick={() => toggleLogDetails(log.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-400 font-mono w-16">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm text-slate-700">{log.description}</div>
                        </div>
                        <div className="text-slate-400 group-hover:text-slate-600">
                           {expandedLogId === log.id ? (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                               <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                             </svg>
                           ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                               <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                             </svg>
                           )}
                        </div>
                      </div>
                      
                      {expandedLogId === log.id && (
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs font-mono text-slate-600">
                           <pre className="whitespace-pre-wrap overflow-x-auto">
                             {JSON.stringify(log.actions, null, 2)}
                           </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Interactive Q&A */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
              Ask about your memory
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <form onSubmit={handleAsk} className="relative">
                 <textarea
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
                   placeholder="e.g. 'What was the last decision I made?' or 'Summarize my meetings for this week'"
                   className="w-full text-sm p-3 pr-16 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[60px] resize-none"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleAsk(e);
                     }
                   }}
                 />
                 <button
                   type="submit"
                   disabled={isLoading || !question.trim()}
                   className="absolute bottom-3 right-3 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {isLoading ? 'Thinking...' : 'Ask'}
                 </button>
              </form>
              
              {error && (
                <div className="mt-2 text-xs text-red-500 font-medium">
                  {error}
                </div>
              )}
            </div>

            {/* Answer Display */}
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">AI Insight</h4>
              {answer ? (
                <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-300">
                  {answer}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic px-2">
                  Ask a question above to see an AI insight based on your memory.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
