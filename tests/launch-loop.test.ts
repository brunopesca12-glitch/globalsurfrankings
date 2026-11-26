import { describe, expect, it } from "vitest";
import { GUEST_DUELS, isCalibrationSlot, keyFromVotes } from "@/lib/calibration";
import { dailyStreak, eyeBadges, eyeLevel, eyeScore, weeklyStreak } from "@/lib/eye";
import { FILE_ONLY_MESSAGE, isSocialLink, rejectsPastedLink } from "@/lib/file-only";
import { decideFootage, parseFootageProbe } from "@/lib/footage";
import { VERDICT_FROM, sendVerdictEmail, verdictLetter } from "@/lib/mailer";
import { cronAuthorized, isSaoPauloMonday } from "@/lib/monday";
import { captureWindow, countsTowardFounding, entryVintage, PRESEASON, seasonWindow } from "@/lib/seasons";
import { skipsVisitorGate } from "@/lib/site-gate";

const PROBE = `
  creation_time   : 2026-12-15T14:22:01.000000Z
  com.apple.quicktime.model: iPhone 15
  com.apple.quicktime.location.ISO6709: +23.5500-046.6333+010.000/
`;

describe("preseason", () => {
  it("keeps preseason points off the Founding Season", () => {
    expect(PRESEASON.startsOn).toBe("2026-12-01");
    expect(PRESEASON.endsOn).toBe("2027-02-28");
    expect(countsTowardFounding({ vintage: 2026, countsForRanking: false })).toBe(false);
    expect(countsTowardFounding({ vintage: 2027, countsForRanking: true })).toBe(true);
    expect(seasonWindow("2026-11-26")).toBe("before");
    expect(seasonWindow("2026-12-15")).toBe("preseason");
    expect(seasonWindow("2027-03-02")).toBe("founding");
    expect(entryVintage("2026-12-15")).toBe(2026);
    expect(entryVintage("2026-11-26")).toBe(2027);
    expect(captureWindow("2026-12-15")).toEqual({ startsOn: "2026-12-01", endsOn: "2027-02-28" });
    expect(captureWindow("2027-06-01").startsOn).toBe("2027-03-01");
  });
});

describe("calibration and eye", () => {
  it("puts a keyed duel in about one card of four", () => {
    expect(isCalibrationSlot(0)).toBe(false);
    expect(isCalibrationSlot(1)).toBe(false);
    expect(isCalibrationSlot(2)).toBe(false);
    expect(isCalibrationSlot(3)).toBe(true);
    expect(isCalibrationSlot(7)).toBe(true);
    expect(GUEST_DUELS).toBe(3);
  });

  it("locks a key when the pros agree", () => {
    expect(keyFromVotes(["LEFT"])).toBeNull();
    expect(keyFromVotes(["LEFT", "LEFT"])).toBe("LEFT");
    expect(keyFromVotes(["LEFT", "RIGHT"])).toBeNull();
    expect(keyFromVotes(["LEFT", "RIGHT", "RIGHT"])).toBe("RIGHT");
  });

  it("scores the eye from ranking error and calibration, with one flat-day freeze", () => {
    expect(eyeScore({ meanDeviation: 0, calibrationHits: 0, calibrations: 0 })).toBe(100);
    expect(eyeScore({ meanDeviation: 4, calibrationHits: 0, calibrations: 0 })).toBe(50);
    expect(eyeScore({ meanDeviation: null, calibrationHits: 2, calibrations: 3 })).toBe(67);
    expect(eyeScore({ meanDeviation: 4, calibrationHits: 8, calibrations: 10 })).toBe(62);
    expect(eyeLevel(0)).toBe("Shorebreak");
    expect(eyeLevel(40)).toBe("Lineup");
    expect(eyeLevel(62)).toBe("Channel");
    expect(eyeLevel(75)).toBe("Tower");
    expect(eyeLevel(90)).toBe("Golden Eye");

    const bridged = dailyStreak(["2026-11-23", "2026-11-25"], "2026-11-25");
    expect(bridged.freezes).toBe(1);
    expect(bridged.streak).toBe(3);
    expect(dailyStreak([], "2026-11-26")).toEqual({ streak: 0, freezes: 0 });
    expect(weeklyStreak(["2026-11-23", "2026-11-16"], "2026-11-26")).toBe(2);

    const badges = eyeBadges({
      duels: 1,
      calibrations: 10,
      calibrationHits: 9,
      dailyStreak: 7,
      freezes: 1,
      eye: 94,
      verdicts: 3,
    });
    expect(badges.map((badge) => badge.id)).toEqual(["first-light", "week-on", "flat-day", "sharp", "golden-eye"]);
  });
});

describe("footage and links", () => {
  it("reads a capture date and refuses a wave from outside the season", () => {
    const facts = parseFootageProbe(PROBE);
    expect(facts.device).toBe("iPhone 15");
    expect(facts.lat).toBeCloseTo(23.55);
    expect(facts.lng).toBeCloseTo(-46.6333);
    expect(decideFootage(facts, { startsOn: "2026-12-01", endsOn: "2027-02-28" })).toEqual({
      outcome: "inside",
      capturedOn: "2026-12-15",
    });
    expect(decideFootage(facts, { startsOn: "2027-03-01", endsOn: "2028-02-29" }).outcome).toBe("outside");
    expect(decideFootage({ dates: [] }, { startsOn: "2026-12-01", endsOn: "2027-02-28" }).outcome).toBe("missing");
  });

  it("refuses pasted links, including YouTube and Instagram", () => {
    expect(isSocialLink("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isSocialLink("https://www.instagram.com/reel/abc")).toBe(true);
    expect(rejectsPastedLink("https://cdn.example.com/wave.mp4")).toBe(true);
    expect(rejectsPastedLink("")).toBe(false);
    expect(FILE_ONLY_MESSAGE).toContain("Instagram");
  });
});

describe("Monday drop", () => {
  it("authorizes the cron and writes a verdict letter without sending when Resend is missing", async () => {
    expect(cronAuthorized(null, undefined)).toBe(false);
    expect(cronAuthorized("Bearer secret", "secret")).toBe(true);
    expect(cronAuthorized("Bearer other", "secret")).toBe(false);
    expect(isSaoPauloMonday(new Date("2026-11-23T15:00:00.000Z"))).toBe(true);
    expect(isSaoPauloMonday(new Date("2026-11-24T15:00:00.000Z"))).toBe(false);
    expect(skipsVisitorGate("/api/cron/monday-verdict", null)).toBe(true);
    const letter = verdictLetter({
      name: "Joao",
      lines: [{ place: 2, title: "Best Tube" }],
      revealUrl: "https://gsr.surf/verdict",
    });
    expect(letter.subject).toContain("Monday");
    expect(letter.text).toContain("https://gsr.surf/verdict");
    const sent = await sendVerdictEmail({ apiKey: "", to: "a@gsr.surf", letter });
    expect(sent).toEqual({ sent: false, reason: "not_configured" });
    expect(VERDICT_FROM).toBe("GSR <no-reply@gsr.surf>");
  });
});
