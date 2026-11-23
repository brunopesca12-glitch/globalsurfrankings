"use server";

import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SEASON_2027, themeBySlug } from "@/lib/catalogue";
import { categoryFor } from "@/lib/category";
import { prisma } from "@/lib/db";
import { decideEntry, ENTRY_REJECTION, parseVideoUrl } from "@/lib/entry-rules";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { isoWeek } from "@/lib/iso-week";
import { attestationGiven, decideSubmission } from "@/lib/submission-check";
import { dutyIsCurrent } from "@/lib/tribunal";
import { FrameSampleError, sampleFrames } from "@/lib/video-frames";
import { waveVisionFromEnv } from "@/lib/vision";
import {
  acceptedUpload,
  fetchVideo,
  isVercelBlobUrl,
  looksLikeVideoContainer,
  MAX_VIDEO_BYTES,
  mimeForUpload,
  sha256Hex,
} from "@/lib/video-bytes";

export const maxDuration = 60;

export type EntryState = { error: string | null };

const TOO_BIG = "That video is too large. Keep it under 64 MB.";
const BAD_TYPE = "Use an MP4, WebM, or MOV file.";
const UNREADABLE = "We could not read that video. Export it as an MP4 and try again.";
const NEED_VIDEO = "Add a video file, or paste a link to one.";
const PLACEHOLDER_URL = "https://upload.gsr.surf/wave.mp4";

type Intake =
  | { readable: true; bytes: Uint8Array; mime: string; sourceUrl: string | null; blobUrl: string | null }
  | { readable: false; bytes: null; mime: null; sourceUrl: string; blobUrl: null };

async function readIntake(formData: FormData): Promise<{ error: string } | Intake> {
  const file = formData.get("video");
  const blobUrl = String(formData.get("blobUrl") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_VIDEO_BYTES) return { error: TOO_BIG };
    if (!acceptedUpload(file.type, file.name)) return { error: BAD_TYPE };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!looksLikeVideoContainer(bytes)) return { error: UNREADABLE };
    return { readable: true, bytes, mime: mimeForUpload(file.type, file.name), sourceUrl: null, blobUrl: null };
  }

  if (blobUrl) {
    if (!isVercelBlobUrl(blobUrl)) return { error: "That upload link is not valid. Try the file again." };
    const fetched = await fetchVideo(blobUrl);
    if (fetched.kind === "too-big") return { error: TOO_BIG };
    if (fetched.kind !== "file") return { error: UNREADABLE };
    return { readable: true, bytes: fetched.bytes, mime: fetched.mime, sourceUrl: fetched.finalUrl, blobUrl };
  }

  if (videoUrl) {
    const canonical = parseVideoUrl(videoUrl);
    if (!canonical) return { error: ENTRY_REJECTION.VIDEO };
    const fetched = await fetchVideo(canonical);
    if (fetched.kind === "blocked") return { error: "That link cannot be used. Upload the file, or paste a public link to the video." };
    if (fetched.kind === "too-big") return { error: TOO_BIG };
    if (fetched.kind === "failed") return { error: "We could not open that link. Try the file itself." };
    if (fetched.kind === "unreadable") {
      return { error: "That link did not download a video file. Upload the file, or paste a link that ends in .mp4." };
    }
    if (fetched.kind === "page") {
      return { readable: false, bytes: null, mime: null, sourceUrl: fetched.finalUrl, blobUrl: null };
    }
    return { readable: true, bytes: fetched.bytes, mime: fetched.mime, sourceUrl: fetched.finalUrl, blobUrl: null };
  }

  return { error: NEED_VIDEO };
}

async function discardBlob(url: string | null) {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url).catch(() => undefined);
}

