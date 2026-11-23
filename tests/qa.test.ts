import { describe, expect, it } from "vitest";
import { publicOrigin, safeCallback } from "@/lib/auth-redirect";
import { isCurrentModality, parseRankOrder, placedAthleteCount, placesFromOrder } from "@/lib/comparison";
import { drawComparable } from "@/lib/tribunal";

describe("current divisions", () => {
  it("keeps the seven titles and drops retired categories", () => {
    expect(isCurrentModality("best-tube", "OPEN")).toBe(true);
    expect(isCurrentModality("best-tube", "MASTERS_40")).toBe(true);
    expect(isCurrentModality("best-tube", "JUNIOR")).toBe(false);
    expect(isCurrentModality("best-tube", "MASTERS_50")).toBe(false);
    expect(isCurrentModality("best-barrel", "OPEN")).toBe(false);
  });
});

describe("ranking order", () => {
  it("gives each ballot its slot and ignores comparison waves", () => {
    const tokens = parseRankOrder("p:peer1,b:newwave,p:peer2");
    expect(tokens).toEqual([
      { kind: "peer", id: "peer1" },
      { kind: "ballot", id: "newwave" },
      { kind: "peer", id: "peer2" },
    ]);
    expect(placesFromOrder(tokens!)).toEqual([{ ballotId: "newwave", place: 2 }]);
    expect(parseRankOrder("b:one,b:one")).toBeNull();
    expect(parseRankOrder("https://evil.example")).toBeNull();
  });

  it("counts athletes who already have a place, once each", () => {
    expect(
      placedAthleteCount([
        { athleteId: "a", placed: false },
        { athleteId: "a", placed: true },
        { athleteId: "b", placed: false },
        { athleteId: "a", placed: true },
      ]),
    ).toBe(1);
  });
});

describe("comparable draw", () => {
  it("fills from the division that has the most waves", () => {
    const waves = [
      { id: "a1", collegeBallots: 0, edition: "tube:OPEN:M" },
      { id: "a2", collegeBallots: 0, edition: "tube:OPEN:M" },
      { id: "a3", collegeBallots: 0, edition: "tube:OPEN:M" },
      { id: "b1", collegeBallots: 0, edition: "air:OPEN:W" },
    ];
    const drawn = drawComparable(waves, 3, () => 0);
    expect(drawn.map((wave) => wave.id)).toEqual(["a1", "a2", "a3"]);
  });
});

describe("sign-in redirects", () => {
  it("stays on the host the visitor opened and only accepts a site path", () => {
    expect(
      publicOrigin({
        forwardedHost: "globalsurfrankings.com",
        forwardedProto: "https",
        host: "localhost:3000",
        fallbackOrigin: "http://127.0.0.1:3000",
      }),
    ).toBe("https://globalsurfrankings.com");
    expect(
      publicOrigin({
        forwardedHost: "evil.example",
        forwardedProto: "https",
        host: "gsr.surf",
        fallbackOrigin: "https://gsr.surf",
      }),
    ).toBe("https://gsr.surf");
    expect(safeCallback("/enter?next=1", "/judge")).toBe("/enter?next=1");
    expect(safeCallback("https://evil.example/enter", "/judge")).toBe("/judge");
    expect(safeCallback("//evil.example", "/judge")).toBe("/judge");
  });
});
