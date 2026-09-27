import { EventItem, FilterTimeScope } from '@/types';

/**
 * Checks if two dates are on the same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Determines whether a date is "today"
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Determines whether a date is "tomorrow"
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

/**
 * Determines whether a date falls into the upcoming weekend (Friday 16:00 through Sunday 23:59)
 */
export function isThisWeekend(date: Date): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

  // Calculate upcoming Friday
  const friday = new Date(now);
  const diffToFriday = (5 - currentDay + 7) % 7;
  friday.setDate(now.getDate() + diffToFriday);
  friday.setHours(12, 0, 0, 0);

  // Sunday of that weekend
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  // If today is Sunday, include the rest of today
  if (currentDay === 0) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    return date >= startOfToday && date <= endOfToday;
  }

  return date >= friday && date <= sunday;
}

/**
 * Checks if the event has ended or started in the past (more than 3 hours ago)
 */
export function isPastEvent(event: EventItem): boolean {
  const now = new Date();
  if (event.end_time) {
    return new Date(event.end_time) < now;
  }
  // If no end_time, consider past if start_time was more than 4 hours ago
  const startTime = new Date(event.start_time);
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return startTime < fourHoursAgo;
}

/**
 * Filter events by time scope
 */
export function filterEventsByScope(events: EventItem[], scope: FilterTimeScope): EventItem[] {
  if (scope === 'all') return events;

  return events.filter((e) => {
    const d = new Date(e.start_time);
    switch (scope) {
      case 'today':
        return isToday(d);
      case 'tomorrow':
        return isTomorrow(d);
      case 'weekend':
        return isThisWeekend(d);
      case 'upcoming':
        return !isToday(d) && !isTomorrow(d) && d > new Date();
      default:
        return true;
    }
  });
}

/**
 * Formats date and time in German readable format
 * e.g., "Heute, 19:30 Uhr" or "Sa., 4. Okt. • 15:00 Uhr"
 */
export function formatEventDateTime(startTimeStr: string, endTimeStr?: string | null): string {
  const start = new Date(startTimeStr);
  const timeFormatter = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const startTimeFormatted = timeFormatter.format(start);

  let prefix = '';
  if (isToday(start)) {
    prefix = 'Heute';
  } else if (isTomorrow(start)) {
    prefix = 'Morgen';
  } else {
    const dateFormatter = new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    prefix = dateFormatter.format(start);
  }

  if (endTimeStr) {
    const end = new Date(endTimeStr);
    const endTimeFormatted = timeFormatter.format(end);
    return `${prefix}, ${startTimeFormatted} – ${endTimeFormatted} Uhr`;
  }

  return `${prefix}, ${startTimeFormatted} Uhr`;
}

/**
 * Formats relative date badge (e.g. "HEUTE", "MORGEN", "IN 3 TAGEN")
 */
export function getRelativeBadge(startTimeStr: string): { label: string; color: string } {
  const start = new Date(startTimeStr);
  const now = new Date();

  if (isToday(start)) {
    return { label: 'Heute', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  if (isTomorrow(start)) {
    return { label: 'Morgen', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  }
  if (isThisWeekend(start)) {
    return { label: 'Wochenende', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  }

  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 7) {
    return { label: `In ${diffDays} Tagen`, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
  }

  const dateFormatter = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
  return { label: dateFormatter.format(start), color: 'bg-slate-700/40 text-slate-300 border-slate-700' };
}

export interface GroupedEvents {
  today: EventItem[];
  tomorrow: EventItem[];
  thisWeekend: EventItem[];
  later: EventItem[];
}

/**
 * Groups active events into time buckets for the agenda view
 */
export function groupEvents(events: EventItem[]): GroupedEvents {
  const grouped: GroupedEvents = {
    today: [],
    tomorrow: [],
    thisWeekend: [],
    later: [],
  };

  // Sort chronologically
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  sorted.forEach((event) => {
    const d = new Date(event.start_time);
    if (isToday(d)) {
      grouped.today.push(event);
    } else if (isTomorrow(d)) {
      grouped.tomorrow.push(event);
    } else if (isThisWeekend(d)) {
      grouped.thisWeekend.push(event);
    } else {
      grouped.later.push(event);
    }
  });

  return grouped;
}
