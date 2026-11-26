import type { MetadataRoute } from "next";
import { THEMES } from "@/lib/catalogue";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "/",
    "/about",
    "/rules",
    "/terms",
    "/privacy",
    "/calendar",
    "/ranking",
    "/videos",
    "/hashboards",
    "/sign-in",
    "/sign-up",
    ...THEMES.map((theme) => `/board/${theme.slug}`),
  ];
  return paths.map((path) => ({
    url: `https://gsr.surf${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/ranking" || path === "/videos" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
