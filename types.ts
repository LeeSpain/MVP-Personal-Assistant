// Chat / roles
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

// Diary
export type DiaryType = 'Reflection' | 'Decision' | 'Idea';

export interface DiaryEntry {
  id: string;
  type: DiaryType;
  title: string;
  content: string;
  createdAt: Date;
}

// Meetings
export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  videoLink?: string; // New field
}

// Notifications
export interface Notification {
  id: string;
  message: string;
  createdAt: Date;
}

// Modes
export type Mode = 'Deep Work' | 'Execution' | 'Relationship' | 'Recovery';

// Planner action types
export enum ActionType {
  CREATE_DIARY = 'CREATE_DIARY',
  CREATE_MEETING = 'CREATE_MEETING',
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  SET_FOCUS = 'SET_FOCUS',
  SEND_EMAIL = 'SEND_EMAIL',
  GENERATE_VIDEO_LINK = 'GENERATE_VIDEO_LINK',
  MEMORIZE = 'MEMORIZE',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  SET_MODE = 'SET_MODE',
}

// Communication channels (for contacts + future APIs)
export type Channel = 'email' | 'whatsapp' | 'phone' | 'teams' | 'slack';

// CRM-style contact model
export interface Contact {
  id: string;
  name: string;

  // High-level context
  company?: string;
  role?: string;          // e.g. CEO, Partner, Supplier, Friend
  tags?: string[];        // e.g. ["VIP", "Investor", "Family"]

  // Preferred way to reach this person
  primaryChannel: Channel;

  // All available connectors (used later for API integrations)
  email?: string;
  phone?: string;         // regular phone
  whatsapp?: string;      // WhatsApp number / ID
  slack?: string;         // Slack handle / ID
  teams?: string;         // Teams ID / email

  // Generic address (for backwards compatibility, if you still use it)
  address?: string;

  // Free-form notes
  notes?: string;
}

// Payload used by planner actions
export interface ActionPayload {
  title?: string;
  content?: string;

  // Meeting fields
  time?: string; // Legacy
  startTime?: string;
  endTime?: string;
  description?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';

  attendees?: string[];
  message?: string;

  // Focus fields
  focusText?: string; // Legacy
  items?: string[];

  tag?: 'info' | 'alert' | 'success';
  diaryType?: DiaryType;

  // Email/Contact specific fields
  recipient?: string; // Legacy
  to?: string;
  contactName?: string;
  channel?: Channel;
  address?: string;
  subject?: string;
  body?: string;

  // For video / platform selection
  platform?: 'zoom' | 'meet' | 'teams';
  linkLabel?: string;

  memoryContent?: string;
  memoryType?: 'fact' | 'preference' | 'summary';
  memoryTags?: string[];

  // Profile update fields
  profileBio?: string;
  profileValues?: string[];
  profilePreferences?: {
    communicationStyle?: string;
    meetingTimes?: string;
    workHours?: string;
  };
  profileTopics?: string[];

  // Mode switching
  mode?: Mode;
}

// Planner action
export interface PlannerAction {
  id: string; // Unique ID for the action
  type: ActionType;
  payload: ActionPayload;
}

// Action log entries
export interface ActionLogEntry {
  id: string;
  timestamp: string; // ISO string
  description: string;
  actions: PlannerAction[];
}

// Settings Interface
export interface Settings {
  goals: string;
  aiBehavior: string;
  autoCreateMeetings: boolean;
  requireConfirmBeforeEmail: boolean;
  voiceInputEnabled: boolean;
  voiceOutputEnabled: boolean;

  // Integrations (New Robust System)
  integrations: IntegrationConfig[];
}

export type IntegrationType = 'google_calendar' | 'gmail' | 'slack' | 'notion' | 'linear' | 'github' | 'whatsapp' | 'custom';

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  icon?: string; // Emoji
  description?: string;

  // Configuration fields
  apiKey?: string;
  webhookUrl?: string;
  username?: string;
  url?: string; // For custom links
}

// Memory System
export interface UserProfile {
  name: string;
  bio: string;
  values: string[];
  preferences: {
    communicationStyle: string;
    meetingTimes: string;
    workHours: string;
  };
  topics: string[];
}

export interface MemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'preference' | 'summary';
  createdAt: string; // ISO string
  tags: string[];
}

// API DTOs
export interface ChatRequest {
  message: string;
  history: { role: Role; content: string }[];
  context?: any;
}

export interface ChatResponse {
  reply: string;
  actions: PlannerAction[];
  error?: string;
}
