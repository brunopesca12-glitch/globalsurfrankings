import { describe, expect, it } from "vitest";
import { ageOn, categoryForAge } from "@/lib/category";
import { SEASON_2027, THEMES, themesFor } from "@/lib/catalogue";
import { decideEntry, themeIsOpen } from "@/lib/entry-rules";
import { isoWeek } from "@/lib/iso-week";

const tube = THEMES.find((theme) => theme.slug === "best-tube")!;
const air = THEMES.find((theme) => theme.slug === "best-aerial")!;
const small = THEMES.find((theme) => theme.slug === "best-small-wave")!;
const pool = THEMES.find((theme) => theme.slug === "wave-pool")!;

const base = {
  dutyCurrent: true,
  environment: "OCEAN" as const,
  theme: tube,
  category: "OPEN" as const,
  existingOceanWeeks: [] as { isoYear: number; isoWeek: number }[],
  isoYear: 2026,
  isoWeek: 39,
  today: "2026-09-22",
  videoUrl: "https://video.gsr.surf/demo/wave",
};

describe("catalogue", () => {
  it("gives the Founding Season seven titles, each open to both divisions", () => {
    expect(THEMES).toHaveLength(7);
    expect(new Set(THEMES.map((theme) => theme.slug)).size).toBe(7);
    expect(themesFor("OPEN")).toHaveLength(7);
    expect(themesFor("MASTERS_40")).toHaveLength(7);
    expect(themesFor("JUNIOR")).toHaveLength(0);
    expect(themesFor("MASTERS_50")).toHaveLength(0);
  });

  it("dates the Founding Season from 1 Mar 2027 to 29 Feb 2028", () => {
    expect(SEASON_2027.startsOn).toBe("2027-03-01");
    expect(SEASON_2027.endsOn).toBe("2028-02-29");
    expect(small.finaleOn).toBe("2028-02-29");
    expect(tube.finaleOn).toBe("2028-02-29");
    expect(air.finaleOn).toBe("2028-02-29");
    expect(air.proposedDate).toBe(false);
    expect(air.oceanOnly).toBe(true);
    expect(pool.poolOnly).toBe(true);
    expect(pool.finaleOn).toBe("2028-02-29");
  });
});

describe("category", () => {
  const asOf = new Date("2027-09-30T00:00:00.000Z");

  it("assigns exclusive age bands", () => {
    expect(categoryForAge(18)).toBe("OPEN");
    expect(categoryForAge(19)).toBe("OPEN");
    expect(categoryForAge(39)).toBe("OPEN");
    expect(categoryForAge(40)).toBe("MASTERS_40");
    expect(categoryForAge(49)).toBe("MASTERS_40");
    expect(categoryForAge(50)).toBe("MASTERS_40");
  });

  it("counts completed years on the season's age date", () => {
    expect(ageOn(new Date("2009-09-30T00:00:00.000Z"), asOf)).toBe(18);
    expect(ageOn(new Date("2009-10-01T00:00:00.000Z"), asOf)).toBe(17);
  });
});

describe("entry gate", () => {
  it("blocks an athlete whose judging duty is not current", () => {
    expect(decideEntry({ ...base, dutyCurrent: false })).toEqual({ ok: false, code: "DUTY" });
  });

  it("allows one free ocean wave per ISO week and leaves the pool free until the fee is set", () => {
    expect(decideEntry(base)).toEqual({ ok: true, tollCents: 0 });
    expect(
      decideEntry({
        ...base,
        existingOceanWeeks: [{ isoYear: 2026, isoWeek: 39 }],
      }),
    ).toEqual({ ok: false, code: "QUOTA" });
    expect(
      decideEntry({
        ...base,
        environment: "POOL",
        existingOceanWeeks: [{ isoYear: 2026, isoWeek: 39 }],
      }),
    ).toEqual({ ok: true, tollCents: 0 });
    expect(
      decideEntry({
        ...base,
        environment: "POOL",
        poolTollCents: 2_000,
      }),
    ).toEqual({ ok: true, tollCents: 2_000 });
  });

  it("refuses the wrong category, environment, closed theme, or video", () => {
    expect(decideEntry({ ...base, theme: small, category: "JUNIOR" as "OPEN" })).toEqual({ ok: false, code: "CATEGORY" });
    expect(decideEntry({ ...base, theme: air, environment: "POOL" })).toEqual({ ok: false, code: "ENVIRONMENT" });
    expect(decideEntry({ ...base, theme: pool, environment: "OCEAN" })).toEqual({ ok: false, code: "ENVIRONMENT" });
    expect(decideEntry({ ...base, theme: pool, environment: "POOL" })).toEqual({ ok: true, tollCents: 0 });
    expect(decideEntry({ ...base, theme: pool, environment: "POOL", poolTollCents: 2_000 })).toEqual({
      ok: true,
      tollCents: 2_000,
    });
    expect(decideEntry({ ...base, today: "2028-03-01" })).toEqual({ ok: false, code: "THEME_CLOSED" });
    expect(decideEntry({ ...base, videoUrl: "nota-video" })).toEqual({ ok: false, code: "VIDEO" });
    expect(themeIsOpen("2027-09-30", "2027-09-30")).toBe(true);
  });
});

describe("iso week", () => {
  it("knows the 2027 boundary", () => {
    expect(isoWeek(new Date("2027-01-01T00:00:00.000Z"))).toEqual({ isoYear: 2026, isoWeek: 53 });
    expect(isoWeek(new Date("2027-01-04T12:00:00.000Z"))).toEqual({ isoYear: 2027, isoWeek: 1 });
  });
});
