
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { DiaryPanel } from './components/DiaryPanel';
import { ChatPanel } from './components/ChatPanel';
import { TodayPanel } from './components/TodayPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { InsightsPanel } from './components/InsightsPanel';
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
  Settings,
  Contact,
  ActionLogEntry
} from './types';
import { 
  INITIAL_DIARY, 
  INITIAL_MEETINGS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_FOCUS,
  INITIAL_CONTACTS
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
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome back, Martijn. I'm ready to assist you.",
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
           setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }

        const savedChat = localStorage.getItem('mvb_chat');
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          setChatMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }

        const savedContacts = localStorage.getItem('mvb_contacts');
        if (savedContacts) {
          setContacts(JSON.parse(savedContacts));
        }

        const savedActionLog = localStorage.getItem('mvb_action_log');
        if (savedActionLog) {
          setActionLog(JSON.parse(savedActionLog));
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
    if (!isInitialized) return;
    localStorage.setItem('mvb_diary', JSON.stringify(diaryEntries));
    localStorage.setItem('mvb_meetings', JSON.stringify(meetings));
    localStorage.setItem('mvb_notifications', JSON.stringify(notifications));
    localStorage.setItem('mvb_focus', JSON.stringify(focusItems));
    localStorage.setItem('mvb_mode', mode);
    localStorage.setItem('mvb_settings', JSON.stringify(settings));
    localStorage.setItem('mvb_chat', JSON.stringify(chatMessages));
    localStorage.setItem('mvb_contacts', JSON.stringify(contacts));
    localStorage.setItem('mvb_action_log', JSON.stringify(actionLog));
  }, [diaryEntries, meetings, notifications, focusItems, mode, settings, chatMessages, contacts, actionLog, isInitialized]);

  // --- Action Executors ---
  const executePlannerActions = (actions: PlannerAction[]) => {
    actions.forEach(action => {
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
            console.log("Auto-create disabled, but action received.");
          }
          const newMeeting: Meeting = {
            id: Date.now().toString() + Math.random(),
            title: action.payload.title || 'New Meeting',
            startTime: action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000),
            status: 'confirmed',
            videoLink: action.payload.platform ? `https://mvb.digitalself.local/call/${crypto.randomUUID()}` : undefined
          };
          setMeetings(prev => [...prev, newMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
          break;

        case ActionType.SEND_EMAIL:
          const { recipient, contactName, channel, subject } = action.payload;
          const name = contactName || recipient || 'Unknown';
          const ch = channel || 'email';
          const sub = subject || 'no subject';
          
          let emailMsg = `📧 Email planned to ${name} via ${ch}. Subject: "${sub}" (simulation only).`;
          
          if (settings.requireConfirmBeforeEmail) {
            emailMsg = `⚠️ Draft Email created for ${name} (${ch}). Review required.`;
          }
          
          setNotifications(prev => [{
            id: Date.now().toString() + Math.random(),
            message: emailMsg,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.GENERATE_VIDEO_LINK:
          const link = `https://mvb.digitalself.local/call/${crypto.randomUUID()}`;
          const title = action.payload.title || 'Video Call';
          const startTime = action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000);
          
          // Create a new meeting for this link
          const videoMeeting: Meeting = {
            id: Date.now().toString() + Math.random(),
            title: title,
            startTime: startTime,
            status: 'pending',
            videoLink: link
          };
          
          setMeetings(prev => [...prev, videoMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
          
          setNotifications(prev => [{
            id: Date.now().toString() + Math.random(),
            message: `🎥 Video link generated for "${title}"`,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.ADD_NOTIFICATION:
           const notifMsg = action.payload.message || 'New notification';
           setNotifications(prev => [{
            id: Date.now().toString() + Math.random(),
            message: notifMsg,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.SET_FOCUS:
          if (action.payload.focusText) {
             setFocusItems(prev => [action.payload.focusText!, ...prev.slice(0, 2)]);
          }
          break;
      }
    });

    // Log actions to history
    if (actions.length > 0) {
      const logEntry: ActionLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        description: `Executed ${actions.length} action(s): ${actions.map(a => a.type).join(', ')}`,
        actions
      };
      setActionLog(prev => [logEntry, ...prev]);
    }
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

      const context = [
        `Current Mode: ${mode}`,
        `Current Date: ${new Date().toLocaleString()}`,
        `Goals: ${settings.goals || 'not specified'}`,
        `AI Behavior: ${settings.aiBehavior || 'calm, strategic, concise'}`,
        `Auto-create meetings: ${settings.autoCreateMeetings ? 'enabled' : 'disabled'}`,
        `Require confirmation before email: ${settings.requireConfirmBeforeEmail ? 'yes' : 'no'}`,
        `Known contacts: ${contacts.length}`,
        `Action log entries: ${actionLog.length}`
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

  const handleDeleteDiaryEntry = (id: string) => {
    if (window.confirm("Delete this diary entry?")) {
      setDiaryEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleUpdateMeetingStatus = (id: string, status: Meeting['status']) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };
  
  const handleDeleteMeeting = (id: string) => {
    if (window.confirm("Remove this meeting?")) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddFocusItem = (text: string) => {
    setFocusItems(prev => [text, ...prev]);
  };

  const handleDeleteFocusItem = (index: number) => {
     setFocusItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const handleClearChat = () => {
    setChatMessages([]);
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
      onOpenInsights={() => setIsInsightsOpen(true)}
    >
      
      {/* Left Column: Diary */}
      {/* Order 3 on mobile, 1 on desktop */}
      <section className="order-3 lg:order-1 col-span-12 lg:col-span-3 h-full min-h-0">
        <DiaryPanel 
          entries={diaryEntries} 
          onAddEntry={handleAddDiaryEntry} 
          onDeleteEntry={handleDeleteDiaryEntry}
        />
      </section>

      {/* Center Column: Chat */}
      {/* Order 1 on mobile, 2 on desktop */}
      <section className="order-1 lg:order-2 col-span-12 lg:col-span-6 h-full min-h-0">
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
      {/* Order 2 on mobile, 3 on desktop */}
      <section className="order-2 lg:order-3 col-span-12 lg:col-span-3 h-full min-h-0">
        <TodayPanel 
          meetings={meetings} 
          notifications={notifications}
          focusItems={focusItems}
          contacts={contacts}
          onUpdateMeetingStatus={handleUpdateMeetingStatus}
          onAddFocusItem={handleAddFocusItem}
          onDeleteMeeting={handleDeleteMeeting}
          onDismissNotification={handleDismissNotification}
          onDeleteFocusItem={handleDeleteFocusItem}
        />
      </section>

      {isSettingsOpen && (
        <SettingsPanel 
          settings={settings}
          onChange={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onReset={handleResetData}
          onClearChat={handleClearChat}
        />
      )}

      {isInsightsOpen && (
        <InsightsPanel 
          diaryEntries={diaryEntries}
          meetings={meetings}
          actionLog={actionLog}
          onClose={() => setIsInsightsOpen(false)}
        />
      )}

    </AppShell>
  );
};

export default App;
