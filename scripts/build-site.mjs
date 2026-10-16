#!/usr/bin/env node
/**
 * `npm run build` — the whole published tree, shell plus every sub-app.
 *
 * This runs locally rather than in CI because the sibling projects live outside
 * this repo and are not all git repos; a GitHub Actions job can only check this
 * one out. §6.3 of the plan is the upgrade path once they have remotes.
 *
 *   --only <slug,slug>   build a subset
 *   --skip-apps          the home page only
 *   --force              ignore the unchanged-source stamps
 *   --allow-partial      a failing app is dropped instead of failing the build
 *   --keep-published     a published app this run does not build (skipped by
 *                        --only / --skip-apps, or its folder is not on this
 *                        machine) is copied unchanged from the live gh-pages
 *                        branch instead of disappearing from the deploy
 *   --dry-run            print the plan, touch nothing
 *   --concurrency=N      build N apps at once (default 1)
 *
 * A sub-app failure fails the whole run by default: half-published is worse
 * than not-published.
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { readRegistry, writeJsonCache, LAST_BUILD_FILE, ROOT } from "../lib/registry/load.ts";
import { resolvePlan } from "../lib/registry/resolve.ts";
import { SECRETS, loadEnv } from "./lib/credentials.mjs";
import { run } from "./lib/exec.mjs";
import { git } from "./lib/credentials/github.mjs";
import { fingerprintSource, humanBytes, measure } from "./lib/fingerprint.mjs";

loadEnv();

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => {
  const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : null;
};

const options = {
  only: value("only")?.split(",").map((slug) => slug.trim()).filter(Boolean) ?? null,
  skipApps: flag("skip-apps"),
  force: flag("force"),
  allowPartial: flag("allow-partial"),
  keepPublished: flag("keep-published"),
  dryRun: flag("dry-run"),
  concurrency: Math.max(1, Number(value("concurrency") ?? 1) || 1),
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/**
 * Secrets are removed from every child's environment rather than merely not
 * added: this process has them loaded, and a sub-app's bundler would happily
 * inline anything it finds. `run()` treats an `undefined` value as a deletion.
 */
const NO_SECRETS = Object.fromEntries(Object.keys(SECRETS).map((name) => [name, undefined]));

const STAMPS = path.join(ROOT, ".cache", "stamps");
const PUBLISHED_BRANCH = "gh-pages";

const plan = resolvePlan({
  registry: readRegistry(),
  root: ROOT,
  siteUrl,
  basePath,
  only: options.only,
  skipApps: options.skipApps,
  keepPublished: options.keepPublished,
});

// ── Report the plan ──────────────────────────────────────────────────────────

console.log(`\n  Site   ${siteUrl}${basePath || ""}`);
console.log(`  Out    ${path.relative(ROOT, plan.out)}\n`);
for (const verdict of plan.verdicts) {
  const isKept = plan.kept.some((app) => app.slug === verdict.slug);
  const mark = verdict.built ? "build" : verdict.fatal ? "FATAL" : isKept ? "keep" : "skip";
  const why = verdict.fatal ?? verdict.reason ?? "";
  console.log(`  ${mark.padEnd(6)}${verdict.slug.padEnd(14)}${why}`);
}

if (plan.problems.length) {
  console.error("\n  Cannot build:\n");
  for (const problem of plan.problems) console.error(`    ✗ ${problem}`);
  console.error("\n  Set the project to `draft` in the admin panel, or fix the cause.\n");
  process.exit(1);
}

if (options.dryRun) {
  for (const app of plan.apps) {
    console.log(`\n  ${app.slug}`);
    console.log(`    dir      ${path.relative(ROOT, app.dir)}`);
    console.log(`    command  ${app.argv.join(" ")}`);
    console.log(`    env      ${Object.entries(app.env).map(([k, v]) => `${k}=${v}`).join("  ")}`);
    console.log(`    copy     ${path.relative(app.dir, app.outDir)} → ${path.relative(ROOT, app.target)}`);
    console.log(`    url      ${app.url}`);
  }
  for (const app of plan.kept) {
    console.log(`\n  ${app.slug}`);
    console.log(`    keep     ${PUBLISHED_BRANCH}:${app.path} → ${path.relative(ROOT, app.target)}`);
  }
  console.log("\n  Dry run — nothing was built.\n");
  process.exit(0);
}

// ── Build ────────────────────────────────────────────────────────────────────

const startedAt = new Date();
const results = [];

// Before the shell, so the social card always matches content/profile.json.
const og = await run("node", ["scripts/build-og.mjs"], {
  cwd: ROOT,
  env: NO_SECRETS,
  allowFailure: true,
  onLine: (line) => console.log(line),
});
if (og.code !== 0) {
  console.error("\n  Could not render the social card. Nothing was published.\n");
  process.exit(1);
}

