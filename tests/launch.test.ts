import { describe, expect, it } from "vitest";
import { worldBoardHref, readBoardDivision } from "@/lib/board-link";
import { planDemoCleanup, titleIsKept } from "@/lib/demo-cleanup";
import { canSubmitOpenBallot, JUDGEABLE_ENTRY_STATUSES, visibleOpenBallots } from "@/lib/judgeable";
import { RESET_FROM, sendResetEmail } from "@/lib/mailer";
import { panelHeading } from "@/lib/panel";
import { assessResetToken, newResetToken } from "@/lib/password-reset";
import { poolFeeCents } from "@/lib/pool-fee";
import { MONEY_BLANK, prizeMoneyPublished } from "@/lib/prize";
import { submissionStatus } from "@/lib/submission-check";

describe("assigned ballots", () => {
  it("shows a ballot on a placed wave and accepts the submission", () => {
    expect(JUDGEABLE_ENTRY_STATUSES).toEqual(["SUBMITTED", "PLACED"]);
    const placed = {
      ballot: { id: "ballot-placed" },
      status: "OPEN",
      entryStatus: "PLACED",
      current: true,
    };
    const submitted = {
      ballot: { id: "ballot-submitted" },
      status: "OPEN",
      entryStatus: "SUBMITTED",
      current: true,
    };
    const shown = visibleOpenBallots([placed, submitted], []);
    expect(shown.map((row) => row.id)).toEqual(["ballot-placed", "ballot-submitted"]);
    expect(canSubmitOpenBallot({ status: "OPEN", entryStatus: "PLACED" })).toBe(true);
    expect(canSubmitOpenBallot({ status: "OPEN", entryStatus: "SUBMITTED" })).toBe(true);
    const sealed = { ...placed, status: "SEALED" };
    expect(visibleOpenBallots([sealed], [])).toEqual([]);
    expect(canSubmitOpenBallot({ status: "SEALED", entryStatus: "PLACED" })).toBe(false);
    expect(canSubmitOpenBallot({ status: "OPEN", entryStatus: "DRAFT" })).toBe(false);
  });
});

describe("world board link", () => {
  it("opens a Masters wave on that division", () => {
    expect(worldBoardHref("frontside", "MASTERS_40", "W")).toBe("/board/frontside?category=MASTERS_40&sex=W");
    expect(readBoardDivision("MASTERS_40", "M")).toEqual({ category: "MASTERS_40", sex: "M" });
    expect(readBoardDivision("masters-40", "W")).toEqual({ category: "MASTERS_40", sex: "W" });
    expect(readBoardDivision(undefined, undefined)).toEqual({ category: "OPEN", sex: "M" });
  });
});

describe("pool fee and prize columns", () => {
  it("is free unless the env fee is a positive number of cents", () => {
    expect(poolFeeCents({ ...process.env, GSR_POOL_FEE_CENTS: undefined })).toBe(0);
    expect(poolFeeCents({ ...process.env, GSR_POOL_FEE_CENTS: "off" })).toBe(0);
    expect(poolFeeCents({ ...process.env, GSR_POOL_FEE_CENTS: "2000" })).toBe(2000);
    expect(prizeMoneyPublished({ ...process.env, GSR_PRIZE_MONEY: undefined })).toBe(false);
    expect(prizeMoneyPublished({ ...process.env, GSR_PRIZE_MONEY: "on" })).toBe(true);
    expect(MONEY_BLANK).toBe("—");
  });
});

describe("password reset", () => {
  it("expires a token and refuses a second use", () => {
    const now = new Date("2026-11-26T12:00:00.000Z");
    const issued = newResetToken(now);
    expect(assessResetToken({ expiresAt: issued.expiresAt, usedAt: null }, now)).toBe("ok");
    expect(assessResetToken({ expiresAt: issued.expiresAt, usedAt: now }, now)).toBe("used");
    expect(assessResetToken({ expiresAt: now, usedAt: null }, now)).toBe("expired");
    expect(assessResetToken(null, now)).toBe("missing");
  });

  it("does not throw when Resend is not configured", async () => {
    const result = await sendResetEmail({ apiKey: "  ", to: "a@gsr.surf", resetUrl: "https://gsr.surf/reset-password?token=x" });
    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(RESET_FROM).toBe("GSR <no-reply@gsr.surf>");
  });
});

