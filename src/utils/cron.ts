// frontend/src/utils/cron.ts

export const DAYS_OF_WEEK = [
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
  { id: '0', label: 'Sunday' },
];

// Days 1 through 28 (excluding 29, 30, 31 to safely handle February and short months)
export const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  const suffix =
    day === 1 || day === 21
      ? 'st'
      : day === 2 || day === 22
      ? 'nd'
      : day === 3 || day === 23
      ? 'rd'
      : 'th';
  return { id: day.toString(), label: `Day ${day} (${day}${suffix})` };
});

export type ScheduleFrequency = 'weekly' | 'monthly';

export interface ParsedCron {
  frequency: ScheduleFrequency;
  time: string; // "HH:mm" in 24h format
  dayOfWeek: string;
  dayOfMonth: string;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Formats a 5-part cron expression into clear, professional English text.
 */
export function formatCronToHuman(cron: string | null | undefined): string {
  if (!cron) return 'Scheduled Pipeline Run';
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Scheduled Pipeline Run';

  const [minStr, hourStr, domStr, , dowStr] = parts;
  const hourNum = parseInt(hourStr, 10);
  const minNum = parseInt(minStr, 10);

  let timeFormatted = '9:00 AM';
  if (!isNaN(hourNum) && !isNaN(minNum)) {
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    const displayMin = minNum.toString().padStart(2, '0');
    timeFormatted = `${displayHour}:${displayMin} ${period}`;
  }

  // Monthly check (e.g. "0 9 15 * *")
  if (domStr !== '*' && domStr !== '') {
    const dayNum = parseInt(domStr, 10);
    const dayFormatted = !isNaN(dayNum) ? getOrdinal(dayNum) : domStr;
    return `Monthly on the ${dayFormatted} at ${timeFormatted}`;
  }

  // Weekly check (e.g. "0 9 * * 1")
  const dayMap: Record<string, string> = {
    '1': 'Mondays',
    '2': 'Tuesdays',
    '3': 'Wednesdays',
    '4': 'Thursdays',
    '5': 'Fridays',
    '6': 'Saturdays',
    '0': 'Sundays',
    '7': 'Sundays',
  };

  if (dowStr !== '*' && dowStr !== '') {
    const dayNames = dowStr
      .split(',')
      .map((d) => dayMap[d] || d)
      .join(', ');
    return `Weekly on ${dayNames} at ${timeFormatted}`;
  }

  return `Weekly on Mondays at ${timeFormatted}`;
}

/**
 * Computes a standard 5-part cron expression from UI selections.
 */
export function computeCronFromUserSelection(
  frequency: ScheduleFrequency,
  time: string,
  dayOfWeek: string = '1',
  dayOfMonth: string = '1'
): string {
  const [h, m] = (time || '09:00').split(':');
  const hourVal = parseInt(h, 10) || 0;
  const minVal = parseInt(m, 10) || 0;

  if (frequency === 'monthly') {
    const validDom = Math.min(Math.max(parseInt(dayOfMonth, 10) || 1, 1), 28);
    return `${minVal} ${hourVal} ${validDom} * *`;
  }

  // Default to weekly
  return `${minVal} ${hourVal} * * ${dayOfWeek || '1'}`;
}

/**
 * Parses an existing 5-part cron string into UI state components.
 */
export function parseCronToUserSelection(cron: string | null | undefined): ParsedCron {
  const defaultState: ParsedCron = {
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: '1',
    dayOfMonth: '1',
  };

  if (!cron) return defaultState;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaultState;

  const [minStr, hourStr, domStr, , dowStr] = parts;
  const hourNum = parseInt(hourStr, 10);
  const minNum = parseInt(minStr, 10);

  const formattedHour = isNaN(hourNum) ? '09' : hourNum.toString().padStart(2, '0');
  const formattedMin = isNaN(minNum) ? '00' : minNum.toString().padStart(2, '0');
  const time = `${formattedHour}:${formattedMin}`;

  if (domStr !== '*' && domStr !== '') {
    const validDom = Math.min(Math.max(parseInt(domStr, 10) || 1, 1), 28);
    return {
      frequency: 'monthly',
      time,
      dayOfWeek: '1',
      dayOfMonth: validDom.toString(),
    };
  }

  if (dowStr !== '*' && dowStr !== '') {
    const primaryDay = dowStr.split(',')[0] || '1';
    return {
      frequency: 'weekly',
      time,
      dayOfWeek: primaryDay,
      dayOfMonth: '1',
    };
  }

  return defaultState;
}
