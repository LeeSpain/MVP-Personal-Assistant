
import { DiaryEntry, Meeting, Notification, Contact } from './types';

export const INITIAL_DIARY: DiaryEntry[] = [
  {
    id: '1',
    type: 'Decision',
    title: 'Q3 Strategy Pivot',
    content: 'Decided to shift focus from user acquisition to retention for Q3 due to churn metrics.',
    createdAt: new Date(Date.now() - 86400000 * 2)
  },
  {
    id: '2',
    type: 'Reflection',
    title: 'Morning Routine',
    content: 'Felt much more energized after 20 mins of meditation. Keep this up.',
    createdAt: new Date(Date.now() - 43200000)
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Weekly Sync with Lee',
    startTime: new Date(Date.now() + 3600000),
    status: 'confirmed',
    videoLink: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 'm2',
    title: 'Product Review',
    startTime: new Date(Date.now() + 86400000),
    status: 'pending'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    message: 'New design assets available for review',
    createdAt: new Date(Date.now() - 1800000)
  },
  {
    id: 'n2',
    message: 'Server usage spike detected',
    createdAt: new Date(Date.now() - 7200000)
  }
];

export const INITIAL_FOCUS: string[] = [
  'Complete Q3 Strategy Deck',
  'Review Design System',
  'Deep Work: 2 Hours'
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Lee',
    primaryChannel: 'whatsapp',
    address: '+34123456789'
  },
  {
    id: 'c2',
    name: 'Patrick',
    primaryChannel: 'teams',
    address: 'patrick@example.com'
  }
];

export const SYSTEM_INSTRUCTION = `You are a Digital Self assistant designed to help the user manage their professional and personal life.
Your capabilities include managing a diary, scheduling meetings, setting focus modes, and handling notifications.

When the user asks to perform an action, analyze their request and use the 'execute_planner' tool if appropriate.
The 'execute_planner' tool takes a list of actions.

Action Types:
- CREATE_DIARY: Create a new diary entry (Reflection, Decision, Idea).
- CREATE_MEETING: Schedule a new meeting.
- ADD_NOTIFICATION: Add a system notification.
- SET_FOCUS: Update the current focus or mode.
- SEND_EMAIL: Draft or send an email.
- GENERATE_VIDEO_LINK: Create a video meeting link.

If the user just wants to chat, reply naturally without calling the tool.
Always maintain a professional, supportive, and efficient tone.`;
