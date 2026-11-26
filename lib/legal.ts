/** Bump this when the published Terms of Use change in a way that needs a new acceptance. */
export const TERMS_VERSION = "2026-11-26";

export const TERMS_REQUIRED = "Tick the box to agree to the Terms of Use.";

export function termsBoxChecked(value: FormDataEntryValue | string | null | undefined): boolean {
  return value === "on" || value === "yes" || value === "true";
}

export function termsStamp(now = new Date()): { termsAcceptedAt: Date; termsVersion: string } {
  return { termsAcceptedAt: now, termsVersion: TERMS_VERSION };
}
