import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const dynamic = "force-static";
export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#101D35", color: "#fff", padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44, fontWeight: 700 }}>
        <svg width="62" height="62" viewBox="0 0 64 64"><path fill="#FFFFFF" d="M6 10H21L33 54H23Z" /><path fill="#39B4A8" d="M43 10H58L42 54L35.5 31Z" /></svg>
        {site.name}
      </div>
      <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>{site.tagline}</div>
    </div>,
    size,
  );
}
