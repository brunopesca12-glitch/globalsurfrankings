/** ISO-8601 week (Monday-based, week 1 contains the year's first Thursday). */
export function isoWeek(date: Date): { isoYear: number; isoWeek: number } {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { isoYear, isoWeek: week };
}

export function isoWeekKey(date: Date): string {
  const week = isoWeek(date);
  return `${week.isoYear}-W${String(week.isoWeek).padStart(2, "0")}`;
}
