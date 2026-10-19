import { describe, expect, it } from "vitest";
import { eligibilityFor } from "@/lib/eligibility";
import { demoPair } from "@/lib/demo-clips";
import { circuitClock, daysUntilMonday, judgingStreak, purseMirror } from "@/lib/season-clock";
import { resolveCollege } from "@/lib/tribunal";

const open = {
  role: "ATHLETE" as const,
  hasAthlete: true,
  seatedChamber: false,
  seatedRanked: false,
  upper: false,
  enteredThisSeason: false,
  override: null,
};

describe("eligibility", () => {
  it("gives every verified athlete the Public, and a competitor the Athletes' College", () => {
    expect(eligibilityFor(open).college).toBe("PUBLIC");
    expect(eligibilityFor({ ...open, enteredThisSeason: true }).college).toBe("ATHLETES");
    expect(eligibilityFor({ ...open, enteredThisSeason: true, upper: true }).college).toBe("UPPER");
  });

  it("lets an invitation outrank a ranking, and a desk override outrank the invitation", () => {
    expect(eligibilityFor({ ...open, seatedChamber: true, upper: true, enteredThisSeason: true }).college).toBe("CHAMBER");
    expect(eligibilityFor({ ...open, seatedRanked: true, override: "PUBLIC" }).college).toBe("PUBLIC");
    expect(eligibilityFor({ ...open, override: "CHAMBER" }).why).toContain("desk");
  });

  it("explains why the desk and a profile-less account do not judge", () => {
    expect(eligibilityFor({ ...open, role: "ADMIN", hasAthlete: false }).college).toBeNull();
    expect(eligibilityFor({ ...open, hasAthlete: false }).qualify).toContain("athlete profile");
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: false,
        seatedRanked: false,
        upper: false,
        enteredThisSeason: false,
        hasAthlete: false,
      }),
    ).toBeNull();
  });
});

describe("season clock", () => {
  it("calls the weeks before opening day a preseason demo", () => {
    const clock = circuitClock(new Date("2026-10-19T12:00:00.000Z"));
    expect(clock.phase).toBe("preseason");
    expect(clock.headline).toContain("Mar 1, 2027");
    expect(clock.detail).toContain("preseason");
  });

  it("counts down to Monday and keeps a streak that is still open this week", () => {
    expect(daysUntilMonday(new Date("2026-10-19T12:00:00.000Z"))).toBe(0);
    expect(daysUntilMonday(new Date("2026-10-20T12:00:00.000Z"))).toBe(6);
    expect(judgingStreak([{ isoYear: 2026, isoWeek: 42 }], new Date("2026-10-19T12:00:00.000Z"))).toBe(1);
    expect(purseMirror({ college: "RANKED", today: "2026-10-19", startsOn: "2027-03-01" }).tone).toBe("none");
    expect(purseMirror({ college: "RANKED", today: "2027-04-01", startsOn: "2027-03-01" }).tone).toBe("pending");
    expect(purseMirror({ college: "PUBLIC", today: "2027-04-01", startsOn: "2027-03-01" }).tone).toBe("unpaid");
  });
});

describe("demo clips", () => {
  it("gives the two sides of a ballot different files", () => {
    const pair = demoPair("ballot-1");
    expect(pair.drawn).not.toBe(pair.board);
    expect(pair.drawn.startsWith("/demo-waves/")).toBe(true);
  });
});
