export const CATEGORY_CODES = ["OPEN", "JUNIOR", "MASTERS_40", "MASTERS_50"] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  OPEN: "Open",
  JUNIOR: "Junior",
  MASTERS_40: "Masters 40+",
  MASTERS_50: "Masters 50+",
};

export function ageOn(birthDate: Date, asOf: Date): number {
  let age = asOf.getUTCFullYear() - birthDate.getUTCFullYear();
  const month = asOf.getUTCMonth() - birthDate.getUTCMonth();
  if (month < 0 || (month === 0 && asOf.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Age bands are exclusive: 50+ is not also 40+, and Junior is not Open. */
export function categoryForAge(age: number): CategoryCode {
  if (!Number.isInteger(age)) {
    throw new Error("age must be an integer");
  }
  if (age <= 18) return "JUNIOR";
  if (age >= 50) return "MASTERS_50";
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
