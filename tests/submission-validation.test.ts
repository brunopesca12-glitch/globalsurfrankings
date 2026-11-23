import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "@/lib/catalogue";
import { findDuplicate } from "@/lib/duplicates";
import { judgeModality, type WaveObservation } from "@/lib/modality";
import { dHashFromGray, hammingHex, informativeHash, isNearDuplicate } from "@/lib/perceptual-hash";
import { playbackFor, playsAsFile } from "@/lib/playback";
import { skipsVisitorGate } from "@/lib/site-gate";
import { attestationGiven, decideSubmission, submissionStatus, UNPUBLISHED_ATTESTATION } from "@/lib/submission-check";
import { ffmpegPath, parseDuration, parseFrameRate, sampleFrames, sampleTimes, splitJpegs } from "@/lib/video-frames";
import {
  byteRange,
  isPrivateAddress,
  isVercelBlobUrl,
  looksLikeVideoContainer,
  sha256Hex,
} from "@/lib/video-bytes";
import { gatewayModelFromEnv, parseObservation, waveVisionFromEnv } from "@/lib/vision";

function observed(partial: Partial<WaveObservation>): WaveObservation {
  return {
    setting: "ocean",
    stance: "unknown",
    tube: "unknown",
    aerial: "unknown",
    size: "unknown",
    paddleIn: "unknown",
    confidence: 0.9,
    ...partial,
  };
}

const known = {
  contentSha256: "abc",
  frameHashes: ["0123456789abcdef", "fedcba9876543210", "0011223344556677", "8899aabbccddeeff"],
  videoUrl: "https://cdn.example.com/already.mp4",
};

describe("perceptual hash", () => {
  it("hashes a gradient to all ones and a flat frame to nothing useful", () => {
    const gradient = new Uint8Array(9 * 8);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 9; x += 1) gradient[y * 9 + x] = 9 - x;
    }
    const flat = new Uint8Array(9 * 8).fill(40);
    expect(dHashFromGray(gradient, 9, 8)).toBe("ffffffffffffffff");
    expect(informativeHash(dHashFromGray(flat, 9, 8))).toBe(false);
    expect(hammingHex("ffffffffffffffff", "0000000000000000")).toBe(64);
    expect(hammingHex("ffffffffffffffff", "fffffffffffffffe")).toBe(1);
  });

  it("calls frames the same wave only when enough of them agree", () => {
    const original = ["0123456789abcdef", "fedcba9876543210", "0011223344556677", "8899aabbccddeeff"];
    expect(isNearDuplicate(original, original)).toBe(true);
    expect(isNearDuplicate(original, ["0123456789abcdef"])).toBe(false);
    expect(isNearDuplicate(["0000000000000000", "0000000000000000", "0000000000000000", "0000000000000000"], original)).toBe(
      false,
    );
  });
});

