// Work-week numbering, as used for schedules and tape-out plans in semiconductor companies.

export interface WorkWeek {
  /** The year the week belongs to (can differ from the calendar year near New Year). */
  year: number;
  week: number;
  /** ISO: 1 (Monday) .. 7 (Sunday). Sunday style: 0 (Sunday) .. 6 (Saturday). */
  day: number;
}

const DAY_MS = 86_400_000;

/** Days between two local dates, ignoring time of day and DST shifts. */
function dayDiff(a: Date, b: Date): number {
  return Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / DAY_MS);
}

/** ISO 8601: weeks start on Monday; week 1 is the week with the year's first Thursday. */
export function isoWeek(date: Date): WorkWeek {
  const day = date.getDay() === 0 ? 7 : date.getDay();
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 4 - day);
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  return { year: thursday.getFullYear(), week: Math.floor(dayDiff(thursday, jan1) / 7) + 1, day };
}

/** Sunday-start ("Intel style"): weeks start on Sunday; WW01 is the week that contains January 1. */
export function sundayWeek(date: Date): WorkWeek {
  const startOfWw01 = (year: number): Date => {
    const jan1 = new Date(year, 0, 1);
    return new Date(year, 0, 1 - jan1.getDay());
  };
  let year = date.getFullYear();
  if (dayDiff(date, startOfWw01(year + 1)) >= 0) year += 1; // late December can already be next year's WW01
  return { year, week: Math.floor(dayDiff(date, startOfWw01(year)) / 7) + 1, day: date.getDay() };
}

export type WorkWeekStyle = 'iso' | 'sunday';

export function workWeek(date: Date, style: WorkWeekStyle): WorkWeek {
  return style === 'sunday' ? sundayWeek(date) : isoWeek(date);
}
