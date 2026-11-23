import { parseVideoUrl } from "@/lib/entry-rules";
import { isNearDuplicate } from "@/lib/perceptual-hash";

export type KnownWave = {
  contentSha256: string | null;
  frameHashes: readonly string[];
  videoUrl: string;
};

export type DuplicateHit = { kind: "exact" | "near" | "link" };

export const DUPLICATE_MESSAGE: Record<DuplicateHit["kind"], string> = {
  exact: "This video is already in Global Surf Rankings. The same wave cannot be entered twice.",
  near: "This looks like a wave already in Global Surf Rankings — the same clip saved again, trimmed, or cropped. The same wave cannot be entered twice.",
  link: "This link is already in Global Surf Rankings. The same wave cannot be entered twice.",
};

function sameLink(left: string, right: string): boolean {
  const a = parseVideoUrl(left);
  const b = parseVideoUrl(right);
  if (!a || !b) return false;
  return a === b;
}

export function findDuplicate(input: {
  contentSha256: string | null;
  frameHashes: readonly string[] | null;
  videoUrl: string | null;
  known: readonly KnownWave[];
}): DuplicateHit | null {
  for (const wave of input.known) {
    if (input.contentSha256 && wave.contentSha256 && input.contentSha256 === wave.contentSha256) {
      return { kind: "exact" };
    }
  }
  if (input.frameHashes && input.frameHashes.length > 0) {
    for (const wave of input.known) {
      if (isNearDuplicate(input.frameHashes, wave.frameHashes)) return { kind: "near" };
    }
  }
  if (input.videoUrl) {
    for (const wave of input.known) {
      if (sameLink(input.videoUrl, wave.videoUrl)) return { kind: "link" };
    }
  }
  return null;
}
