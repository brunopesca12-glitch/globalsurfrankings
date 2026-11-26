export type FootageFacts = {
  dates: string[];
  device: string | null;
  lat: number | null;
  lng: number | null;
};

export type FootageDecision =
  | { outcome: "inside"; capturedOn: string }
  | { outcome: "outside"; capturedOn: string }
  | { outcome: "missing" };

const DATE_VALUE = /(\d{4})-(\d{2})-(\d{2})/;

function clean(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/** Read creation dates, device, and GPS from an ffmpeg probe log. */
export function parseFootageProbe(text: string): FootageFacts {
  const dates: string[] = [];
  let device: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = clean(line.slice(split + 1));
    if (!value) continue;

    if (key === "creation_time" || key.endsWith("creationdate") || key.endsWith("creation_time")) {
      const match = DATE_VALUE.exec(value);
      if (match) dates.push(`${match[1]}-${match[2]}-${match[3]}`);
    }

    if (
      device == null &&
      (key.endsWith("model") || key.endsWith("make") || key === "com.apple.quicktime.model" || key === "model")
    ) {
      if (!/encoder|lavf|ffmpeg/i.test(value) && value.length <= 80) device = value;
    }

    if (lat == null && (key.includes("location") || key.endsWith("iso6709"))) {
      const geo = /([+-]\d{2,3}(?:\.\d+)?)([+-]\d{2,3}(?:\.\d+)?)/.exec(value);
      if (geo) {
        const latitude = Number(geo[1]);
        const longitude = Number(geo[2]);
        if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
          lat = latitude;
          lng = longitude;
        }
      }
    }
  }

  return { dates: [...new Set(dates)].sort(), device, lat, lng };
}

/**
 * A file dated outside the season is refused. A file with no date is accepted
 * and flagged for the desk. If any embedded date falls outside, the file is out.
 */
export function decideFootage(
  facts: Pick<FootageFacts, "dates">,
  season: { startsOn: string; endsOn: string },
): FootageDecision {
  if (facts.dates.length === 0) return { outcome: "missing" };
  const outside = facts.dates.find((day) => day < season.startsOn || day > season.endsOn);
  if (outside) return { outcome: "outside", capturedOn: outside };
  return { outcome: "inside", capturedOn: facts.dates[0]! };
}

export const OUTSIDE_SEASON_MESSAGE =
  "This footage is dated outside the current season. Reposting an old wave is not allowed.";

export const MISSING_METADATA_NOTE =
  "The file had no capture date. The desk will check that it belongs to this season.";
