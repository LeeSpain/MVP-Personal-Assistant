"use client";

import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import DiaryPanel from './components/DiaryPanel';
import ChatPanel from './components/ChatPanel';
import TodayPanel from './components/TodayPanel';
import SettingsPanel from './components/SettingsPanel';
import InsightsPanel from './components/InsightsPanel';
import { ContactsPanel } from './components/ContactsPanel';
import CalendarPanel from './components/CalendarPanel';
import { CommandPalette } from './components/CommandPalette';
import ChatHistoryModal from './components/ChatHistoryModal';
import { MobileNav, MobileTab } from './components/MobileNav';
import SummaryModal from './components/SummaryModal';
import VoiceMode from './components/VoiceMode';
import { geminiService, sendMessage } from './services/geminiService';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useMemorySummarizer } from './hooks/useMemorySummarizer';
import { useMeetings } from './hooks/useMeetings';
import { useDiary } from './hooks/useDiary';
import { useChat } from './hooks/useChat';
import { useLanguage } from './contexts/LanguageContext';
import {
  ChatMessage,
  ChatSession,
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
    { id: 'gcal', type: 'google', name: 'Google Calendar', icon: '📅', enabled: false, description: 'Sync meetings and events.' },
    { id: 'gmail', type: 'gmail', name: 'Gmail', icon: '📧', enabled: false, description: 'Read and draft emails.' },
    { id: 'slack', type: 'slack', name: 'Slack', icon: '💬', enabled: false, description: 'Send messages to channels.' },
    { id: 'notion', type: 'notion', name: 'Notion', icon: '📝', enabled: false, description: 'Manage pages and databases.' },
    { id: 'linear', type: 'linear', name: 'Linear', icon: '⚡', enabled: false, description: 'Track issues and projects.' },
    { id: 'github', type: 'github', name: 'GitHub', icon: '🐙', enabled: false, description: 'View repositories and issues.' },
    { id: 'whatsapp', type: 'whatsapp', name: 'WhatsApp', icon: '📱', enabled: false, description: 'Send messages via API.' },
  ]
};

