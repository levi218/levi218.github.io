/**
 * Turning something discovery found into a registry entry.
 *
 * Always `draft`. Adoption fills in the tedious parts — title, blurb, build
 * command, output directory, the base-path variable — and then a person decides
 * whether any of it is true. Nothing is ever published by accident.
 */

import type { DiscoveredProject } from "./discovery-types.ts";
import type { Project, Registry, Tag } from "./schema.ts";
import { RESERVED_SLUGS, TAGS } from "./schema.ts";

/**
 * The tags a discovered project suggests for itself: its own hints, filtered to
 * the closed vocabulary, plus a guess when it offers none.
 */
export function suggestedTags(project: DiscoveredProject): Tag[] {
  const fromHints = (project.hints?.tags ?? []).filter((tag) =>
    (TAGS as readonly string[]).includes(tag),
  );
  if (fromHints.length) return fromHints;
  const haystack = `${project.name} ${project.description} ${Object.keys(project.scripts).join(" ")}`;
  if (/three|phaser|game/i.test(haystack)) return ["game"];
  return project.framework === "unknown" ? ["library"] : ["app"];
}

/** Where each toolchain writes its static export. */
const OUT_DIRS: Record<DiscoveredProject["framework"], string> = {
  next: "out",
  vite: "dist",
  astro: "dist",
  node: "dist",
  unknown: "dist",
};

/** `git@github.com:user/repo.git` and `https://…` both become a browsable URL. */
export function repoUrl(remote: string | null): string | null {
  if (!remote) return null;
  const ssh = remote.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  if (remote.startsWith("http")) return remote.replace(/\.git$/, "");
  return null;
}

/** Kebab-case, not reserved, not already taken. */
export function uniqueSlug(candidate: string, registry: Registry): string {
  const base =
    candidate
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";
  const taken = new Set([...registry.projects.map((p) => p.slug), ...RESERVED_SLUGS]);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/**
 * A pre-filled draft entry.
 *
 * `deploy.mode` is the interesting decision: a project can only be hosted under
 * `/apps/<slug>/` if it exports statically *and* reads its sub-path from the
 * environment. Without both, its assets would resolve against the domain root
 * and the page would load blank — so it is adopted as `none` and the dashboard
 * says why, rather than being adopted as broken.
 */
export function adopt(found: DiscoveredProject, registry: Registry): Project {
  const slug = uniqueSlug(found.slug, registry);
  const hostable = found.canStaticExport && found.supportsBasePath && Boolean(found.scripts.build);
  const order = Math.max(0, ...registry.projects.map((project) => project.order)) + 10;

  const itch = found.hints?.itch;
  const npm = found.hints?.npm;

  return {
    slug,
    status: "draft",
    order,
    title: found.hints?.title ?? found.readme.title ?? found.name ?? slug,
    blurb:
      found.hints?.blurb ??
      found.readme.blurb ??
      found.description ??
      "No description yet — write one before publishing.",
    tags: suggestedTags(found),
    aiAssisted: null,
    source: {
      dir: found.dir,
      repo: repoUrl(found.git.remote),
      ref: found.git.branch ?? "main",
    },
    deploy: hostable
      ? {
          mode: "subpath",
          path: `apps/${slug}`,
          buildCommand: "npm run build",
          outDir: OUT_DIRS[found.framework],
          basePathEnv: found.basePathEnv,
          env: { NEXT_PUBLIC_SITE_URL: `{{siteUrl}}/apps/${slug}` },
        }
      : { mode: "none" },
    links: {},
    release: {
      itch: itch?.target
        ? { target: itch.target, channel: itch.channel ?? "html5", dir: itch.dir ?? "out", buildCommand: null }
        : null,
      npm: npm?.package ? { package: npm.package, access: npm.access ?? "public" } : null,
    },
    cover: found.hints?.cover ?? null,
  };
}

/** Everything discovery found that no registry entry already points at. */
export function unadopted(found: DiscoveredProject[], registry: Registry): DiscoveredProject[] {
  // Matched by directory rather than slug: a registry entry may have been
  // renamed (`goo` is adopted as `amalgam`) and must not resurface as new.
  const claimed = new Set(registry.projects.map((project) => normalize(project.source.dir)));
  return found.filter((project) => !claimed.has(normalize(project.dir)));
}

function normalize(dir: string): string {
  return dir.replace(/^\.\//, "").replace(/\/+$/, "");
}
