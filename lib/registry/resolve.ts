/**
 * The resolver: registry → build plan.
 *
 * Deliberately shared by the admin panel, the build script and the projects
 * page. "What *will* be in the build?" and "what *is* in the build?" must never
 * be two different code paths — that divergence is how a dashboard starts
 * lying.
 *
 * Nothing here executes anything. It answers, for each project: will it be
 * listed, will it be built, and if not, why not — in words a person can act on.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Project, Registry } from "./schema.ts";

export type Verdict = {
  slug: string;
  title: string;
  status: Project["status"];
  /** Appears on the public projects page. */
  listed: boolean;
  /** A sub-app build runs for it and its output is copied into the site. */
  built: boolean;
  /** Why it is not built, in the words the admin panel shows. */
  reason: string | null;
  /** Set when the project is `published` but cannot be: the build must abort. */
  fatal: string | null;
};

export type PlannedApp = {
  slug: string;
  title: string;
  /** Absolute path to the project. */
  dir: string;
  /** The build command, already split for `spawn` — no shell is ever involved. */
  argv: string[];
  /** Absolute path to the directory the project's build writes. */
  outDir: string;
  /** Absolute path inside `out/` this project is copied to. */
  target: string;
  /** The site-relative URL it will answer on, trailing slash included. */
  url: string;
  /** Environment for the child build. Secrets never appear here. */
  env: Record<string, string>;
};

export type Plan = {
  siteUrl: string;
  basePath: string;
  /** Absolute `out/`. */
  out: string;
  apps: PlannedApp[];
  verdicts: Verdict[];
  /** Fatal problems, collected rather than thrown so the panel can show them all. */
  problems: string[];
};

export type ResolveOptions = {
  registry: Registry;
  /** Repo root. */
  root: string;
  /** Origin plus base path, e.g. `https://you.github.io`. */
  siteUrl: string;
  /** `""` for a user site, `/repo` for a project site. */
  basePath?: string;
  /** Build only these slugs (`--only`). Everything else is skipped, not failed. */
  only?: string[] | null;
  /** Build no sub-apps at all (`--skip-apps`). */
  skipApps?: boolean;
  /** Injected for tests. */
  exists?: (file: string) => boolean;
  /** Injected for tests. Returns a project's `package.json` scripts. */
  scriptsOf?: (dir: string) => Record<string, string>;
};

function defaultScriptsOf(dir: string): Record<string, string> {
  try {
    return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).scripts ?? {};
  } catch {
    return {};
  }
}

/** `{{siteUrl}}` and `{{basePath}}` in `deploy.env`, filled at plan time. */
export function interpolate(
  value: string,
  vars: { siteUrl: string; basePath: string; slug: string },
): string {
  return value
    .replaceAll("{{siteUrl}}", vars.siteUrl)
    .replaceAll("{{basePath}}", vars.basePath)
    .replaceAll("{{slug}}", vars.slug);
}

/**
 * Where a project's `source.dir` is allowed to point.
 *
 * Anything under the parent folder — the sibling layout this whole design is
 * built on. A `dir` of `../../..` or an absolute path outside it is a config
 * mistake at best, and the build spawns commands in that directory, so it is
 * refused rather than normalised.
 */
export function resolveSourceDir(root: string, dir: string): { path: string; error: string | null } {
  const parent = path.dirname(path.resolve(root));
  const full = path.resolve(root, dir);
  const inside = full === parent || full.startsWith(`${parent}${path.sep}`);
  if (!inside) return { path: full, error: `source.dir escapes ${parent}` };
  if (full === path.resolve(root)) return { path: full, error: "source.dir points at this repo" };
  return { path: full, error: null };
}

