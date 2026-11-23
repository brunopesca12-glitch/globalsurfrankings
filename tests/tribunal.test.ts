import { describe, expect, it } from "vitest";
import { collegeSeat } from "@/lib/median";
import {
  accuracyLine,
  ballotProgressLine,
  canJudgeEntry,
  collegeVerdictsFromBallots,
  drawEntries,
  dutyStatusLine,
  finalPlaceFromCollegeVerdicts,
  forbiddenForAthlete,
  nextBoard,
  resolveCollege,
  upperAthleteIds,
} from "@/lib/tribunal";

const athletes = [
  { id: "joao", clubKey: "ipanema", category: "OPEN", sex: "M" },
  { id: "helena", clubKey: "ipanema", category: "MASTERS_40", sex: "W" },
  { id: "solo", clubKey: null, category: "OPEN", sex: "W" },
];

describe("one college", () => {
  it("seats a champion ahead of every other claim, and the Upper Chamber ahead of Athletes", () => {
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: true,
        seatedRanked: true,
        upper: true,
        enteredThisSeason: true,
      }),
    ).toBe("CHAMBER");
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: false,
        seatedRanked: true,
        upper: true,
        enteredThisSeason: true,
      }),
    ).toBe("RANKED");
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: false,
        seatedRanked: false,
        upper: true,
        enteredThisSeason: true,
      }),
    ).toBe("UPPER");
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: false,
        seatedRanked: false,
        upper: false,
        enteredThisSeason: true,
      }),
    ).toBe("ATHLETES");
    expect(
      resolveCollege({
        role: "ATHLETE",
        seatedChamber: false,
        seatedRanked: false,
        upper: false,
        enteredThisSeason: false,
      }),
    ).toBe("PUBLIC");
  });

  it("leaves the desk unseated unless the desk puts them in Chamber or Ranked", () => {
    expect(
      resolveCollege({
        role: "ADMIN",
        seatedChamber: false,
        seatedRanked: false,
        upper: false,
        enteredThisSeason: false,
      }),
    ).toBeNull();
    expect(
      resolveCollege({
        role: "ADMIN",
        seatedChamber: true,
        seatedRanked: false,
        upper: false,
        enteredThisSeason: false,
      }),
    ).toBe("CHAMBER");
  });
});

describe("never your own table", () => {
  it("blocks the judge's category and a declared clubmate's category", () => {
    const editions = new Map([
      ["joao", [{ category: "OPEN", sex: "M" }]],
      ["helena", [{ category: "MASTERS_40", sex: "W" }]],
    ]);
    const forbidden = forbiddenForAthlete("joao", athletes, editions);
    expect(forbidden.has("OPEN:M")).toBe(true);
    expect(forbidden.has("MASTERS_40:W")).toBe(true);
    expect(forbidden.has("OPEN:W")).toBe(false);
    expect(
      canJudgeEntry({
        judgeAthleteId: "joao",
        entryAthleteId: "joao",
        edition: "OPEN:W",
        forbidden,
      }),
    ).toBe(false);
    expect(
      canJudgeEntry({
        judgeAthleteId: "joao",
        entryAthleteId: "marina",
        edition: "OPEN:W",
        forbidden,
      }),
    ).toBe(true);
  });

  it("does not treat a blank club as a club", () => {
    const forbidden = forbiddenForAthlete("solo", athletes, new Map());
    expect(forbidden.has("OPEN:W")).toBe(true);
    expect(forbidden.has("OPEN:M")).toBe(false);
  });
});

describe("upper chamber", () => {
  it("keeps the top 10 of each ranking, with a stable tie break", () => {
    const edition = Array.from({ length: 12 }, (_, index) => ({
      athleteId: `a${String(index).padStart(2, "0")}`,
      points: index === 10 ? 4 : 12 - index,
    }));
    edition.push({ athleteId: "a10b", points: 4 });
    const ids = upperAthleteIds([edition]);
    expect(ids).toHaveLength(10);
    expect(ids).toContain("a10");
    expect(ids).not.toContain("a10b");
  });
});

describe("duty copy", () => {
  it("uses the two status lines", () => {
    expect(dutyStatusLine(0)).toBe("Your duty is current. Your entries are eligible for Monday.");
    expect(dutyStatusLine(5)).toBe("Complete 5 ballots to keep your entries eligible.");
    expect(ballotProgressLine(3, 8)).toBe("3 of 8 ballots this week");
    expect(accuracyLine(null)).toBe("Your accuracy appears after Monday publishes a verdict you voted on.");
    expect(accuracyLine({ mean: 1.4, verdicts: 6 })).toBe(
      "Your accuracy: mean deviation 1.4 places across 6 published verdicts.",
    );
  });
});

describe("blind draw", () => {
  it("prefers the waves a college has judged least", () => {
    const drawn = drawEntries(
      [
        { id: "busy", collegeBallots: 4 },
        { id: "fresh-b", collegeBallots: 0 },
        { id: "fresh-a", collegeBallots: 0 },
      ],
      2,
      () => 0,
    );
    expect(drawn.map((item) => item.id)).toEqual(["fresh-a", "fresh-b"]);
  });
});

describe("monday median", () => {
  it("abstains every college below three ballots and inserts equal medians best-last", () => {
    expect(collegeSeat("PUBLIC", [1, 2])).toBeNull();
    expect(collegeSeat("CHAMBER", [2, 2, 5])).toBe(2);
    const verdicts = collegeVerdictsFromBallots([
      { college: "CHAMBER", place: 1 },
      { college: "CHAMBER", place: 1 },
      { college: "CHAMBER", place: 2 },
      { college: "ATHLETES", place: 8 },
    ]);
    expect(verdicts.find((verdict) => verdict.college === "CHAMBER")?.place).toBe(1);
    expect(verdicts.find((verdict) => verdict.college === "ATHLETES")?.place).toBeNull();
    expect(finalPlaceFromCollegeVerdicts(verdicts)).toBe(1);
    expect(
      nextBoard(
        ["x", "y"],
        [
          { id: "A", place: 1, chamberPlace: 1, createdAt: 2 },
          { id: "B", place: 1, chamberPlace: 2, createdAt: 1 },
        ],
      ),
    ).toEqual(["A", "B", "x", "y"]);
  });
});
