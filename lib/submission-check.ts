import { DUPLICATE_MESSAGE, findDuplicate, type KnownWave } from "@/lib/duplicates";
import { judgeModality, type WaveObservation } from "@/lib/modality";

export const UNPUBLISHED_ATTESTATION =
  "This wave has never been posted on any social network or platform.";

export const ATTESTATION_REQUIRED =
  "Tick the box to confirm this wave has never been posted on any social network or platform.";

export type ReviewStatusName = "CLEAR" | "PENDING_REVIEW";
export type ModalityCheckName = "FIT" | "UNCERTAIN" | "UNAVAILABLE";

export type SubmissionDecision =
  | { ok: false; error: string }
  | {
      ok: true;
      reviewStatus: ReviewStatusName;
      modalityCheck: ModalityCheckName;
      modalityNote: string;
      contentSha256: string | null;
      frameHashes: string[];
      attestationText: string;
    };

export function attestationGiven(value: FormDataEntryValue | string | null | undefined): boolean {
  return value === "on" || value === "yes" || value === "true";
}

const LINK_NOTE =
  "This link could not be opened as a video file, so it was not checked automatically. It is in, and the desk will review it.";
const SAMPLE_NOTE =
  "We could not sample frames from this video, so a person will check that it is original and in the right title. It is in.";
const NO_VISION_NOTE =
  "The automatic title check is not set up yet. Your wave is in, and the desk will review it.";
const VISION_FAILED_NOTE = "Pending review. The desk will check that this wave fits the title.";

/**
 * Originality, the unpublished attestation, and the title reading.
 * `frameHashes` null means sampling failed. An empty list means there were no frames.
 */
export function decideSubmission(input: {
  attested: boolean;
  themeSlug: string;
  videoUrl: string | null;
  contentSha256: string | null;
  frameHashes: readonly string[] | null;
  readable: boolean;
  known: readonly KnownWave[];
  observation: WaveObservation | null;
  visionConfigured: boolean;
}): SubmissionDecision {
  if (!input.attested) return { ok: false, error: ATTESTATION_REQUIRED };

  const duplicate = findDuplicate({
    contentSha256: input.contentSha256,
    frameHashes: input.frameHashes,
    videoUrl: input.videoUrl,
    known: input.known,
  });
  if (duplicate) return { ok: false, error: DUPLICATE_MESSAGE[duplicate.kind] };

  const base = {
    contentSha256: input.contentSha256,
    frameHashes: input.frameHashes ? [...input.frameHashes] : [],
    attestationText: UNPUBLISHED_ATTESTATION,
  };

  if (!input.readable) {
    return {
      ok: true,
      reviewStatus: "PENDING_REVIEW",
      modalityCheck: "UNAVAILABLE",
      modalityNote: LINK_NOTE,
      ...base,
    };
  }

  if (input.frameHashes == null) {
    return {
      ok: true,
      reviewStatus: "PENDING_REVIEW",
      modalityCheck: "UNAVAILABLE",
      modalityNote: SAMPLE_NOTE,
      ...base,
    };
  }

  if (!input.visionConfigured) {
    return {
      ok: true,
      reviewStatus: "PENDING_REVIEW",
      modalityCheck: "UNAVAILABLE",
      modalityNote: NO_VISION_NOTE,
      ...base,
    };
  }

  if (!input.observation) {
    return {
      ok: true,
      reviewStatus: "PENDING_REVIEW",
      modalityCheck: "UNCERTAIN",
      modalityNote: VISION_FAILED_NOTE,
      ...base,
    };
  }

  const modality = judgeModality(input.themeSlug, input.observation);
  if (modality.outcome === "unfit") return { ok: false, error: modality.note };
  if (modality.outcome === "uncertain") {
    return {
      ok: true,
      reviewStatus: "PENDING_REVIEW",
      modalityCheck: "UNCERTAIN",
      modalityNote: modality.note,
      ...base,
    };
  }
  return {
    ok: true,
    reviewStatus: "CLEAR",
    modalityCheck: "FIT",
    modalityNote: modality.note,
    ...base,
  };
}

export function submissionStatus(entry: {
  reviewStatus: ReviewStatusName;
  modalityCheck: ModalityCheckName | null;
  modalityNote: string;
  contentSha256: string | null;
}): { label: string; note: string } {
  if (entry.reviewStatus === "PENDING_REVIEW") {
    const raw = entry.modalityNote.trim();
    const stale = raw.length === 0 || /title check did not finish/i.test(raw);
    return {
      label: "Pending review",
      note: stale ? "Pending review. The desk will check that this wave fits the title." : raw,
    };
  }
  if (entry.modalityCheck == null && entry.contentSha256 == null) {
    return { label: "Entered", note: "" };
  }
  return { label: "Checked", note: entry.modalityNote };
}