export async function submitEntry(_prev: EntryState, formData: FormData): Promise<EntryState> {
  const session = await auth();
  if (!session?.user) return { error: "Sign in to enter a wave." };

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return { error: "The house does not compete in its own rankings." };

  const season = await prisma.season.findUnique({
    where: { vintage: SEASON_2027.vintage },
    include: { themes: true },
  });
  if (!season) return { error: "Season 2027 is not in the database yet. Run the seed." };

  const theme = season.themes.find((item) => item.slug === String(formData.get("theme") ?? ""));
  const catalogue = theme ? themeBySlug(theme.slug) : undefined;
  if (!theme || !catalogue) return { error: "Choose an event from the season." };
  if (!attestationGiven(formData.get("unpublished"))) {
    return { error: "Tick the box to confirm this wave has never been posted on any social network or platform." };
  }

  const environment = formData.get("environment") === "POOL" ? "POOL" : "OCEAN";
  const spot = String(formData.get("spot") ?? "").trim().slice(0, 80);
  const category = categoryFor(athlete.birthDate, season.ageAsOf);
  const now = new Date();
  const week = isoWeek(now);
  const existing = await prisma.entry.findMany({
    where: { athleteId: athlete.id, environment: "OCEAN", isoYear: week.isoYear, isoWeek: week.isoWeek },
    select: { isoYear: true, isoWeek: true },
  });
  const queue = await ensureWeeklyQueue(session.user.id);
  const videoField = String(formData.get("videoUrl") ?? "").trim();
  const hasFile = formData.get("video") instanceof File && (formData.get("video") as File).size > 0;
  const hasBlob = String(formData.get("blobUrl") ?? "").trim().length > 0;
  const decision = decideEntry({
    dutyCurrent: dutyIsCurrent(queue.pending),
    environment,
    theme: catalogue,
    category,
    existingOceanWeeks: existing,
    isoYear: week.isoYear,
    isoWeek: week.isoWeek,
    today: now.toISOString().slice(0, 10),
    videoUrl: hasFile || hasBlob ? PLACEHOLDER_URL : videoField,
  });
  if (!decision.ok) return { error: ENTRY_REJECTION[decision.code] };

  const intake = await readIntake(formData);
  if ("error" in intake) return intake;

  let frameHashes: string[] | null = intake.readable ? [] : null;
  let jpegs: Buffer[] = [];
  if (intake.readable) {
    try {
      const sampled = await sampleFrames(intake.bytes);
      frameHashes = sampled.hashes;
      jpegs = sampled.jpegs;
    } catch (error) {
      if (error instanceof FrameSampleError && error.reason === "missing-ffmpeg") {
        frameHashes = null;
      } else {
        await discardBlob(intake.blobUrl);
        return { error: UNREADABLE };
      }
    }
  }

  const vision = waveVisionFromEnv(process.env);
  let observation = null;
  if (vision && jpegs.length > 0) {
    observation = await vision.classify(jpegs.map((bytes) => ({ mimeType: "image/jpeg" as const, bytes })));
  }

  let rejection: string | null = null;
  try {
    rejection = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('gsr-submission-originality'))`;
        const known = await tx.entry.findMany({
          select: { contentSha256: true, frameHashes: true, videoUrl: true },
        });
        const checked = decideSubmission({
          attested: true,
          themeSlug: theme.slug,
          videoUrl: intake.sourceUrl,
          contentSha256: intake.readable ? sha256Hex(intake.bytes) : null,
          frameHashes,
          readable: intake.readable,
          known,
          observation,
          visionConfigured: vision != null,
        });
        if (!checked.ok) return checked.error;
        const created = await tx.entry.create({
          data: {
            athleteId: athlete.id,
            themeId: theme.id,
            seasonId: season.id,
            environment,
            videoUrl: intake.sourceUrl ?? PLACEHOLDER_URL,
            spot: spot || null,
            isoYear: week.isoYear,
            isoWeek: week.isoWeek,
            tollCents: decision.tollCents,
            status: "SUBMITTED",
            category,
            sex: athlete.sex,
            contentSha256: checked.contentSha256,
            frameHashes: checked.frameHashes,
            unpublishedAttested: true,
            attestationText: checked.attestationText,
            reviewStatus: checked.reviewStatus,
            modalityCheck: checked.modalityCheck,
            modalityNote: checked.modalityNote,
          },
        });
        if (intake.readable && !intake.sourceUrl) {
          await tx.entryMedia.create({
            data: { entryId: created.id, mimeType: intake.mime, bytes: Buffer.from(intake.bytes) },
          });
          await tx.entry.update({
            where: { id: created.id },
            data: { videoUrl: `/media/entries/${created.id}` },
          });
        }
        return null;
      },
      { timeout: 20_000 },
    );
  } catch (error) {
    await discardBlob(intake.blobUrl);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "This video is already in Global Surf Rankings. The same wave cannot be entered twice." };
    }
    throw error;
  }
  if (rejection) {
    await discardBlob(intake.blobUrl);
    return { error: rejection };
  }

  revalidatePath("/my-waves");
  revalidatePath(`/board/${theme.slug}`);
  revalidatePath("/ranking");
  revalidatePath("/videos");
  revalidatePath("/admin/review");
  redirect("/my-waves");
}
