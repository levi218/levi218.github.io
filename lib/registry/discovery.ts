/**
 * Sibling-folder discovery.
 *
 * Scans the folders next to this repo and records what each one is and what it
 * is *capable* of — can it export statically, does it read a base path — so the
 * admin panel can say "this cannot be published, and here is why" instead of
 * letting the build find out.
 *
 * Discovery is disposable: the cache is gitignored and the registry always
 * wins. Precedence when the two disagree is registry > the project's own
 * `homepage.json` > whatever was inferred here.
 *
 * Node-only (`node:fs`). Imported by `scripts/discover.mjs`, the dev-only admin
 * routes and the tests — never by a client component.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import type { Discovery, DiscoveredProject, GitInfo, Hints } from "./discovery-types.ts";

/** Folders that are never projects. */
const SKIP = new Set(["node_modules", "out", "dist", "build", ".git"]);

/** Where a Next config might live. */
const NEXT_CONFIGS = ["next.config.ts", "next.config.mjs", "next.config.js"];

/** Files worth grepping for a base-path variable. Cheap, and enough. */
const SOURCE_GLOB_DEPTH = 3;

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function readText(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/** Which framework, decided by dependencies rather than by file layout. */
export function inferFramework(pkg: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): DiscoveredProject["framework"] {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.next) return "next";
  if (deps.astro) return "astro";
  if (deps.vite) return "vite";
  return Object.keys(deps).length ? "node" : "unknown";
}

/**
 * The first `# heading` and the first real paragraph under it — the default
 * title and blurb for a newly adopted project, so the common case is a review
 * rather than a writing job.
 */
export function readmeSummary(markdown: string): { title: string | null; blurb: string | null } {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  const body = title ? markdown.slice(markdown.indexOf(title) + title.length) : markdown;
  const blurb =
    body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find(
        (block) =>
          block.length > 0 &&
          !block.startsWith("#") &&
          !block.startsWith("!") &&
          !block.startsWith("[!") &&
          !block.startsWith("```") &&
          !block.startsWith("<"),
      )
      ?.replace(/\s+/g, " ") ?? null;
  return { title, blurb: blurb ? plain(blurb) : null };
}

/**
 * A README paragraph is markdown; a blurb is shown as text. Strip the handful
 * of inline marks that would otherwise show up verbatim on a project card.
 */
function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]{1,3}(?=\S)(.*?\S)[*_~`]{1,3}/g, "$1")
    .trim();
}

/** Walk a directory shallowly, yielding files worth grepping. */
function* sourceFiles(dir: string, depth = SOURCE_GLOB_DEPTH): Generator<string> {
  if (depth < 0) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full, depth - 1);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|env|example)$/.test(entry.name)) yield full;
  }
}

/**
 * Does this project read a sub-path from the environment, and under what name?
 *
 * This is the single capability that decides whether a project can be hosted
 * under `/apps/<slug>/` at all: without it every asset URL is absolute against
 * the domain root and the page loads blank.
 */
export function findBasePathEnv(dir: string, hints: Hints | null): string | null {
  if (hints?.basePathEnv) return hints.basePathEnv;
  const pattern = /\b([A-Z][A-Z0-9_]*BASE_PATH|VITE_[A-Z0-9_]*BASE[A-Z0-9_]*)\b/;
  for (const file of sourceFiles(dir)) {
    const match = readText(file).match(pattern);
    if (match) return match[1];
  }
  // A Vite project configures its sub-path with `base:` rather than an env var.
  for (const config of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
    if (existsSync(path.join(dir, config)) && /\bbase\s*:/.test(readText(path.join(dir, config)))) {
      return "BASE_URL";
    }
  }
  return null;
}

function gitInfo(dir: string): GitInfo {
  const gitDir = path.join(dir, ".git");
  if (!existsSync(gitDir)) return { present: false, branch: null, remote: null, dirty: null };
  const head = readText(path.join(gitDir, "HEAD")).trim();
  const branch = head.startsWith("ref: refs/heads/") ? head.slice("ref: refs/heads/".length) : null;
  const config = readText(path.join(gitDir, "config"));
  const remote = config.match(/\[remote "origin"\][^[]*?url\s*=\s*(\S+)/)?.[1] ?? null;
  // Dirtiness needs `git status`; the scanner fills it in.
  return { present: true, branch, remote, dirty: null };
}

/** Read one folder. Returns `null` when it is not a project. */
export function scanProject(dir: string, relativeTo: string): DiscoveredProject | null {
  const pkgFile = path.join(dir, "package.json");
  if (!existsSync(pkgFile)) return null;
  const pkg = readJson<Record<string, never>>(pkgFile) ?? {};
  const hints = readJson<Hints>(path.join(dir, "homepage.json"));

  const nextConfig = NEXT_CONFIGS.map((name) => path.join(dir, name)).find(existsSync);
  const canStaticExport = nextConfig
    ? /output\s*:\s*["']export["']/.test(readText(nextConfig))
    : false;
  const basePathEnv = findBasePathEnv(dir, hints);

  const rel = path.relative(relativeTo, dir);
  return {
    slug: path.basename(dir),
    dir: rel.startsWith(".") ? rel : `./${rel}`,
    name: (pkg as { name?: string }).name ?? null,
    version: (pkg as { version?: string }).version ?? null,
    description: (pkg as { description?: string }).description ?? null,
    scripts: (pkg as { scripts?: Record<string, string> }).scripts ?? {},
    framework: inferFramework(pkg),
    canStaticExport,
    supportsBasePath: basePathEnv !== null,
    basePathEnv,
    git: gitInfo(dir),
    readme: readmeSummary(readText(path.join(dir, "README.md"))),
    hints,
  };
}

/** Scan every sibling of `root`, skipping dotfolders, `node_modules` and itself. */
export function scanSiblings(root: string): DiscoveredProject[] {
  const parent = path.dirname(root);
  const found: DiscoveredProject[] = [];
  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const dir = path.join(parent, entry.name);
    if (path.resolve(dir) === path.resolve(root)) continue;
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
    const project = scanProject(dir, root);
    if (project) found.push(project);
  }
  return found.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * A full scan, working-tree status included.
 *
 * `dirty` is the one field the pure scanner cannot produce — it needs the git
 * index — so it is filled here, synchronously: there are a handful of sibling
 * folders, and both callers (`npm run discover` and the admin route) want the
 * finished object rather than a promise to compose.
 */
export type { Discovery, DiscoveredProject, GitInfo, Hints };

export function refreshDiscovery(root: string): Discovery {
  const projects = scanSiblings(root);
  for (const project of projects) {
    if (!project.git.present) continue;
    try {
      const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: path.resolve(root, project.dir),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      project.git.dirty = status.trim().length > 0;
    } catch {
      // An unreadable repo reports "unknown", the same as no repo at all.
    }
  }
  return { scannedAt: new Date().toISOString(), parent: path.dirname(root), projects };
}

