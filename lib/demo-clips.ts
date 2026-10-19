/** Same-origin stand-ins for the broken video.gsr.surf host. Distinct colors, no athlete identity. */
export const DEMO_CLIPS = ["ocean.mp4", "sand.mp4", "foam.mp4", "gold.mp4"] as const;

export function isUnplayableHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "video.gsr.surf";
  } catch {
    return true;
  }
}

function hash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) value = (value * 33 + seed.charCodeAt(i)) >>> 0;
  return value;
}

export function demoClipFor(seed: string): (typeof DEMO_CLIPS)[number] {
  return DEMO_CLIPS[hash(seed) % DEMO_CLIPS.length]!;
}

/** Two sides of one ballot always get different clips. */
export function demoPair(ballotId: string): { drawn: string; board: string } {
  const drawn = demoClipFor(`${ballotId}:drawn`);
  let board = demoClipFor(`${ballotId}:board`);
  if (board === drawn) board = DEMO_CLIPS[(DEMO_CLIPS.indexOf(drawn) + 1) % DEMO_CLIPS.length]!;
  return { drawn: `/demo-waves/${drawn}`, board: `/demo-waves/${board}` };
}