describe("judge panel copy", () => {
  it("names the category next to the panel", () => {
    expect(panelHeading("Athletes", "Men's Masters 40+")).toBe("Your panel: Athletes · Men's Masters 40+");
    expect(panelHeading("Athletes", null)).toBe("Your panel: Athletes");
  });
});

describe("pending review copy", () => {
  it("reads a failed title check as pending review", () => {
    expect(
      submissionStatus({
        reviewStatus: "PENDING_REVIEW",
        modalityCheck: "UNCERTAIN",
        modalityNote: "The title check did not finish. Your wave is in, and the desk will review it.",
        contentSha256: "abc",
      }).note,
    ).toMatch(/Pending review/);
  });
});

describe("demo cleanup", () => {
  const tube = {
    id: "tube-wave",
    userId: "user-tube",
    videoUrl: "https://video.gsr.surf/demo/best-tube/01",
    spot: "demo break",
    themeSlug: "best-tube",
    themeName: "Best Tube",
    athleteName: "Caio Mendes",
    athleteEmail: "caio.mendes@gsr.surf",
    athleteSlug: "caio-mendes",
    walletAddress: null,
  };
  const aerial = {
    ...tube,
    id: "air-wave",
    userId: "user-air",
    videoUrl: "https://video.gsr.surf/demo/best-aerial/marina-alves",
    themeSlug: "best-aerial",
    themeName: "Best Aerial",
    athleteName: "Marina Alves",
    athleteEmail: "marina.alves@gsr.surf",
    athleteSlug: "marina-alves",
  };
  const bigSurf = {
    ...tube,
    id: "big-wave",
    userId: "user-big",
    videoUrl: "https://video.gsr.surf/demo/biggest-paddle-in/sergio-bahia",
    themeSlug: "biggest-paddle-in",
    themeName: "Biggest Paddle-In Wave",
    athleteName: "Sergio Bahia",
    athleteEmail: "sergio.bahia@gsr.surf",
    athleteSlug: "sergio-bahia",
  };
  const demoList = {
    ...aerial,
    id: "list-wave",
    userId: "user-list",
    themeSlug: "frontside",
    themeName: "Frontside Lines",
    athleteName: "Demo list incoming",
    athleteEmail: "demo-list-incoming@gsr.surf",
    athleteSlug: "demo-list-incoming",
    walletAddress: "0x1111111111111111111111111111111111111111",
  };

  it("keeps Tube and Big Surf demo waves and deletes the rest", () => {
    expect(titleIsKept({ slug: "best-tube", name: "Best Tube" })).toBe(true);
    expect(titleIsKept({ slug: "biggest-paddle-in", name: "Biggest Paddle-In Wave" })).toBe(true);
    expect(titleIsKept({ slug: "best-aerial", name: "Best Aerial" })).toBe(false);
    const plan = planDemoCleanup(
      [tube, aerial, bigSurf, demoList],
      [
        {
          id: "user-list",
          email: "demo-list-incoming@gsr.surf",
          name: "Demo list incoming",
          role: "ATHLETE",
          displayName: "Demo list incoming",
          slug: "demo-list-incoming",
          walletAddress: "0x1111111111111111111111111111111111111111",
        },
        {
          id: "desk",
          email: "desk@gsr.surf",
          name: "Desk",
          role: "ADMIN",
          displayName: null,
          slug: null,
          walletAddress: null,
        },
      ],
    );
    expect(plan.keepEntries.map((row) => row.id).sort()).toEqual(["big-wave", "tube-wave"]);
    expect(plan.deleteEntries.map((row) => row.id).sort()).toEqual(["air-wave", "list-wave"]);
    expect(plan.deleteUsers.map((row) => row.email)).toEqual(["demo-list-incoming@gsr.surf"]);
    expect(plan.keepUsers).toEqual([]);
  });
});
