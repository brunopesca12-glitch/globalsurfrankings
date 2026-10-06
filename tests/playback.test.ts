import { describe, expect, it } from "vitest";
import { playbackFor } from "@/lib/playback";

describe("playback", () => {
  it("plays a file, embeds a known host, and leaves other URLs as links", () => {
    expect(playbackFor("https://cdn.example.com/heat.mp4")).toEqual({ kind: "file" });
    expect(playbackFor("https://www.youtube.com/watch?v=abc123")).toEqual({
      kind: "embed",
      src: "https://www.youtube.com/embed/abc123",
    });
    expect(playbackFor("https://vimeo.com/12345")).toEqual({
      kind: "embed",
      src: "https://player.vimeo.com/video/12345",
    });
    expect(playbackFor("https://video.gsr.surf/demo/best-barrel/01")).toEqual({ kind: "link" });
  });
});