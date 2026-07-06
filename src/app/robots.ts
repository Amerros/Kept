import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private app surface + API; public pages (/, /invoice-generator,
        // /p/<key>, auth) stay crawlable.
        disallow: ["/dashboard", "/api/"],
      },
    ],
    sitemap: "https://www.rkept.com/sitemap.xml",
  };
}
