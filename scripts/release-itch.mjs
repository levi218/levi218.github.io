#!/usr/bin/env node
/**
 * itch.io releases, through butler.
 *
 * itch.io has no public write API for uploads; butler is the supported tool, so
 * this is a wrapper rather than a client. The credential is handed to it as
 * `BUTLER_API_KEY` in the child's environment — never in argv, which any process
 * on the machine can read.
 *
 * The game *page* — creating it, "playable in browser", cover art, pricing — is
 * a one-time manual step on itch.io that no API covers. The panel deep-links to
 * the edit page for exactly that reason.
 *
 *   node scripts/release-itch.mjs status <slug>
 *   node scripts/release-itch.mjs push <slug> --confirm "publish <slug>@<version>"
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { ROOT, readRegistry } from "../lib/registry/load.ts";
import { resolveSourceDir } from "../lib/registry/resolve.ts";
import { loadEnv } from "./lib/credentials.mjs";
import { butler } from "./lib/credentials/itch.mjs";
import { run, which } from "./lib/exec.mjs";

/** Find the project and its itch configuration, or explain what is missing. */
function target(slug) {
  const project = readRegistry().projects.find((entry) => entry.slug === slug);
  if (!project) throw new Error(`no project "${slug}" in the registry`);
  const release = project.release.itch;
  if (!release) throw new Error(`${slug} has no release.itch configuration`);

  const source = resolveSourceDir(ROOT, project.source.dir);
  if (source.error) throw new Error(`${slug}: ${source.error}`);

  let version = null;
  try {
    version = JSON.parse(readFileSync(path.join(source.path, "package.json"), "utf8")).version;
  } catch {
    // A project without a package.json can still be pushed; itch just gets no
    // user version, which is a worse changelog, not a failure.
  }

  return {
    project,
    release,
    dir: source.path,
    /** What butler uploads: the game's own build output. */
    uploadDir: path.resolve(source.path, release.dir),
    version,
    channel: `${release.target}:${release.channel}`,
  };
}

/**
 * The string the caller has to echo back before anything irreversible happens.
 * Re-derived here and compared server-side, so a stale panel cannot publish a
 * version the person never saw.
 */
export function confirmationFor(slug) {
  const { version } = target(slug);
  return `publish ${slug}@${version ?? "unversioned"}`;
}

export async function itchStatus(slug) {
  loadEnv();
  const { release, version, channel, uploadDir } = target(slug);
  const installed = await which("butler", "-V");

  const base = {
    slug,
    target: release.target,
    channel: release.channel,
    localVersion: version,
    uploadDir,
    installed,
    /** A channel name containing "html" is what makes itch play it in-browser. */
    playableInBrowser: /html/i.test(release.channel),
    editUrl: `https://itch.io/game/edit/${release.target.split("/")[1]}`,
    confirmation: `publish ${slug}@${version ?? "unversioned"}`,
    remote: null,
    detail: null,
  };

  if (!installed) {
    return { ...base, detail: "butler is not installed — `brew install butler`" };
  }
  const result = await butler(["status", channel], { allowFailure: true });
  return result.code === 0
    ? { ...base, remote: result.stdout }
    : { ...base, detail: result.stderr || `butler status exited ${result.code}` };
}

/**
 * Build (when the registry says how) and push.
 *
 * Irreversible: an itch.io channel serves the newest build immediately. Hence
 * the confirmation string, checked before butler is ever spawned.
 */
export async function itchPush(slug, { confirm, onLine } = {}) {
  loadEnv();
  const { release, dir, uploadDir, version, channel } = target(slug);

  const expected = `publish ${slug}@${version ?? "unversioned"}`;
  if (confirm !== expected) {
    throw new Error(`confirmation must be exactly: ${expected}`);
  }
  if (!(await which("butler", "-V"))) {
    throw new Error("butler is not installed — `brew install butler`, then `butler login`");
  }

  if (release.buildCommand) {
    const argv = release.buildCommand.split(/\s+/).filter(Boolean);
    onLine?.(`$ ${release.buildCommand}`);
    const build = await run(argv[0], argv.slice(1), { cwd: dir, onLine, allowFailure: true });
    if (build.code !== 0) throw new Error(`${release.buildCommand} exited ${build.code}`);
  }

  const args = ["push", uploadDir, channel];
  if (version) args.push("--userversion", version);
  onLine?.(`$ butler ${args.join(" ")}`);
  const push = await butler(args, { onLine, allowFailure: true });
  if (push.code !== 0) throw new Error(push.stderr || `butler push exited ${push.code}`);

  return itchStatus(slug);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (import.meta.filename === process.argv[1]) {
  const [command, slug] = process.argv.slice(2);
  const confirm = process.argv[process.argv.indexOf("--confirm") + 1];
  try {
    if (command === "status") {
      console.log(JSON.stringify(await itchStatus(slug), null, 2));
    } else if (command === "push") {
      await itchPush(slug, { confirm, onLine: (line) => console.log(`  ${line}`) });
      console.log(`\n  Pushed ${slug}. itch takes a minute to process the build.\n`);
    } else {
      console.error("usage: release-itch.mjs status|push <slug> [--confirm <string>]");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`\n  ${error.message}\n`);
    process.exitCode = 1;
  }
}
