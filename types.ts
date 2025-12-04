
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export type DiaryType = 'Reflection' | 'Decision' | 'Idea';

export interface DiaryEntry {
  id: string;
  type: DiaryType;
  title: string;
  content: string;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  videoLink?: string; // New field
}

export interface Notification {
  id: string;
  message: string;
  createdAt: Date;
}

export type Mode = 'Deep Work' | 'Execution' | 'Relationship' | 'Recovery';

export enum ActionType {
  CREATE_DIARY = 'CREATE_DIARY',
  CREATE_MEETING = 'CREATE_MEETING',
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  SET_FOCUS = 'SET_FOCUS',
  SEND_EMAIL = 'SEND_EMAIL',
  GENERATE_VIDEO_LINK = 'GENERATE_VIDEO_LINK'
}

export type Channel = 'email' | 'whatsapp' | 'teams' | 'slack';

export interface Contact {
  id: string;
  name: string;
  primaryChannel: Channel;
  address: string;
}

export interface ActionPayload {
  title?: string;
  content?: string;
  time?: string; // Used as startTime
  attendees?: string[];
  message?: string;
  focusText?: string;
  tag?: 'info' | 'alert' | 'success';
  diaryType?: DiaryType;
  
  // Email/Contact specific fields
  recipient?: string;
  contactName?: string;
  channel?: Channel;
  address?: string;
  subject?: string;
  body?: string;
  
  platform?: 'zoom' | 'meet' | 'teams';
}

export interface PlannerAction {
  type: ActionType;
  payload: ActionPayload;
}

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
}

// API DTOs
export interface ChatRequest {
  message: string;
  history: { role: Role; content: string }[];
  context?: string;
}

export interface ChatResponse {
  reply: string;
  actions: PlannerAction[];
  error?: string;
}
