// Journal dates are stored as plain "YYYY-MM-DD" keys with no time zone.
// These helpers always read and write them in the reader's local time,
// so "today" and the date shown on screen match the calendar on the wall.

/** Turns a Date into a "YYYY-MM-DD" key using the local calendar day. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's "YYYY-MM-DD" key in local time. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Turns a "YYYY-MM-DD" key into a Date at local midnight on that day. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
