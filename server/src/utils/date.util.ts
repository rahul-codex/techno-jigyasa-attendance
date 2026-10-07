/**
 * Date utility for consistent application timezone handling (Asia/Kolkata).
 * Ensures server-side authority for all attendance dates.
 */

export const APPLICATION_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current date in YYYY-MM-DD format based on Asia/Kolkata timezone.
 */
export function getTodayDateString(timeZone: string = APPLICATION_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Returns a normalized midnight Date object for today in Asia/Kolkata timezone.
 * Used for storing and querying PostgreSQL @db.Date columns safely.
 */
export function getTodayDate(timeZone: string = APPLICATION_TIMEZONE): Date {
  const dateStr = getTodayDateString(timeZone);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Returns ISO string formatted timestamp.
 */
export function getCurrentServerTimestamp(): string {
  return new Date().toISOString();
}
