import type { MetadataRoute } from "next";

import { canonical } from "@/lib/site";

// A metadata route is a route handler underneath; a static export needs to be
// told it is one that never changes.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${canonical("/").replace(/\/$/, "")}/sitemap.xml`,
  };
}
