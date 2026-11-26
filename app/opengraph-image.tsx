import { ImageResponse } from "next/og";

export const alt = "GSR — Global Surf Rankings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0d3a48",
          color: "#f4efe6",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6 }}>GLOBAL SURF RANKINGS</div>
        <div style={{ display: "flex", fontSize: 84, marginTop: 18 }}>The best wave wins.</div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 28, color: "#e6d3b0" }}>gsr.surf</div>
      </div>
    ),
    { ...size },
  );
}
