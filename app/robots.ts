import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/enter", "/my-waves", "/profile", "/judge", "/invite"],
    },
    sitemap: "https://gsr.surf/sitemap.xml",
  };
}
