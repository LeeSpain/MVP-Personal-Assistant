
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


