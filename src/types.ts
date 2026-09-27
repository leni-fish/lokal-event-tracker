export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  start_time: string; // ISO string
  end_time?: string | null; // ISO string
  location?: string | null;
  category: string;
  is_free: boolean;
  price_note?: string | null;
  source_url?: string | null;
  recurrence: RecurrenceType;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

export type FilterTimeScope = 'all' | 'today' | 'tomorrow' | 'weekend' | 'upcoming';

export const EVENT_CATEGORIES = [
  'Allgemein',
  'Musik & Konzerte',
  'Kultur & Theater',
  'Nightlife & Party',
  'Food & Drinks',
  'Markt & Flohmarkt',
  'Sport & Fitness',
  'Familie & Kinder',
  'Workshop & Bildung',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