describe("duplicates and attestation", () => {
  it("refuses an exact file, a near copy, and the same link", () => {
    expect(findDuplicate({ contentSha256: "abc", frameHashes: [], videoUrl: null, known: [known] })?.kind).toBe("exact");
    expect(
      findDuplicate({ contentSha256: "new", frameHashes: known.frameHashes, videoUrl: null, known: [known] })?.kind,
    ).toBe("near");
    expect(
      findDuplicate({
        contentSha256: null,
        frameHashes: null,
        videoUrl: "https://cdn.example.com/already.mp4",
        known: [known],
      })?.kind,
    ).toBe("link");
    expect(findDuplicate({ contentSha256: "other", frameHashes: ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", "cccccccccccccccc", "dddddddddddddddd"], videoUrl: "https://cdn.example.com/new.mp4", known: [known] })).toBeNull();
  });

  it("requires the unpublished attestation and stores its wording", () => {
    expect(attestationGiven("on")).toBe(true);
    expect(attestationGiven(null)).toBe(false);
    const refused = decideSubmission({
      attested: false,
      themeSlug: "best-tube",
      videoUrl: null,
      contentSha256: "1",
      frameHashes: [],
      readable: true,
      known: [],
      observation: observed({ tube: "yes" }),
      visionConfigured: true,
    });
    expect(refused.ok).toBe(false);
    const accepted = decideSubmission({
      attested: true,
      themeSlug: "best-tube",
      videoUrl: null,
      contentSha256: "1",
      frameHashes: [],
      readable: true,
      known: [],
      observation: observed({ tube: "yes" }),
      visionConfigured: true,
    });
    expect(accepted).toMatchObject({
      ok: true,
      reviewStatus: "CLEAR",
      modalityCheck: "FIT",
      attestationText: UNPUBLISHED_ATTESTATION,
    });
  });

  it("holds a wave the model could not watch, and refuses a clear miss", () => {
    expect(
      decideSubmission({
        attested: true,
        themeSlug: "best-tube",
        videoUrl: "https://youtu.be/abc",
        contentSha256: null,
        frameHashes: null,
        readable: false,
        known: [],
        observation: null,
        visionConfigured: true,
      }),
    ).toMatchObject({ ok: true, reviewStatus: "PENDING_REVIEW", modalityCheck: "UNAVAILABLE" });
    expect(
      decideSubmission({
        attested: true,
        themeSlug: "best-aerial",
        videoUrl: null,
        contentSha256: "file",
        frameHashes: ["0123456789abcdef", "fedcba9876543210", "0011223344556677", "8899aabbccddeeff"],
        readable: true,
        known: [],
        observation: null,
        visionConfigured: false,
      }),
    ).toMatchObject({ ok: true, reviewStatus: "PENDING_REVIEW", modalityCheck: "UNAVAILABLE" });
    const unfit = decideSubmission({
      attested: true,
      themeSlug: "best-aerial",
      videoUrl: null,
      contentSha256: "file",
      frameHashes: [],
      readable: true,
      known: [],
      observation: observed({ aerial: "no" }),
      visionConfigured: true,
    });
    expect(unfit.ok).toBe(false);
    if (!unfit.ok) expect(unfit.error).toContain("Best Aerial");
  });
});

describe("title fit", () => {
  it("covers every founding title with a clear fit, a clear miss, and an unsure read", () => {
    const cases: Record<string, { fit: Partial<WaveObservation>; miss: Partial<WaveObservation> }> = {
      "best-tube": { fit: { tube: "yes" }, miss: { tube: "no" } },
      "best-aerial": { fit: { aerial: "yes" }, miss: { aerial: "no" } },
      "biggest-paddle-in": { fit: { size: "large", paddleIn: "yes" }, miss: { size: "small", paddleIn: "yes" } },
      "best-small-wave": { fit: { size: "small" }, miss: { size: "large" } },
      frontside: { fit: { stance: "frontside" }, miss: { stance: "backside" } },
      backside: { fit: { stance: "backside" }, miss: { stance: "frontside" } },
      "wave-pool": { fit: { setting: "pool" }, miss: { setting: "ocean" } },
    };
    expect(THEMES.map((theme) => theme.slug).sort()).toEqual(Object.keys(cases).sort());
    for (const [slug, row] of Object.entries(cases)) {
      expect(judgeModality(slug, observed(row.fit)).outcome, slug).toBe("fit");
      expect(judgeModality(slug, observed(row.miss)).outcome, slug).toBe("unfit");
      expect(judgeModality(slug, observed({ ...row.fit, confidence: 0.4 })).outcome, slug).toBe("uncertain");
    }
    expect(judgeModality("best-tube", observed({ setting: "pool", tube: "yes" })).outcome).toBe("unfit");
    expect(judgeModality("biggest-paddle-in", observed({ size: "medium", paddleIn: "yes" })).outcome).toBe("uncertain");
    expect(judgeModality("biggest-paddle-in", observed({ size: "large", paddleIn: "no" })).outcome).toBe("unfit");
    expect(judgeModality("best-small-wave", observed({ size: "medium" })).outcome).toBe("uncertain");
    expect(judgeModality("frontside", observed({ stance: "unknown" })).outcome).toBe("uncertain");
  });
});

describe("vision provider", () => {
  it("parses a model reading and stays off until a key is set", () => {
    expect(
      parseObservation(
        '```json\n{"setting":"pool","stance":"frontside","tube":"no","aerial":"yes","size":"small","paddleIn":"yes","confidence":0.91}\n```',
      ),
    ).toEqual({
      setting: "pool",
      stance: "frontside",
      tube: "no",
      aerial: "yes",
      size: "small",
      paddleIn: "yes",
      confidence: 0.91,
    });
    expect(parseObservation("{")).toBeNull();
    expect(waveVisionFromEnv({})).toBeNull();
    expect(waveVisionFromEnv({ OPENAI_API_KEY: "sk-test" })?.name).toBe("OpenAI");
    expect(waveVisionFromEnv({ GEMINI_API_KEY: "g", OPENAI_API_KEY: "" })?.name).toBe("Gemini");
    expect(waveVisionFromEnv({ ANTHROPIC_API_KEY: "a" })?.name).toBe("Anthropic");
    expect(waveVisionFromEnv({ VERCEL_OIDC_TOKEN: "oidc", OPENAI_API_KEY: "sk-test" })?.name).toBe("OpenAI");
    expect(waveVisionFromEnv({ VERCEL_OIDC_TOKEN: "oidc" })).toMatchObject({
      name: "Vercel AI Gateway",
      model: "google/gemini-2.5-flash",
    });
    expect(waveVisionFromEnv({ AI_GATEWAY_API_KEY: "gw", AI_GATEWAY_MODEL: "openai/gpt-4o-mini" })).toMatchObject({
      name: "Vercel AI Gateway",
      model: "openai/gpt-4o-mini",
    });
    expect(waveVisionFromEnv({ AI_GATEWAY_API_KEY: "  ", VERCEL_OIDC_TOKEN: "" })).toBeNull();
    expect(waveVisionFromEnv({ VERCEL: "1" })?.name).toBe("Vercel AI Gateway");
    expect(waveVisionFromEnv({ VERCEL: "1", OPENAI_API_KEY: "sk-test" })?.name).toBe("OpenAI");
    expect(gatewayModelFromEnv({})).toBe("google/gemini-2.5-flash");
  });
});

describe("video intake helpers", () => {
  it("rejects private addresses and accepts a real container, range, and playback path", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true);
    expect(isPrivateAddress("10.1.2.3")).toBe(true);
    expect(isPrivateAddress("192.168.1.9")).toBe(true);
    expect(isPrivateAddress("169.254.169.254")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
    expect(isVercelBlobUrl("https://abc.public.blob.vercel-storage.com/waves/a.mp4")).toBe(true);
    expect(isVercelBlobUrl("https://cdn.example.com/a.mp4")).toBe(false);
    const mp4 = new Uint8Array(16);
    mp4.set([0, 0, 0, 24, 102, 116, 121, 112], 0);
    expect(looksLikeVideoContainer(mp4)).toBe(true);
    expect(byteRange("bytes=0-3", 10)).toEqual({ start: 0, end: 3 });
    expect(byteRange("bytes=0-", 10)).toEqual({ start: 0, end: 9 });
    expect(byteRange("bytes=20-", 10)).toBe("invalid");
    expect(playbackFor("/media/entries/abc")).toEqual({ kind: "file" });
    expect(playsAsFile("/media/entries/abc")).toBe(true);
    expect(playsAsFile("https://cdn.example.com/heat.mp4")).toBe(true);
    expect(playsAsFile("https://video.gsr.surf/demo/01")).toBe(false);
    expect(playsAsFile("https://abc.public.blob.vercel-storage.com/waves/clip")).toBe(true);
    expect(playsAsFile("https://www.youtube.com/watch?v=abc123")).toBe(false);
    expect(skipsVisitorGate("/api/video-upload", "abc")).toBe(true);
    expect(skipsVisitorGate("/api/video-upload", null)).toBe(false);
    expect(skipsVisitorGate("/enter", "abc")).toBe(false);
    expect(parseDuration("Duration: 00:00:02.50, start: 0.000000")).toBe(2.5);
    expect(parseFrameRate("1280x720, 30 fps,")).toBe(30);
    expect(sampleTimes(10, 6)).toHaveLength(6);
    expect(submissionStatus({ reviewStatus: "CLEAR", modalityCheck: null, modalityNote: "", contentSha256: null }).label).toBe(
      "Entered",
    );
  });
});

function run(binary: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${binary} exited ${code}`))));
  });
}

describe("sampled frames", () => {
  it("treats a re-save, a resize, and a center crop as the same clip, and a different picture as a new one", async () => {
    const binary = ffmpegPath();
    const dir = await mkdtemp(path.join(tmpdir(), "gsr-check-"));
    try {
      const original = path.join(dir, "original.mp4");
      const resized = path.join(dir, "resized.mp4");
      const cropped = path.join(dir, "cropped.mp4");
      const other = path.join(dir, "other.mp4");
      await run(binary, ["-y", "-f", "lavfi", "-i", "smptehdbars=size=320x240:rate=25", "-t", "2", "-pix_fmt", "yuv420p", original]);
      await run(binary, ["-y", "-i", original, "-vf", "scale=160:120", "-c:v", "libx264", "-crf", "32", "-an", resized]);
      await run(binary, ["-y", "-i", original, "-vf", "crop=iw*0.7:ih*0.7,scale=220:160", "-c:v", "libx264", "-an", cropped]);
      await run(binary, ["-y", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=25", "-t", "2", "-pix_fmt", "yuv420p", other]);

      const originalBytes = new Uint8Array(await readFile(original));
      const resizedBytes = new Uint8Array(await readFile(resized));
      const croppedBytes = new Uint8Array(await readFile(cropped));
      const otherBytes = new Uint8Array(await readFile(other));
      expect(looksLikeVideoContainer(originalBytes)).toBe(true);
      expect(sha256Hex(originalBytes)).toBe(sha256Hex(new Uint8Array(await readFile(original))));
      expect(sha256Hex(originalBytes)).not.toBe(sha256Hex(resizedBytes));

      const [a, b, c, d] = await Promise.all([
        sampleFrames(originalBytes),
        sampleFrames(resizedBytes),
        sampleFrames(croppedBytes),
        sampleFrames(otherBytes),
      ]);
      expect(a.jpegs.length).toBeGreaterThan(0);
      expect(splitJpegs(a.jpegs[0]!).length).toBe(1);
      expect(isNearDuplicate(b.hashes, a.hashes), `resize hashes ${b.hashes.length}/${a.hashes.length}`).toBe(true);
      expect(isNearDuplicate(c.hashes, a.hashes), `crop hashes ${c.hashes.join(" ")} vs ${a.hashes.join(" ")}`).toBe(true);
      expect(isNearDuplicate(d.hashes, a.hashes), `other hashes ${d.hashes.join(" ")} vs ${a.hashes.join(" ")}`).toBe(false);
      expect(
        findDuplicate({ contentSha256: sha256Hex(resizedBytes), frameHashes: b.hashes, videoUrl: null, known: [{ contentSha256: sha256Hex(originalBytes), frameHashes: a.hashes, videoUrl: "https://cdn.example.com/original.mp4" }] })?.kind,
      ).toBe("near");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
