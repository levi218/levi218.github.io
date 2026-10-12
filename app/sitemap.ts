import type { MetadataRoute } from "next";

import { readPosts } from "@/lib/posts";
import { readRegistry } from "@/lib/registry/load.ts";
import { listedProjects } from "@/lib/registry/resolve.ts";
import { canonical } from "@/lib/site";

/**
 * The pages this app owns, plus the entry point of each hosted sub-app.
 *
 * A sub-app is a separate site with its own sitemap; naming its root here is
 * what connects the two for a crawler that only ever sees this one.
 */
// A metadata route is a route handler underneath; a static export needs to be
// told it is one that never changes.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const projects = listedProjects(readRegistry());
  const now = new Date();

  return [
    { url: canonical("/"), lastModified: now, priority: 1 },
    { url: canonical("/projects"), lastModified: now, priority: 0.8 },
    { url: canonical("/about"), lastModified: now, priority: 0.5 },
    { url: canonical("/tags"), lastModified: now, priority: 0.3 },
    ...readPosts().map((post) => ({
      url: canonical(`/posts/${post.slug}`),
      lastModified: new Date(post.date),
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      url: canonical(`/projects/${project.slug}`),
      lastModified: now,
      priority: 0.6,
    })),
    ...projects
      .filter((project) => project.deploy.mode === "subpath")
      .map((project) => ({
        url: canonical(`/${(project.deploy as { path: string }).path}`),
        lastModified: now,
        priority: 0.7,
      })),
  ];
}
