/** Founding Season divisions: Open and Masters 40+, men's and women's. */
export const CATEGORY_CODES = ["OPEN", "MASTERS_40"] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

/**
 * Labels for every code the database enum still holds. JUNIOR and MASTERS_50
 * are retired for the Founding Season; they stay in the enum only so older rows
 * keep reading.
 */
export const CATEGORY_LABEL: Record<string, string> = {
  OPEN: "Open",
  MASTERS_40: "Masters 40+",
  JUNIOR: "Junior (retired)",
  MASTERS_50: "Masters 50+ (retired)",
};

export function ageOn(birthDate: Date, asOf: Date): number {
  let age = asOf.getUTCFullYear() - birthDate.getUTCFullYear();
  const month = asOf.getUTCMonth() - birthDate.getUTCMonth();
  if (month < 0 || (month === 0 && asOf.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Two age bands: 40 and over is Masters 40+, everyone else is Open. */
export function categoryForAge(age: number): CategoryCode {
  if (!Number.isInteger(age)) {
    throw new Error("age must be an integer");
  }
  if (age >= 40) return "MASTERS_40";
  return "OPEN";
}

export function categoryFor(birthDate: Date, asOf: Date): CategoryCode {
  return categoryForAge(ageOn(birthDate, asOf));
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
