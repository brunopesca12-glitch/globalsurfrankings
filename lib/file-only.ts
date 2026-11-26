const SOCIAL_HOSTS = [
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "instagram.com",
  "instagr.am",
  "tiktok.com",
  "vm.tiktok.com",
  "facebook.com",
  "fb.watch",
  "vimeo.com",
  "player.vimeo.com",
];

export const FILE_ONLY_MESSAGE =
  "Upload the video file from the camera. YouTube, Instagram, and other links are not accepted. The footage has to be unpublished and from this season.";

export function isSocialLink(raw: string): boolean {
  try {
    const host = new URL(raw.trim()).hostname.replace(/^www\./, "").toLowerCase();
    return SOCIAL_HOSTS.some((name) => host === name || host.endsWith(`.${name}`));
  } catch {
    return false;
  }
}

/** True when the visitor pasted any link instead of uploading a file. */
export function rejectsPastedLink(raw: string): boolean {
  return raw.trim().length > 0;
}
