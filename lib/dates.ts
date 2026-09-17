// Date utilities. All "month" values are 0-indexed (JS Date convention).
export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Build an ISO date string (YYYY-MM-DD) from a 0-indexed month and 1-indexed day. */
export function iso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function todayISO(): string {
  const t = new Date();
  return iso(t.getFullYear(), t.getMonth(), t.getDate());
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isFutureDate(dateStr: string): boolean {
  return dateStr > todayISO();
}

export function addDaysISO(dateStr: string, n: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + n);
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

export function fmtLong(dateStr: string): string {
  const d = parseISO(dateStr);
  return `${DOW_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
