"use client";

import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import DiaryPanel from './components/DiaryPanel';
import ChatPanel from './components/ChatPanel';
import TodayPanel from './components/TodayPanel';
import SettingsPanel from './components/SettingsPanel';
import InsightsPanel from './components/InsightsPanel';
import { ContactsPanel } from './components/ContactsPanel';
import { CommandPalette } from './components/CommandPalette';
import { MobileNav, MobileTab } from './components/MobileNav';
import { geminiService, sendMessage } from './services/geminiService';
import { useTextToSpeech } from './hooks/useTextToSpeech';
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
  ActionLogEntry,
  UserProfile,
  MemoryItem
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
  requireConfirmBeforeEmail: true,
  voiceInputEnabled: true,
  voiceOutputEnabled: false,
  integrations: [
    { id: 'gcal', type: 'google_calendar', name: 'Google Calendar', icon: '📅', enabled: false, description: 'Sync meetings and events.' },
    { id: 'gmail', type: 'gmail', name: 'Gmail', icon: '📧', enabled: false, description: 'Read and draft emails.' },
    { id: 'slack', type: 'slack', name: 'Slack', icon: '💬', enabled: false, description: 'Send messages to channels.' },
    { id: 'notion', type: 'notion', name: 'Notion', icon: '📝', enabled: false, description: 'Manage pages and databases.' },
    { id: 'linear', type: 'linear', name: 'Linear', icon: '⚡', enabled: false, description: 'Track issues and projects.' },
    { id: 'github', type: 'github', name: 'GitHub', icon: '🐙', enabled: false, description: 'View repositories and issues.' },
    { id: 'whatsapp', type: 'whatsapp', name: 'WhatsApp', icon: '📱', enabled: false, description: 'Send messages via API.' },
  ]
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

  // Memory System State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Martijn',
    bio: 'Founder & Entrepreneur',
    values: [],
    preferences: { communicationStyle: 'Direct', meetingTimes: 'Afternoons', workHours: '9-5' },
    topics: []
  });
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  // Command Palette State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandPreviewActions, setCommandPreviewActions] = useState<PlannerAction[] | null>(null);
  const [commandPreviewReply, setCommandPreviewReply] = useState<string | null>(null);
  const [isCommandProcessing, setIsCommandProcessing] = useState(false);
  const [lastCommandText, setLastCommandText] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chat');

  // Voice Output
  const { speak } = useTextToSpeech();

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
          const parsedSettings = JSON.parse(savedSettings);

          // Migration: Check if integrations is an array (new format). If not (old object format), use default.
          if (parsedSettings.integrations && !Array.isArray(parsedSettings.integrations)) {
            console.warn("Migrating legacy integrations settings...");
            parsedSettings.integrations = DEFAULT_SETTINGS.integrations;
          }

          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
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
    localStorage.setItem('mvb_profile', JSON.stringify(userProfile));
    localStorage.setItem('mvb_memories', JSON.stringify(memories));
  }, [diaryEntries, meetings, notifications, focusItems, mode, settings, chatMessages, contacts, actionLog, userProfile, memories, isInitialized]);

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
          const meetingStart = action.payload.startTime
            ? new Date(action.payload.startTime)
            : (action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000));

          const newMeeting: Meeting = {
            id: crypto.randomUUID(),
            title: action.payload.title || 'New Meeting',
            startTime: meetingStart,
            status: (action.payload.status as any) || 'confirmed',
            videoLink: action.payload.platform ? `https://mvb.digitalself.local/call/${crypto.randomUUID()}` : undefined
          };
          setMeetings(prev => [...prev, newMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
          break;

        case ActionType.SEND_EMAIL:
          const { recipient, to, contactName, channel, subject } = action.payload;
          const name = to || recipient || contactName || 'Unknown';
          const ch = channel || 'email';
          const sub = subject || 'no subject';

          let emailMsg = `📧 Email planned to ${name} via ${ch}. Subject: "${sub}" (simulation only).`;

          if (settings.requireConfirmBeforeEmail) {
            emailMsg = `⚠️ Draft Email created for ${name} (${ch}). Review required.`;
          }

          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: emailMsg,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.GENERATE_VIDEO_LINK:
          const link = `https://mvb.digitalself.local/call/${crypto.randomUUID()}`;
          const title = action.payload.title || 'Video Call';
          const vStart = action.payload.startTime
            ? new Date(action.payload.startTime)
            : (action.payload.time ? new Date(action.payload.time) : new Date(Date.now() + 3600000));

          // Create a new meeting for this link
          const videoMeeting: Meeting = {
            id: crypto.randomUUID(),
            title: title,
            startTime: vStart,
            status: 'pending',
            videoLink: link
          };

          setMeetings(prev => [...prev, videoMeeting].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));

          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: `🎥 Video link generated for "${title}"`,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.ADD_NOTIFICATION:
          const notifMsg = action.payload.message || 'New notification';
          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: notifMsg,
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.SET_FOCUS:
          if (action.payload.items && Array.isArray(action.payload.items)) {
            // Replace top items with new ones
            setFocusItems(prev => [...action.payload.items!, ...prev].slice(0, 3));
          } else if (action.payload.focusText) {
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

      // Enhanced Context with actual Data
      // We send a JSON object now, which the API route will format for the LLM.
      const richContext = {
        mode,
        date: new Date().toISOString(),
        goals: settings.goals || 'not specified',
        aiBehavior: settings.aiBehavior || 'calm, strategic, concise',
        focusItems: focusItems,
        recentDiary: diaryEntries.slice(0, 5).map(d => ({ type: d.type, title: d.title, content: d.content, date: d.createdAt })),
        todaysMeetings: meetings.filter(m => {
          const mDate = new Date(m.startTime);
          const today = new Date();
          return mDate.getDate() === today.getDate() && mDate.getMonth() === today.getMonth() && mDate.getFullYear() === today.getFullYear();
        }).map(m => ({ title: m.title, time: m.startTime, status: m.status })),
        recentContacts: contacts.slice(0, 10).map(c => ({ name: c.name, role: c.role, company: c.company })),
        actionLogCount: actionLog.length,
        userProfile: userProfile,
        memories: memories.slice(0, 20) // Inject last 20 memories for context
      };

      // We cast to any because the sendMessage signature expects string context, 
      // but we updated the API to handle object. 
      // Ideally we should update the type definition in geminiService.ts too.
      const response = await geminiService.sendMessage(text, richContext as any, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);

      setChatMessages(prev => [...prev, aiMsg]);

      // Voice Output Trigger
      if (settings.voiceOutputEnabled) {
        speak(response.text);
      }

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

  const handleUpdateContacts = (updated: Contact[]) => {
    setContacts(updated);
  };

  const handleSimulateMessageToContact = (contact: Contact) => {
    const message = `Simulated message to ${contact.name} via ${contact.primaryChannel}.`;
    setNotifications(prev => [
      {
        id: crypto.randomUUID(),
        message,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  // --- Command Palette Handlers ---
  const handleOpenCommandPalette = () => {
    setIsCommandOpen(true);
    setCommandPreviewActions(null);
    setCommandPreviewReply(null);
    setLastCommandText(null);
  };

  const handleCloseCommandPalette = () => {
    setIsCommandOpen(false);
    setCommandPreviewActions(null);
    setCommandPreviewReply(null);
    setLastCommandText(null);
    setIsCommandProcessing(false);
  };

  const handlePlanCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    setIsCommandProcessing(true);
    setCommandPreviewActions(null);
    setCommandPreviewReply(null);
    setLastCommandText(commandText);

    // Build context similar to handleSendMessage
    const contactListStr = contacts.map(c => `- ${c.name} (${c.primaryChannel})`).join('\n');
    const contextLines: string[] = [];

    contextLines.push(`You are Martijn's Digital Self. You are planning actions in response to a command.`);
    contextLines.push(`Current mode: ${mode}`);
    contextLines.push(`Goals: ${settings.goals || 'not specified'}`);
    contextLines.push(`AI Behavior: ${settings.aiBehavior || 'calm, strategic, concise'}`);
    contextLines.push(`Auto-create meetings: ${settings.autoCreateMeetings ? 'enabled' : 'disabled'}`);
    contextLines.push(`Require confirmation before email: ${settings.requireConfirmBeforeEmail ? 'yes' : 'no'}`);
    contextLines.push(`Known contacts: ${contacts.length}`);
    contextLines.push(contactListStr);
    contextLines.push(`Action log entries: ${actionLog.length}`);

    const context = contextLines.join('\n');

    const richContext = {
      mode,
      date: new Date().toISOString(),
      goals: settings.goals || 'not specified',
      aiBehavior: settings.aiBehavior || 'calm, strategic, concise',
      focusItems: focusItems,
      recentDiary: diaryEntries.slice(0, 5).map(d => ({ type: d.type, title: d.title, content: d.content, date: d.createdAt })),
      todaysMeetings: meetings.filter(m => {
        const mDate = new Date(m.startTime);
        const today = new Date();
        return mDate.getDate() === today.getDate() && mDate.getMonth() === today.getMonth() && mDate.getFullYear() === today.getFullYear();
      }).map(m => ({ title: m.title, time: m.startTime, status: m.status })),
      recentContacts: contacts.slice(0, 10).map(c => ({ name: c.name, role: c.role, company: c.company })),
      actionLogCount: actionLog.length,
      userProfile: userProfile,
      memories: memories.slice(0, 20)
    };

    try {
      // Prepend [COMMAND_MODE] to signal the AI to be a pure planner
      const response = await sendMessage(`[COMMAND_MODE] ${commandText}`, richContext as any, []);
      setCommandPreviewReply(response.text);
      setCommandPreviewActions(response.actions || []);
    } catch (error) {
      console.error(error);
      setCommandPreviewReply('Sorry, something went wrong while planning this command.');
      setCommandPreviewActions([]);
    } finally {
      setIsCommandProcessing(false);
    }
  };

  const handleExecutePlannedActions = () => {
    if (!commandPreviewActions || commandPreviewActions.length === 0) {
      handleCloseCommandPalette();
      return;
    }
    executePlannerActions(commandPreviewActions);

    // Add a notification that a command was executed
    setNotifications(prev => [
      {
        id: crypto.randomUUID(),
        message: `Executed command: ${lastCommandText || 'unnamed command'} (${commandPreviewActions.length} action(s))`,
        createdAt: new Date(),
      },
      ...prev,
    ]);
    handleCloseCommandPalette();
  };

  return (
    <AppShell
      currentMode={mode}
      onModeChange={handleModeChange}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onOpenInsights={() => setIsInsightsOpen(true)}
      onOpenContacts={() => setIsContactsOpen(true)}
      onOpenCommandPalette={handleOpenCommandPalette}
      activeMobileTab={activeMobileTab}
      onMobileTabChange={setActiveMobileTab}
    >

      {/* DESKTOP LAYOUT (Grid) */}
      <div className="hidden lg:contents">
        <section className="col-span-3 h-full min-h-0">
          <DiaryPanel
            entries={diaryEntries}
            onAddEntry={handleAddDiaryEntry}
            onDeleteEntry={handleDeleteDiaryEntry}
          />
        </section>

        <section className="col-span-6 h-full min-h-0">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            voiceInputEnabled={settings.voiceInputEnabled}
            voiceOutputEnabled={settings.voiceOutputEnabled}
            isProcessing={isProcessing}
          />
          {isProcessing && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-xs text-indigo-500 animate-pulse z-10">
              Processing...
            </div>
          )}
        </section>

        <section className="col-span-3 h-full min-h-0">
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
      </div>

      {/* MOBILE LAYOUT (Tabs) */}
      <div className="lg:hidden h-full flex flex-col min-h-0">
        {activeMobileTab === 'diary' && (
          <DiaryPanel
            entries={diaryEntries}
            onAddEntry={handleAddDiaryEntry}
            onDeleteEntry={handleDeleteDiaryEntry}
          />
        )}
        {activeMobileTab === 'chat' && (
          <div className="h-full relative">
            <ChatPanel
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              voiceInputEnabled={settings.voiceInputEnabled}
              voiceOutputEnabled={settings.voiceOutputEnabled}
              isProcessing={isProcessing}
            />
            {isProcessing && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-xs text-indigo-500 animate-pulse z-10">
                Processing...
              </div>
            )}
          </div>
        )}
        {activeMobileTab === 'today' && (
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
        )}
      </div>

      {/* MODALS */}
      {isSettingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onReset={handleResetData}
          onClearChat={handleClearChat}
          userProfile={userProfile}
          memories={memories}
          onUpdateProfile={setUserProfile}
          onDeleteMemory={(id) => setMemories(prev => prev.filter(m => m.id !== id))}
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

      {isContactsOpen && (
        <ContactsPanel
          contacts={contacts}
          onChange={handleUpdateContacts}
          onClose={() => setIsContactsOpen(false)}
          onSimulateMessage={handleSimulateMessageToContact}
        />
      )}

      {isCommandOpen && (
        <CommandPalette
          isOpen={isCommandOpen}
          isProcessing={isCommandProcessing}
          lastCommandText={lastCommandText}
          reply={commandPreviewReply}
          actions={commandPreviewActions || []}
          onPlanCommand={handlePlanCommand}
          onExecute={handleExecutePlannedActions}
          onClose={handleCloseCommandPalette}
        />
      )}

    </AppShell>
  );
};

export default App;