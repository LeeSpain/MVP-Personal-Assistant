
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { DiaryPanel } from './components/DiaryPanel';
import { ChatPanel } from './components/ChatPanel';
import { TodayPanel } from './components/TodayPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { geminiService } from './services/geminiService';
import { 
  ChatMessage, 
  DiaryEntry, 
  DiaryType, 
  Meeting, 
  Notification, 
  Mode,
  PlannerAction,
  ActionType,
  Settings
} from './types';
import { 
  INITIAL_DIARY, 
  INITIAL_MEETINGS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_FOCUS
} from './constants';

const DEFAULT_SETTINGS: Settings = {
  goals: '',
  aiBehavior: '',
  autoCreateMeetings: false,
  requireConfirmBeforeEmail: true
};

const App: React.FC = () => {
  // --- Local State ---
  const [isInitialized, setIsInitialized] = useState(false);
  const [mode, setMode] = useState<Mode>('Execution');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(INITIAL_DIARY);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [focusItems, setFocusItems] = useState<string[]>(INITIAL_FOCUS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome back, Martijn. I'm ready to assist you in Execution mode.",
      timestamp: new Date()
    }
  ]);

  // --- Persistence: Load on Mount ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDiary = localStorage.getItem('mvb_diary');
        if (savedDiary) {
          const parsed = JSON.parse(savedDiary);
          setDiaryEntries(parsed.map((d: any) => ({ ...d, createdAt: new Date(d.createdAt) })));
        }

        const savedMeetings = localStorage.getItem('mvb_meetings');
        if (savedMeetings) {
          const parsed = JSON.parse(savedMeetings);
          setMeetings(parsed.map((m: any) => ({ ...m, startTime: new Date(m.startTime) })));
        }

        const savedNotifs = localStorage.getItem('mvb_notifications');
        if (savedNotifs) {
          const parsed = JSON.parse(savedNotifs);
          setNotifications(parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })));
        }

        const savedFocus = localStorage.getItem('mvb_focus');
        if (savedFocus) setFocusItems(JSON.parse(savedFocus));

        const savedMode = localStorage.getItem('mvb_mode');
        if (savedMode) setMode(savedMode as Mode);

        const savedSettings = localStorage.getItem('mvb_settings');
        if (savedSettings) {
           // Merge with DEFAULT_SETTINGS to ensure new keys are present if local storage is old
           setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }

        const savedChat = localStorage.getItem('mvb_chat');
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          setChatMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }

      } catch (e) {
        console.error("Failed to load state from localStorage", e);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  // --- Persistence: Save on Change ---
  useEffect(() => {
    if (!isInitialized) return; // Don't save default state over existing data before load
    localStorage.setItem('mvb_diary', JSON.stringify(diaryEntries));
    localStorage.setItem('mvb_meetings', JSON.stringify(meetings));
    localStorage.setItem('mvb_notifications', JSON.stringify(notifications));
    localStorage.setItem('mvb_focus', JSON.stringify(focusItems));
    localStorage.setItem('mvb_mode', mode);
    localStorage.setItem('mvb_settings', JSON.stringify(settings));
    localStorage.setItem('mvb_chat', JSON.stringify(chatMessages));
  }, [diaryEntries, meetings, notifications, focusItems, mode, settings, chatMessages, isInitialized]);

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
          if (!settings.autoCreateMeetings) {
            // In a real app we might ask for confirmation here
            console.log("Auto-create meetings is disabled in settings, but proceeding for demo.");
          }
          const newMeeting: Meeting = {
            id: Date.now().toString() + Math.random(),
            title: action.payload.title || 'New Meeting',
            startTime: action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000),
            status: 'confirmed'
          };
          setMeetings(prev => [...prev, newMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
          break;

        case ActionType.ADD_NOTIFICATION:
        case ActionType.SEND_EMAIL: 
        case ActionType.GENERATE_VIDEO_LINK:
          let notifMsg = action.payload.message || 'New notification';
          
          if (action.type === ActionType.SEND_EMAIL) {
            notifMsg = `📧 Email sent to ${action.payload.recipient}: ${action.payload.subject}`;
            if (settings.requireConfirmBeforeEmail) {
              notifMsg = `⚠️ Draft Email created for ${action.payload.recipient} (Review required)`;
            }
          } else if (action.type === ActionType.GENERATE_VIDEO_LINK) {
            notifMsg = `🎥 Video link generated (${action.payload.platform || 'meet'})`;
          }

          const newNotif: Notification = {
            id: Date.now().toString() + Math.random(),
            message: notifMsg,
            createdAt: new Date()
          };
          setNotifications(prev => [newNotif, ...prev]);
          break;

        case ActionType.SET_FOCUS:
          if (action.payload.focusText) {
             setFocusItems(prev => [action.payload.focusText!, ...prev.slice(0, 2)]);
          }
          break;
      }
    });
  };

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsProcessing(true);

    try {
      const history = updatedMessages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Inject Settings into Context
      const context = [
        `Current Mode: ${mode}`,
        `Current Date: ${new Date().toLocaleString()}`,
        `Primary Goals: ${settings.goals || "not specified"}`,
        `AI Behavior/Persona: ${settings.aiBehavior || "Strategic, calm, concise"}`,
        `Auto-create meetings: ${settings.autoCreateMeetings ? "enabled" : "disabled"}`,
        `Require confirm before email: ${settings.requireConfirmBeforeEmail ? "yes" : "no"}`
      ].join('\n');

      const response = await geminiService.sendMessage(text, context, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);

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

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AppShell 
      currentMode={mode} 
      onModeChange={handleModeChange}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      
      {/* Left Column: Diary (Hidden on mobile) */}
      <section className="hidden lg:block lg:col-span-3 h-full min-h-0">
        <DiaryPanel 
          entries={diaryEntries} 
          onAddEntry={handleAddDiaryEntry} 
        />
      </section>

      {/* Center Column: Chat (Full width mobile, center desktop) */}
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

      {/* Right Column: Today/Info (Always visible now) */}
      <section className="col-span-1 lg:col-span-3 h-full min-h-0">
        <TodayPanel 
          meetings={meetings} 
          notifications={notifications}
          focusItems={focusItems}
          onUpdateMeetingStatus={handleUpdateMeetingStatus}
        />
      </section>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsPanel 
          settings={settings}
          onChange={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onReset={handleResetData}
        />
      )}

    </AppShell>
  );
};

export default App;