export function resolvePlan(options: ResolveOptions): Plan {
  const {
    registry,
    root,
    siteUrl,
    basePath = "",
    only = null,
    skipApps = false,
    exists = existsSync,
    scriptsOf = defaultScriptsOf,
  } = options;

  const out = path.resolve(root, "out");
  const apps: PlannedApp[] = [];
  const verdicts: Verdict[] = [];
  const problems: string[] = [];
  const claimed = new Map<string, string>();

  for (const project of [...registry.projects].sort(byOrder)) {
    const listed = project.status === "published";
    const verdict: Verdict = {
      slug: project.slug,
      title: project.title,
      status: project.status,
      listed,
      built: false,
      reason: null,
      fatal: null,
    };
    verdicts.push(verdict);

    // Reasons that are simply "this is not a thing we build", in the order a
    // person would ask them.
    if (project.status !== "published") {
      verdict.reason = project.status;
    } else if (project.deploy.mode !== "subpath") {
      verdict.reason = project.deploy.mode === "external" ? "hosted externally" : "not deployed";
    }

    if (project.deploy.mode !== "subpath") continue;

    const source = resolveSourceDir(root, project.source.dir);
    const deploy = project.deploy;

    // Everything below is a real problem, and it is fatal only when the project
    // claims to be published — a draft with a missing folder is just a draft.
    const blocked =
      source.error ??
      (!exists(source.path) ? `source directory ${project.source.dir} is missing` : null) ??
      (!deploy.basePathEnv
        ? "does not read a base path from the environment — its assets would 404 under /apps/"
        : null) ??
      missingScript(deploy.buildCommand, scriptsOf, source.path, exists);

    if (blocked) {
      verdict.reason = verdict.reason ?? blocked;
      if (project.status === "published") {
        verdict.fatal = blocked;
        problems.push(`${project.slug}: ${blocked}`);
      }
      continue;
    }

    const previous = claimed.get(deploy.path);
    if (previous) {
      const clash = `${deploy.path} is already taken by ${previous}`;
      verdict.reason = clash;
      verdict.fatal = clash;
      problems.push(`${project.slug}: ${clash}`);
      continue;
    }
    claimed.set(deploy.path, project.slug);

    if (verdict.reason) continue; // not published — nothing more to plan
    if (skipApps) {
      verdict.reason = "skipped (--skip-apps)";
      continue;
    }
    if (only && !only.includes(project.slug)) {
      verdict.reason = "skipped (--only)";
      continue;
    }

    const url = `${basePath}/${deploy.path}/`;
    const vars = { siteUrl, basePath, slug: project.slug };
    verdict.built = true;
    apps.push({
      slug: project.slug,
      title: project.title,
      dir: source.path,
      argv: deploy.buildCommand.split(/\s+/).filter(Boolean),
      outDir: path.resolve(source.path, deploy.outDir),
      target: path.join(out, deploy.path),
      url,
      env: {
        // Derived, never typed by hand — see §12.2. Hand-writing these into each
        // project's own .env is exactly how they drift.
        [deploy.basePathEnv!]: `${basePath}/${deploy.path}`,
        ...Object.fromEntries(
          Object.entries(deploy.env).map(([key, value]) => [key, interpolate(value, vars)]),
        ),
      },
    });
  }

  return { siteUrl, basePath, out, apps, verdicts, problems };
}

/**
 * `npm run build` needs a `build` script to exist. Checking here turns a
 * confusing child-process failure four minutes into a build into a sentence in
 * the dashboard before it starts.
 */
function missingScript(
  command: string,
  scriptsOf: (dir: string) => Record<string, string>,
  dir: string,
  exists: (file: string) => boolean,
): string | null {
  const match = command.trim().match(/^npm\s+run\s+([\w:.-]+)/);
  if (!match) return null;
  if (!exists(path.join(dir, "package.json"))) return "no package.json";
  return scriptsOf(dir)[match[1]] ? null : `no "${match[1]}" script in package.json`;
}

/** Registry order, then title. The published list and the dashboard share it. */
export function byOrder(a: Project, b: Project): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

/** The projects the public site shows. */
export function listedProjects(registry: Registry): Project[] {
  return registry.projects.filter((p) => p.status === "published").sort(byOrder);
}

/**
 * Where a project's card should link for "Open".
 *
 * Must be rendered as a plain `<a href>`: a sub-path app is a separate HTML
 * tree this app's router knows nothing about, and `next/link` would prefetch
 * and client-navigate straight into a 404 (§4).
 */
export function openUrl(project: Project, basePath = ""): string | null {
  if (project.deploy.mode === "subpath") return `${basePath}/${project.deploy.path}/`;
  return project.links.live ?? project.links.itch ?? project.links.npm ?? null;
}