const shellStart = Date.now();
console.log("\n  Building the shell …");
const shell = await run("npx", ["next", "build"], {
  cwd: ROOT,
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_BASE_PATH: basePath,
    // `ADMIN=1` turns the export off so the admin routes can be compiled — it is
    // a local debugging switch, and inheriting it here would leave `out/`
    // untouched and publish whatever was in it last time.
    ADMIN: undefined,
    ...NO_SECRETS,
  },
  allowFailure: true,
  onLine: (line) => console.log(`    ${line}`),
});
if (shell.code !== 0) {
  console.error("\n  The shell build failed. Nothing was published.\n");
  process.exit(1);
}
const shellMs = Date.now() - shellStart;

await pool(plan.apps, options.concurrency, buildApp);
if (plan.kept.length) await keepPublished(plan.kept);

const failed = results.filter((result) => result.status === "failed");
if (failed.length && !options.allowPartial) {
  console.error(`\n  ${failed.length} app(s) failed. Nothing was published.\n`);
  await report({ ok: false });
  process.exit(1);
}

await finalize();
await report({ ok: true });

// ── Steps ────────────────────────────────────────────────────────────────────

/**
 * Build one sub-app and copy its output into the tree.
 *
 * The stamp only ever skips the *build*; the copy always runs, because
 * `next build` wipes `out/` at the start of every run and the app's files have
 * to be put back.
 */
async function buildApp(app) {
  const started = Date.now();
  const stamp = path.join(STAMPS, `${app.slug}.json`);
  const fingerprint = fingerprintSource(app.dir);
  const key = JSON.stringify({ fingerprint, env: app.env, argv: app.argv });
  const previous = await readFile(stamp, "utf8").then(JSON.parse, () => null);

  const unchanged =
    !options.force && previous?.key === key && existsSync(app.outDir) && measure(app.outDir).files > 0;

  if (unchanged) {
    console.log(`\n  ${app.slug}: unchanged, reusing ${path.relative(ROOT, app.outDir)}`);
  } else {
    console.log(`\n  ${app.slug}: building …`);
    if (await needsInstall(app.dir)) {
      console.log(`  ${app.slug}: installing dependencies …`);
      const install = await run("npm", ["ci"], {
        cwd: app.dir,
        env: NO_SECRETS,
        allowFailure: true,
        onLine: (line) => console.log(`    ${line}`),
      });
      // `npm ci` needs a lockfile in sync with package.json; `install` is the
      // recovery, not the default, because it can silently move versions.
      if (install.code !== 0) {
        const fallback = await run("npm", ["install"], {
          cwd: app.dir,
          env: NO_SECRETS,
          allowFailure: true,
          onLine: (line) => console.log(`    ${line}`),
        });
        if (fallback.code !== 0) return fail(app, started, "dependency install failed");
      }
    }

    const build = await run(app.argv[0], app.argv.slice(1), {
      cwd: app.dir,
      env: { ...app.env, ...NO_SECRETS },
      allowFailure: true,
      onLine: (line) => console.log(`    ${line}`),
    });
    if (build.code !== 0) return fail(app, started, `${app.argv.join(" ")} exited ${build.code}`);
  }

  if (!existsSync(app.outDir)) {
    return fail(app, started, `${path.relative(app.dir, app.outDir)} does not exist after the build`);
  }

  await rm(app.target, { recursive: true, force: true });
  await mkdir(path.dirname(app.target), { recursive: true });
  await cp(app.outDir, app.target, { recursive: true });

  await mkdir(STAMPS, { recursive: true });
  await writeFile(stamp, `${JSON.stringify({ key, builtAt: new Date().toISOString() }, null, 2)}\n`);

  const size = measure(app.target);
  results.push({
    slug: app.slug,
    status: unchanged ? "reused" : "built",
    url: app.url,
    rev: await revisionOf(app.dir),
    durationMs: Date.now() - started,
    ...size,
  });
  console.log(`  ${app.slug}: ${size.files} files, ${humanBytes(size.bytes)} → ${app.url}`);
}

/**
 * Restore apps this run does not build from the live site, byte for byte.
 *
 * The deploy replaces the published tree wholesale, so an app missing from
 * `out/` is an app taken down. This is what lets one project ship from a
 * machine that does not have every sibling folder checked out.
 */