const App: React.FC = () => {
  const { language, t } = useLanguage();
  // --- Local State ---
  const [isInitialized, setIsInitialized] = useState(false);
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mvb_mode');
      return (saved as Mode) || 'Execution';
    }
    return 'Execution';
  });
  const { diaryEntries, addDiaryEntry, deleteDiaryEntry } = useDiary();
  const { meetings, addMeeting, updateMeetingStatus, deleteMeeting } = useMeetings();
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
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState(false);

  // Command Palette State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandPreviewActions, setCommandPreviewActions] = useState<PlannerAction[] | null>(null);
  const [commandPreviewReply, setCommandPreviewReply] = useState<string | null>(null);
  const [isCommandProcessing, setIsCommandProcessing] = useState(false);
  const [lastCommandText, setLastCommandText] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false); // Replaced by useChat

  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('chat');

  // Voice Output
  const { speak } = useTextToSpeech();

  // Memory Summarizer
  const { generateSummary, isSummarizing } = useMemorySummarizer();
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);

  // Undo System
  const [lastActionBatch, setLastActionBatch] = useState<{
    id: string;
    description: string;
    actions: PlannerAction[];
    previousState: {
      diary: DiaryEntry[];
      meetings: Meeting[];
      focus: string[];
      mode: Mode;
    };
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi, I'm your personal assistant. How can I help you today?",
      id: 'welcome-msg',
      timestamp: new Date().toISOString()
    },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  // --- Persistence: Load on Mount ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Diary is now handled by useDiary hook


        // Meetings are now handled by useMeetings hook


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

        // Chat History Logic
        const savedHistory = localStorage.getItem('mvb_chat_history');
        let loadedHistory: ChatSession[] = [];
        if (savedHistory) {
          loadedHistory = JSON.parse(savedHistory);
          setChatHistory(loadedHistory);
        }

        const savedChat = localStorage.getItem('mvb_chat');
        if (savedChat) {
          const parsedChat: ChatMessage[] = JSON.parse(savedChat);

          // Archive previous session if it has meaningful content (more than just welcome msg)
          if (parsedChat.length > 1) {
            const lastSession: ChatSession = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              messages: parsedChat,
              summary: parsedChat[1]?.content.substring(0, 50) + "..." // Simple summary from first user msg
            };

            // Prepend to history
            const newHistory = [lastSession, ...loadedHistory];
            setChatHistory(newHistory);
            localStorage.setItem('mvb_chat_history', JSON.stringify(newHistory));

            // Clear active chat (it's already reset by default state, so just don't load it)
            console.log("Archived previous session to history.");
          } else {
            // If it was empty/short, maybe we restore it? 
            // User requested "refresh = clear", so we should probably NOT restore it even if short,
            // unless we want to be nice. But strict request was "clear and start again".
            // So we do nothing, letting the default 'welcome' state take over.
          }
        }

        const savedContacts = localStorage.getItem('mvb_contacts');
        if (savedContacts) {
          setContacts(JSON.parse(savedContacts));
        }

        const savedActionLog = localStorage.getItem('mvb_action_log');
        if (savedActionLog) {
          setActionLog(JSON.parse(savedActionLog));
        }

        const savedSummary = localStorage.getItem('mvb_daily_summary');
        if (savedSummary) setDailySummary(savedSummary);

        const savedWeeklySummary = localStorage.getItem('mvb_weekly_summary');
        if (savedWeeklySummary) setWeeklySummary(savedWeeklySummary);

        const savedProfile = localStorage.getItem('mvb_profile');
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));

        const savedMemories = localStorage.getItem('mvb_memories');
        if (savedMemories) setMemories(JSON.parse(savedMemories));

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
    // Diary persisted to DB
    // Meetings persisted to DB
    localStorage.setItem('mvb_notifications', JSON.stringify(notifications));
    localStorage.setItem('mvb_focus', JSON.stringify(focusItems));
    localStorage.setItem('mvb_mode', mode);
    localStorage.setItem('mvb_settings', JSON.stringify(settings));
    localStorage.setItem('mvb_chat', JSON.stringify(chatMessages));
    localStorage.setItem('mvb_contacts', JSON.stringify(contacts));
    localStorage.setItem('mvb_action_log', JSON.stringify(actionLog));
    localStorage.setItem('mvb_profile', JSON.stringify(userProfile));
    localStorage.setItem('mvb_memories', JSON.stringify(memories));
    localStorage.setItem('mvb_chat_history', JSON.stringify(chatHistory));
    if (dailySummary) localStorage.setItem('mvb_daily_summary', dailySummary);
    if (weeklySummary) localStorage.setItem('mvb_weekly_summary', weeklySummary);
  }, [diaryEntries, meetings, notifications, focusItems, mode, settings, chatMessages, chatHistory, contacts, actionLog, userProfile, memories, dailySummary, weeklySummary, isInitialized]);

  // --- Action Executors ---
  const validateAction = (action: PlannerAction): boolean => {
    if (!action.type) return false;
    const { payload } = action;

    switch (action.type) {
      case ActionType.CREATE_DIARY:
        return !!(payload.content || payload.message);
      case ActionType.CREATE_MEETING:
        return !!payload.title;
      case ActionType.SEND_EMAIL:
        return !!(payload.recipient || payload.to || payload.contactName);
      case ActionType.SET_FOCUS:
        return !!(payload.items || payload.focusText);
      case ActionType.MEMORIZE:
        return !!(payload.memoryContent || payload.content);
      case ActionType.UPDATE_PROFILE:
        return !!(payload.profileBio || payload.profileValues || payload.profilePreferences || payload.profileTopics);
      default:
        return true; // Other actions might not have strict payload requirements
    }
  };

  const executePlannerActions = (actions: PlannerAction[]) => {
    // Snapshot current state for Undo
    const previousState = {
      diary: [...diaryEntries],
      meetings: [...meetings],
      focus: [...focusItems],
      mode: mode
    };

    let executedCount = 0;

    actions.forEach(action => {
      // 1. Strict Contract Enforcement
      if (!validateAction(action)) {
        console.warn(`Invalid action proposed: ${action.type}`, action);
        setNotifications(prev => [{
          id: crypto.randomUUID(),
          message: t('notifications.invalidAction', { type: action.type }),
          createdAt: new Date()
        }, ...prev]);
        return;
      }

      executedCount++;

      switch (action.type) {
        case ActionType.CREATE_DIARY:
          addDiaryEntry(
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

          addMeeting({
            title: action.payload.title || 'New Meeting',
            startTime: meetingStart,
            status: (action.payload.status as any) || 'confirmed',
            videoLink: action.payload.platform ? `https://mvb.digitalself.local/call/${crypto.randomUUID()}` : undefined
          });
          break;

        case ActionType.SEND_EMAIL:
          const { recipient, to, contactName, channel, subject } = action.payload;
          const name = to || recipient || contactName || 'Unknown';
          const ch = channel || 'email';
          const sub = subject || 'no subject';

          let emailMsg = t('notifications.emailPlanned', { name, channel: ch, subject: sub });

          if (settings.requireConfirmBeforeEmail) {
            emailMsg = t('notifications.emailDraft', { name, channel: ch });
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
          addMeeting({
            title: title,
            startTime: vStart,
            status: 'pending',
            videoLink: link
          });

          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: t('notifications.videoLink', { title }),
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

        case ActionType.MEMORIZE:
          const newMemory: MemoryItem = {
            id: crypto.randomUUID(),
            content: action.payload.memoryContent || action.payload.content || 'Untitled memory',
            type: action.payload.memoryType || 'fact',
            createdAt: new Date().toISOString(),
            tags: action.payload.memoryTags || []
          };
          setMemories(prev => [newMemory, ...prev]);

          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: t('notifications.memorized', { content: newMemory.content.substring(0, 30) }),
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.UPDATE_PROFILE:
          setUserProfile(prev => ({
            ...prev,
            bio: action.payload.profileBio || prev.bio,
            values: action.payload.profileValues || prev.values,
            topics: action.payload.profileTopics || prev.topics,
            preferences: {
              ...prev.preferences,
              ...(action.payload.profilePreferences || {})
            }
          }));
          setNotifications(prev => [{
            id: crypto.randomUUID(),
            message: t('notifications.profileUpdated'),
            createdAt: new Date()
          }, ...prev]);
          break;

        case ActionType.SET_MODE:
          if (action.payload.mode) {
            setMode(action.payload.mode);
            setNotifications(prev => [{
              id: crypto.randomUUID(),
              message: t('notifications.modeSwitched', { mode: action.payload.mode! }),
              createdAt: new Date()
            }, ...prev]);
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

      // Save for Undo
      setLastActionBatch({
        id: logEntry.id,
        description: `Executed ${executedCount} actions`,
        actions,
        previousState
      });
    }
  };

  const handleUndo = () => {
    if (!lastActionBatch) return;

    // Restore state
    // setDiaryEntries(lastActionBatch.previousState.diary); // TODO: Implement backend undo
    // setMeetings(lastActionBatch.previousState.meetings); // TODO: Implement backend undo
    setFocusItems(lastActionBatch.previousState.focus);
    setMode(lastActionBatch.previousState.mode);

    setNotifications(prev => [{
      id: crypto.randomUUID(),
      message: t('notifications.undid', { description: lastActionBatch.description }),
      createdAt: new Date()
    }, ...prev]);

    setLastActionBatch(null);
  };

  // --- Handlers ---
  const handleSendMessage = async (content: string) => {
    if (!content || !content.trim()) return;

    // 1. Show user message immediately
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatMessages,
            { role: 'user', content },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API /api/chat error:', data);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Internal error: ' + (data.detail || data.error || 'Unknown error'),
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || '(no reply from assistant)',
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        },
      ]);
    } catch (err) {
      console.error('handleSendMessage network error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Network error talking to the assistant. Please check your connection.',
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        },
      ]);
    }
  };

  const handleAddDiaryEntry = (type: DiaryType, title: string, content: string) => {
    addDiaryEntry(type, title, content);
  };

  const handleDeleteDiaryEntry = (id: string) => {
    if (window.confirm(t('confirmations.deleteDiary'))) {
      deleteDiaryEntry(id);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleUpdateMeetingStatus = (id: string, status: Meeting['status']) => {
    updateMeetingStatus(id, status);
  };

  const handleDeleteMeeting = (id: string) => {
    if (window.confirm(t('confirmations.deleteMeeting'))) {
      deleteMeeting(id);
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
    if (window.confirm(t('confirmations.resetData'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleUpdateContacts = (updated: Contact[]) => {
    setContacts(updated);
  };

  const handleSimulateMessageToContact = (contact: Contact) => {
    const message = t('notifications.simulatedMessage', { name: contact.name, channel: contact.primaryChannel });
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
      language,
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
        message: t('notifications.commandExecuted', { command: lastCommandText || 'unnamed command', count: commandPreviewActions.length }),
        createdAt: new Date(),
      },
      ...prev,
    ]);
    handleCloseCommandPalette();
  };

  const generateDailySummary = async () => {
    const summary = await generateSummary({
      diaryEntries,
      meetings,
      chatHistory: chatMessages,
      timeframe: 'day'
    });
    if (summary) {
      setDailySummary(summary);
    }
  };

  const handleGenerateDailySummary = async () => {
    setIsDailySummaryOpen(true);
    if (!dailySummary) {
      await generateDailySummary();
    }
  };

  const generateWeeklySummary = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentDiary = diaryEntries.filter(d => new Date(d.createdAt) > oneWeekAgo);
    const recentMeetings = meetings.filter(m => new Date(m.startTime) > oneWeekAgo);
    const recentChat = chatMessages.filter(c => new Date(c.timestamp) > oneWeekAgo);

    const summary = await generateSummary({
      diaryEntries: recentDiary,
      meetings: recentMeetings,
      chatHistory: recentChat,
      timeframe: 'week'
    });
    if (summary) {
      setWeeklySummary(summary);
    }
  };

  const handleGenerateWeeklySummary = async () => {
    setIsWeeklySummaryOpen(true);
    if (!weeklySummary) {
      await generateWeeklySummary();
    }
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
      onGenerateDailySummary={handleGenerateDailySummary}
      onGenerateWeeklySummary={handleGenerateWeeklySummary}
      isSummarizing={isSummarizing}
    >
      {/* Undo Toast */}
      {lastActionBatch && (
        <div className="fixed bottom-24 lg:bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-indigo-500/50 text-white text-sm py-2 px-4 rounded-full flex items-center gap-4 z-[60] shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <span className="text-indigo-200">{lastActionBatch.description}</span>
          <button
            onClick={handleUndo}
            className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {t('common.undo')}
          </button>
          <button
            onClick={() => setLastActionBatch(null)}
            className="text-slate-500 hover:text-white ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* DESKTOP & TABLET LAYOUT (Grid) */}
      <div className="hidden md:contents">
        {/* Diary - Hidden on Tablet, Visible on Desktop */}
        <section className="hidden lg:block lg:col-span-3 h-full min-h-0">
          <DiaryPanel
            entries={diaryEntries}
            onAddEntry={handleAddDiaryEntry}
            onDeleteEntry={handleDeleteDiaryEntry}
          />
        </section>

        {/* Chat - Takes half width on Tablet, center on Desktop */}
        <section className="col-span-1 md:col-span-1 lg:col-span-6 h-full min-h-0 relative">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            voiceInputEnabled={settings.voiceInputEnabled}
            voiceOutputEnabled={settings.voiceOutputEnabled}
            onToggleVoiceOutput={() => setSettings(prev => ({ ...prev, voiceOutputEnabled: !prev.voiceOutputEnabled }))}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
            isProcessing={isProcessing}
          />
          {isProcessing && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-xs text-indigo-500 animate-pulse z-10">
              {t('common.processing')}
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            {/* Summary buttons moved to Topbar */}
          </div>
        </section>

        {/* Tools - Right column on Tablet & Desktop */}
        <section className="col-span-1 md:col-span-1 lg:col-span-3 h-full min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
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
          </div>
          <div className="flex-1 min-h-0">
            <CalendarPanel
              meetings={meetings}
              onUpdateMeetingStatus={handleUpdateMeetingStatus}
              onDeleteMeeting={handleDeleteMeeting}
            />
          </div>
        </section>
      </div>

      {/* MOBILE LAYOUT (Tabs) - Visible only on small screens */}
      <div className="md:hidden h-full flex flex-col min-h-0">
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
              onToggleVoiceOutput={() => setSettings(prev => ({ ...prev, voiceOutputEnabled: !prev.voiceOutputEnabled }))}
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
        {activeMobileTab === 'calendar' && (
          <CalendarPanel
            meetings={meetings}
            onUpdateMeetingStatus={handleUpdateMeetingStatus}
            onDeleteMeeting={handleDeleteMeeting}
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
          chatMessages={chatMessages}
          contacts={contacts}
          onClose={() => setIsInsightsOpen(false)}
          onGenerateInsights={async () => {
            const prompt = `
               Analyze the user's recent activity and provide 3-5 actionable suggestions.
               Focus on:
               1. Tasks mentioned but not scheduled (Open Loops).
               2. Contacts not recently contacted (Relationship Touches).
               3. Imbalance between Deep Work and Execution.
               
               Data:
               - Recent Diary: ${JSON.stringify(diaryEntries.slice(0, 5))}
               - Meetings: ${JSON.stringify(meetings.slice(0, 5))}
               - Contacts: ${JSON.stringify(contacts.slice(0, 5))}
               - Focus Items: ${JSON.stringify(focusItems)}
             `;
            const response = await geminiService.sendMessage(prompt, { mode: 'Analyst' }, []);
            return response.text;
          }}
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


      {isHistoryOpen && (
        <ChatHistoryModal
          history={chatHistory}
          onClose={() => setIsHistoryOpen(false)}
          onDeleteSession={(id) => setChatHistory(prev => prev.filter(s => s.id !== id))}
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

      <SummaryModal
        open={isDailySummaryOpen}
        onClose={() => setIsDailySummaryOpen(false)}
        title="Daily Briefing"
        summary={dailySummary}
        isLoading={isSummarizing && isDailySummaryOpen}
        onRegenerate={generateDailySummary}
      />

      <SummaryModal
        open={isWeeklySummaryOpen}
        onClose={() => setIsWeeklySummaryOpen(false)}
        title="Weekly Review"
        summary={weeklySummary}
        isLoading={isSummarizing && isWeeklySummaryOpen}
        onRegenerate={generateWeeklySummary}
      />

      {/* Voice Mode Overlay */}
      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={handleSendMessage}
        messages={chatMessages}
        isProcessing={isProcessing}
      />
    </AppShell>
  );
};

export default App;