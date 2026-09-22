import { describe, expect, it } from "vitest";
import { deriveLeaderboard, normalizeHashtag } from "@/lib/leaderboard";

describe("derived leaderboards", () => {
  const world = [
    { athleteId: "caio", place: 1, hashtags: ["brasil", "saquarema"] },
    { athleteId: "theo", place: 2, hashtags: ["france"] },
    { athleteId: "rafael", place: 3, hashtags: ["#Brasil", "floripa"] },
    { athleteId: "joao", place: 4, hashtags: ["ipanema", "brasil"] },
    { athleteId: "pedro", place: 7, hashtags: ["brasil"] },
  ];

  it("renumbers a hashtag without judging anything new", () => {
    expect(deriveLeaderboard(world, "#Brasil")).toEqual([
      { athleteId: "caio", worldPlace: 1, derivedPlace: 1 },
      { athleteId: "rafael", worldPlace: 3, derivedPlace: 2 },
      { athleteId: "joao", worldPlace: 4, derivedPlace: 3 },
      { athleteId: "pedro", worldPlace: 7, derivedPlace: 4 },
    ]);
    expect(deriveLeaderboard(world, "ipanema")).toEqual([
      { athleteId: "joao", worldPlace: 4, derivedPlace: 1 },
    ]);
  });

  it("normalises accents and empty tags", () => {
    expect(normalizeHashtag(" #Ipanema ")).toBe("ipanema");
    expect(normalizeHashtag("São Paulo")).toBe("saopaulo");
    expect(deriveLeaderboard(world, "")).toEqual([]);
  });
});
