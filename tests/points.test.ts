import { describe, expect, it } from "vitest";
import { placementPoints, pointFraction, scaledBase, seasonPoints } from "@/lib/points";

describe("event points", () => {
  it("scales the winner's base by √(S/100)", () => {
    expect(scaledBase(100)).toBe(100);
    expect(scaledBase(400)).toBe(200);
    expect(scaledBase(0)).toBe(0);
    expect(placementPoints(1, 400)).toBe(200);
    expect(placementPoints(1, 100)).toBe(100);
  });

  it("pays the podium curve 100/60/45/35/28/22 then 12% through the top fifth and 4% to every entrant", () => {
    expect(pointFraction(1, 100)).toBe(1);
    expect(pointFraction(2, 100)).toBe(0.6);
    expect(pointFraction(3, 100)).toBe(0.45);
    expect(pointFraction(4, 100)).toBe(0.35);
    expect(pointFraction(5, 100)).toBe(0.28);
    expect(pointFraction(6, 100)).toBe(0.22);
    expect(placementPoints(2, 100)).toBe(60);
    expect(placementPoints(3, 100)).toBe(45);
    expect(placementPoints(6, 100)).toBe(22);
    expect(placementPoints(7, 100)).toBe(12);
    expect(placementPoints(20, 100)).toBe(12);
    expect(placementPoints(21, 100)).toBe(4);
    expect(placementPoints(100, 100)).toBe(4);
  });

  it("keeps the podium curve when the top fifth is inside the first six", () => {
    expect(Math.floor(30 / 5)).toBe(6);
    expect(pointFraction(6, 30)).toBe(0.22);
    expect(pointFraction(7, 30)).toBe(0.04);
  });

  it("doubles a field of 400 against a field of 100 at every rung of the curve", () => {
    for (const place of [1, 2, 3, 4, 5, 6, 7, 20]) {
      expect(placementPoints(place, 400)).toBe(placementPoints(place, 100) * 2);
    }
    expect(placementPoints(80, 400)).toBe(24);
    expect(placementPoints(81, 400)).toBe(8);
  });

  it("rounds the demo field of eight to stable hundredths", () => {
    expect(placementPoints(1, 8)).toBe(28.28);
    expect(placementPoints(2, 8)).toBe(16.97);
    expect(placementPoints(3, 8)).toBe(12.73);
    expect(placementPoints(4, 8)).toBe(9.9);
    expect(placementPoints(5, 8)).toBe(7.92);
    expect(placementPoints(6, 8)).toBe(6.22);
    expect(placementPoints(7, 8)).toBe(1.13);
    expect(placementPoints(8, 8)).toBe(1.13);
  });

  it("rejects a place outside the field and sums a season across events", () => {
    expect(placementPoints(0, 10)).toBe(0);
    expect(placementPoints(11, 10)).toBe(0);
    const totals = seasonPoints([
      { athleteId: "a", eventKey: "barrel", place: 1, entrants: 100 },
      { athleteId: "a", eventKey: "air", place: 2, entrants: 100 },
      { athleteId: "b", eventKey: "barrel", place: 2, entrants: 100 },
    ]);
    expect(totals.get("a")).toBe(160);
    expect(totals.get("b")).toBe(60);
  });
});
