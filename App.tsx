import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { DiaryPanel } from './components/DiaryPanel';
import { ChatPanel } from './components/ChatPanel';
import { TodayPanel } from './components/TodayPanel';
import { geminiService } from './services/geminiService';
import { 
  ChatMessage, 
  DiaryEntry, 
  DiaryType, 
  Meeting, 
  Notification, 
  Mode,
  PlannerAction,
  ActionType
} from './types';
import { 
  INITIAL_DIARY, 
  INITIAL_MEETINGS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_FOCUS
} from './constants';

const App: React.FC = () => {
  // --- Local State ---
  const [mode, setMode] = useState<Mode>('Execution');
  
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(INITIAL_DIARY);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [focusItems, setFocusItems] = useState<string[]>(INITIAL_FOCUS);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome back, Martijn. I'm ready to assist you in Execution mode.",
      timestamp: new Date()
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Action Executors ---

  const executePlannerActions = (actions: PlannerAction[]) => {
    actions.forEach(action => {
      console.log("Executing Action:", action);
      
      switch (action.type) {
        case ActionType.CREATE_DIARY:
          handleAddDiaryEntry(
            action.payload.diaryType || 'Reflection', 
            action.payload.title || 'New Entry',
            action.payload.content || action.payload.message || ''
          );
          break;

        case ActionType.CREATE_MEETING:
          const newMeeting: Meeting = {
            id: Date.now().toString() + Math.random(),
            title: action.payload.title || 'New Meeting',
            startTime: action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000),
            status: 'confirmed'
          };
          setMeetings(prev => [...prev, newMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
          break;

        case ActionType.ADD_NOTIFICATION:
        case ActionType.SEND_EMAIL: // Simulate email by adding a notification
        case ActionType.GENERATE_VIDEO_LINK: // Simulate video link by adding a notification
          const notifMsg = action.type === ActionType.SEND_EMAIL 
            ? `📧 Email sent to ${action.payload.recipient}: ${action.payload.subject}`
            : action.type === ActionType.GENERATE_VIDEO_LINK
            ? `🎥 Video link generated (${action.payload.platform || 'meet'})`
            : action.payload.message || 'New notification';

          const newNotif: Notification = {
            id: Date.now().toString() + Math.random(),
            message: notifMsg,
            createdAt: new Date()
          };
          setNotifications(prev => [newNotif, ...prev]);
          break;

        case ActionType.SET_FOCUS:
          if (action.payload.focusText) {
             // If it's a single string update, replace the first item or add to top
             setFocusItems(prev => [action.payload.focusText!, ...prev.slice(0, 2)]);
          }
          break;
      }
    });
  };

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    // Optimistic update
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsProcessing(true);

    try {
      // 2. Build Context & History
      // We pass the last few messages for conversation continuity
      const history = updatedMessages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const context = `Current Mode: ${mode}\nCurrent Date: ${new Date().toLocaleString()}`;

      // 3. Call AI Service (which calls API Route)
      const response = await geminiService.sendMessage(text, context, history);

      // 4. Add AI Message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);

      // 5. Execute Actions
      if (response.actions && response.actions.length > 0) {
        executePlannerActions(response.actions);
      }

    } catch (error) {
      console.error("Error in chat loop:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my brain right now.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDiaryEntry = (type: DiaryType, title: string, content: string) => {
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      type,
      title,
      content,
      createdAt: new Date()
    };
    setDiaryEntries(prev => [newEntry, ...prev]);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Switched context to: ${newMode}.`,
      timestamp: new Date()
    }]);
  };

  const handleUpdateMeetingStatus = (id: string, status: Meeting['status']) => {
    setMeetings(prev => prev.map(m => 
      m.id === id ? { ...m, status } : m
    ));
  };

  return (
    <AppShell currentMode={mode} onModeChange={handleModeChange}>
      
      {/* Left Column: Diary */}
      <section className="hidden lg:block lg:col-span-3 h-full min-h-0">
        <DiaryPanel 
          entries={diaryEntries} 
          onAddEntry={handleAddDiaryEntry} 
        />
      </section>

      {/* Center Column: Chat */}
      <section className="col-span-1 lg:col-span-6 h-full min-h-0">
        <ChatPanel 
          messages={chatMessages} 
          onSendMessage={handleSendMessage}
        />
        {isProcessing && (
           <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-xs text-indigo-500 animate-pulse z-10">
             Processing...
           </div>
        )}
      </section>

      {/* Right Column: Today/Info */}
      <section className="hidden lg:block lg:col-span-3 h-full min-h-0">
        <TodayPanel 
          meetings={meetings} 
          notifications={notifications}
          focusItems={focusItems}
          onUpdateMeetingStatus={handleUpdateMeetingStatus}
        />
      </section>

    </AppShell>
  );
};

export default App;