async function keepPublished(apps) {
  const started = Date.now();
  console.log(`\n  Keeping ${apps.map((app) => app.slug).join(", ")} from the published site …`);

  await git(["fetch", "--quiet", "origin", PUBLISHED_BRANCH], { cwd: ROOT, allowFailure: true });
  const ref = await firstRef([`refs/remotes/origin/${PUBLISHED_BRANCH}`, `refs/heads/${PUBLISHED_BRANCH}`]);
  if (!ref) {
    for (const app of apps) fail(app, started, `nothing to keep: no ${PUBLISHED_BRANCH} branch has been published`);
    return;
  }

  const manifest = await run("git", ["show", `${ref}:apps/manifest.json`], { cwd: ROOT, allowFailure: true });
  const revs = new Map(
    (manifest.code === 0 ? JSON.parse(manifest.stdout).apps ?? [] : []).map((app) => [app.slug, app.rev ?? null]),
  );

  const tarball = path.join(ROOT, ".cache", "keep.tar");
  await mkdir(path.dirname(tarball), { recursive: true });
  for (const app of apps) {
    const archive = await run("git", ["archive", "--format=tar", "-o", tarball, ref, "--", app.path], {
      cwd: ROOT,
      allowFailure: true,
    });
    if (archive.code !== 0) {
      fail(app, started, `${app.path} is not on the published ${PUBLISHED_BRANCH} branch`);
      continue;
    }
    await rm(app.target, { recursive: true, force: true });
    const extract = await run("tar", ["-xf", tarball, "-C", plan.out], { cwd: ROOT, allowFailure: true });
    if (extract.code !== 0) {
      fail(app, started, `could not unpack ${app.path} from ${PUBLISHED_BRANCH}`);
      continue;
    }

    const size = measure(app.target);
    results.push({
      slug: app.slug,
      status: "kept",
      url: app.url,
      rev: revs.get(app.slug) ?? null,
      durationMs: Date.now() - started,
      ...size,
    });
    console.log(`  ${app.slug}: ${size.files} files, ${humanBytes(size.bytes)} kept at ${app.url}`);
  }
  await rm(tarball, { force: true });
}

async function firstRef(refs) {
  for (const ref of refs) {
    const found = await run("git", ["rev-parse", "--verify", "--quiet", ref], { cwd: ROOT, allowFailure: true });
    if (found.code === 0) return ref;
  }
  return null;
}

function fail(app, started, reason) {
  console.error(`  ${app.slug}: ✗ ${reason}`);
  results.push({
    slug: app.slug,
    status: "failed",
    url: app.url,
    reason,
    durationMs: Date.now() - started,
    files: 0,
    bytes: 0,
  });
}

/** Reinstall when `node_modules` is missing or older than the lockfile. */
async function needsInstall(dir) {
  const modules = statSync(path.join(dir, "node_modules"), { throwIfNoEntry: false });
  if (!modules) return true;
  const lock = statSync(path.join(dir, "package-lock.json"), { throwIfNoEntry: false });
  return lock ? lock.mtimeMs > modules.mtimeMs : false;
}

async function revisionOf(dir) {
  const result = await run("git", ["rev-parse", "--short", "HEAD"], { cwd: dir, allowFailure: true });
  return result.code === 0 ? result.stdout : null;
}

/**
 * The three files that are not anybody's build output.
 *
 * `.nojekyll` is the one that silently breaks everything: without it Pages runs
 * Jekyll, which strips directories starting with an underscore — deleting all
 * of `_next/`, i.e. every script and stylesheet on the site (§12.2).
 */
async function finalize() {
  await writeFile(path.join(plan.out, ".nojekyll"), "");

  // Finder litters these into any folder it has been shown, including a
  // project's own `out/`, and `cp` copies them straight into the publish.
  for (const junk of await glob(plan.out, ".DS_Store")) await rm(junk, { force: true });

  const profile = JSON.parse(await readFile(path.join(ROOT, "content", "profile.json"), "utf8"));
  if (profile.domain) await writeFile(path.join(plan.out, "CNAME"), `${profile.domain}\n`);

  const shipped = results.filter((result) => result.status !== "failed");
  if (shipped.length) {
    await mkdir(path.join(plan.out, "apps"), { recursive: true });
    await writeFile(
      path.join(plan.out, "apps", "manifest.json"),
      `${JSON.stringify(
        { builtAt: startedAt.toISOString(), apps: shipped.map(({ slug, url, rev }) => ({ slug, url, rev })) },
        null,
        2,
      )}\n`,
    );
  }
}

async function report({ ok }) {
  const finishedAt = new Date();
  writeJsonCache(LAST_BUILD_FILE, {
    ok,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    siteUrl,
    basePath,
    options,
    shell: { durationMs: shellMs },
    apps: results,
    verdicts: plan.verdicts,
  });

  const total = measure(plan.out);
  console.log(`\n  ${"app".padEnd(14)}${"status".padEnd(10)}${"files".padStart(7)}${"size".padStart(10)}${"time".padStart(8)}`);
  console.log(`  ${"shell".padEnd(14)}${"built".padEnd(10)}${"".padStart(7)}${"".padStart(10)}${`${(shellMs / 1000).toFixed(1)}s`.padStart(8)}`);
  for (const result of results) {
    console.log(
      `  ${result.slug.padEnd(14)}${result.status.padEnd(10)}${String(result.files).padStart(7)}${humanBytes(result.bytes).padStart(10)}${`${(result.durationMs / 1000).toFixed(1)}s`.padStart(8)}`,
    );
  }
  console.log(`\n  ${total.files} files, ${humanBytes(total.bytes)} in ${path.relative(ROOT, plan.out)}`);
  console.log(`  Report → ${path.relative(ROOT, LAST_BUILD_FILE)}\n`);
}

/** Every file with this basename under `dir`. */
async function glob(dir, basename) {
  const found = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of await readdir(current, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === basename) found.push(full);
    }
  }
  return found;
}

/** Run `worker` over `items`, at most `limit` at a time. */
async function pool(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift());
  });
  await Promise.all(runners);
}
