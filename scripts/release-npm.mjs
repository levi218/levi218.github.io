#!/usr/bin/env node
/**
 * npm releases.
 *
 * A thin wrapper: npm already knows how to publish. What this adds is the
 * status comparison the panel shows, a confirmation string checked before the
 * irreversible step, and authentication through a throwaway userconfig so
 * `~/.npmrc` is never read or written (see `lib/credentials/npm.mjs`).
 *
 * Taking a package down is `npm deprecate`, not unpublish: npm forbids
 * unpublishing after 72 hours, and pretending otherwise would put a button in
 * the panel that fails for everyone whose package is a week old.
 *
 *   node scripts/release-npm.mjs status <slug>
 *   node scripts/release-npm.mjs publish <slug> --confirm "publish <slug>@<version>"
 *   node scripts/release-npm.mjs deprecate <slug> --message "..."
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { ROOT, readRegistry } from "../lib/registry/load.ts";
import { resolveSourceDir } from "../lib/registry/resolve.ts";
import { loadEnv } from "./lib/credentials.mjs";
import { REGISTRY, npm } from "./lib/credentials/npm.mjs";

function target(slug) {
  const project = readRegistry().projects.find((entry) => entry.slug === slug);
  if (!project) throw new Error(`no project "${slug}" in the registry`);
  const release = project.release.npm;
  if (!release) throw new Error(`${slug} has no release.npm configuration`);

  const source = resolveSourceDir(ROOT, project.source.dir);
  if (source.error) throw new Error(`${slug}: ${source.error}`);

  let version = null;
  try {
    version = JSON.parse(readFileSync(path.join(source.path, "package.json"), "utf8")).version;
  } catch {
    throw new Error(`${slug}: no readable package.json in ${project.source.dir}`);
  }

  return { project, release, dir: source.path, version };
}

export function confirmationFor(slug) {
  const { version } = target(slug);
  return `publish ${slug}@${version}`;
}

export async function npmStatus(slug) {
  loadEnv();
  const { release, dir, version } = target(slug);

  const view = await npm(
    ["view", release.package, "versions", "dist-tags", "--json", "--registry", `https://${REGISTRY}/`],
    { allowFailure: true },
  );
  // A package that has never been published answers 404, which is a state, not
  // an error — it is the normal case for a first release.
  const published = view.code === 0 ? safeJson(view.stdout) : null;
  const versions = toArray(published?.versions);

  const pack = await npm(["pack", "--dry-run", "--json"], { cwd: dir, allowFailure: true });
  const files = safeJson(pack.stdout)?.[0];

  return {
    slug,
    package: release.package,
    access: release.access,
    localVersion: version,
    publishedVersions: versions,
    distTags: published?.["dist-tags"] ?? null,
    /** The one thing the button needs to know. */
    alreadyPublished: versions.includes(version),
    confirmation: `publish ${slug}@${version}`,
    pack: files
      ? {
          size: files.size ?? null,
          entries: (files.files ?? []).map((file) => file.path),
        }
      : null,
    detail: view.code === 0 ? null : firstNpmError(view.stderr),
  };
}

export async function npmPublish(slug, { confirm, onLine } = {}) {
  loadEnv();
  const { release, dir, version } = target(slug);

  const expected = `publish ${slug}@${version}`;
  if (confirm !== expected) throw new Error(`confirmation must be exactly: ${expected}`);

  const status = await npmStatus(slug);
  if (status.alreadyPublished) {
    throw new Error(`${release.package}@${version} is already published — bump the version first`);
  }

  onLine?.(`$ npm publish --access ${release.access}`);
  const result = await npm(["publish", "--access", release.access], {
    cwd: dir,
    onLine,
    allowFailure: true,
  });
  if (result.code !== 0) throw new Error(firstNpmError(result.stderr) ?? `npm publish exited ${result.code}`);

  return npmStatus(slug);
}

/** The takedown that actually works. Leaves the version installable, and warned. */
export async function npmDeprecate(slug, { message, range, onLine } = {}) {
  loadEnv();
  const { release, version } = target(slug);
  if (!message) throw new Error("a deprecation message is required — it is what users will see");

  const spec = `${release.package}@${range ?? version}`;
  onLine?.(`$ npm deprecate ${spec}`);
  const result = await npm(["deprecate", spec, message], { onLine, allowFailure: true });
  if (result.code !== 0) throw new Error(firstNpmError(result.stderr) ?? `npm deprecate exited ${result.code}`);
  return npmStatus(slug);
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** `npm view pkg versions` returns a string when there is exactly one. */
function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** npm's stderr is mostly log-file advice; the first `npm error` line is the reason. */
function firstNpmError(stderr) {
  return stderr?.split("\n").find((line) => line.includes("npm error"))?.trim() ?? null;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (import.meta.filename === process.argv[1]) {
  const [command, slug] = process.argv.slice(2);
  const flag = (name) => process.argv[process.argv.indexOf(`--${name}`) + 1];
  try {
    if (command === "status") {
      console.log(JSON.stringify(await npmStatus(slug), null, 2));
    } else if (command === "publish") {
      await npmPublish(slug, { confirm: flag("confirm"), onLine: (line) => console.log(`  ${line}`) });
      console.log(`\n  Published ${slug}.\n`);
    } else if (command === "deprecate") {
      await npmDeprecate(slug, {
        message: flag("message"),
        range: flag("range"),
        onLine: (line) => console.log(`  ${line}`),
      });
      console.log(`\n  Deprecated ${slug}.\n`);
    } else {
      console.error("usage: release-npm.mjs status|publish|deprecate <slug> [--confirm|--message ...]");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`\n  ${error.message}\n`);
    process.exitCode = 1;
  }
}
