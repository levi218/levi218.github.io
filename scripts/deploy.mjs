#!/usr/bin/env node
/**
 * `npm run deploy` — build everything, prove it is clean, publish it.
 *
 * The publish is a detached `git worktree` on an orphan `gh-pages` branch: no
 * third-party action, no build output in `main`'s history, and no force-push to
 * anything. The commit message records which projects shipped and at which
 * revision, so `git log gh-pages` answers "what is live right now".
 *
 *   --dry-run   build, check, and print the file diff against the published
 *               branch — then stop without committing or pushing
 *   --inject    leave the published site as it is and add only what this run
 *               built: each app's `apps/<slug>/`, its entry in the manifest
 *               and the sitemap, and the `projects/` pages that list it. For
 *               shipping a project from a checkout that cannot rebuild the
 *               rest of the site faithfully (e.g. posts that only exist on
 *               another machine). Pair it with `--only <slug>`.
 *
 * Anything else is forwarded to `build-site.mjs` (`--only`, `--force`, …).
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { LAST_BUILD_FILE, ROOT } from "../lib/registry/load.ts";
import { loadEnv } from "./lib/credentials.mjs";
import { git } from "./lib/credentials/github.mjs";
import { run } from "./lib/exec.mjs";

loadEnv();

const BRANCH = "gh-pages";
const WORKTREE = path.join(ROOT, ".cache", "gh-pages");
const OUT = path.join(ROOT, "out");

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const inject = argv.includes("--inject");
const buildArgs = argv.filter((arg) => arg !== "--dry-run" && arg !== "--inject");
// `--inject` publishes nothing but the apps it built, so the build itself must
// not fail on — or drop — the apps it is leaving alone.
if (inject && !buildArgs.includes("--keep-published")) buildArgs.push("--keep-published");

const local = (args, options = {}) => run("git", args, { cwd: ROOT, ...options });

// ── Preconditions ────────────────────────────────────────────────────────────

if ((await local(["rev-parse", "--git-dir"], { allowFailure: true })).code !== 0) {
  die(
    "This is not a git repository yet.\n\n" +
      "    git init && git add -A && git commit -m 'Initial commit'\n" +
      "    git branch -M main\n" +
      "    git remote add origin git@github.com:<user>/<user>.github.io.git\n" +
      "    git push -u origin main\n\n" +
      "  See §12 of IMPLEMENTATION_PLAN.md.",
  );
}

const remote = await local(["remote", "get-url", "origin"], { allowFailure: true });
if (remote.code !== 0) die("No `origin` remote. Add one, then deploy — see §12.1 of the plan.");

// ── Build, then prove the export is publishable ──────────────────────────────

await step("Building", "node", ["scripts/build-site.mjs", ...buildArgs]);
await step("Checking the export", "node", ["scripts/check-export.mjs"]);
await step("Checking the links", "node", ["scripts/check-links.mjs"]);

// ── Stage into a detached worktree ───────────────────────────────────────────

await rm(WORKTREE, { recursive: true, force: true });
await local(["worktree", "prune"], { allowFailure: true });

// Prefer the published branch as it exists on the remote; fall back to a local
// one, and to an orphan when nothing has ever been published.
await local(["fetch", "origin", `${BRANCH}:${BRANCH}`], { allowFailure: true });
const known = (await local(["rev-parse", "--verify", BRANCH], { allowFailure: true })).code === 0;

await mkdir(path.dirname(WORKTREE), { recursive: true });
if (known) {
  await local(["worktree", "add", WORKTREE, BRANCH]);
} else {
  await local(["worktree", "add", "--detach", WORKTREE]);
  await run("git", ["checkout", "--orphan", BRANCH], { cwd: WORKTREE });
  await run("git", ["rm", "-rf", "--quiet", "."], { cwd: WORKTREE, allowFailure: true });
}

if (inject) {
  await injectInto(WORKTREE);
  // The staged tree is a mix of two builds, so it is checked again as a whole.
  const staged = path.relative(ROOT, WORKTREE);
  await step("Checking the injected tree", "node", ["scripts/check-export.mjs", staged], cleanup);
  await step("Checking the injected links", "node", ["scripts/check-links.mjs", staged], cleanup);
} else {
  // Replace the tree wholesale: a deleted page must disappear from the site, and
  // the only thing in here that is not build output is git's own bookkeeping.
  for (const entry of await readdir(WORKTREE)) {
    if (entry !== ".git") await rm(path.join(WORKTREE, entry), { recursive: true, force: true });
  }
  await cp(OUT, WORKTREE, { recursive: true });
}

await run("git", ["add", "-A"], { cwd: WORKTREE });
const staged = await run("git", ["status", "--porcelain"], { cwd: WORKTREE });

if (dryRun) {
  console.log(staged.stdout ? `\n${staged.stdout}\n` : "\n  No change against the published branch.\n");
  console.log("  Dry run — nothing was pushed.\n");
  await cleanup();
  process.exit(0);
}

if (!staged.stdout) {
  console.log("\n  The published branch is already identical. Nothing to do.\n");
  await cleanup();
  process.exit(0);
}

// ── Commit and push ──────────────────────────────────────────────────────────

await run("git", ["commit", "--quiet", "-m", await message()], { cwd: WORKTREE });
const push = await git(["-C", WORKTREE, "push", "origin", BRANCH], { allowFailure: true });
await cleanup();

if (push.code !== 0) {
  console.error(`\n${push.stderr}\n`);
  die(`Push failed. The build is still in ${path.relative(ROOT, OUT)}; fix the remote and retry.`);
}

const url = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
console.log(`\n  Published to ${BRANCH}. ${url || "The site"} updates in about a minute.`);
console.log("  If this is the first deploy: Settings → Pages → Deploy from a branch →");
console.log(`  ${BRANCH} / (root).\n`);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The commit message names what shipped and at which revision, which is what
 * makes `git log gh-pages --oneline -1` a usable answer to "what is live?".
 */
async function message() {
  const report = await readFile(LAST_BUILD_FILE, "utf8").then(JSON.parse, () => null);
  // An inject ships only what it built; anything kept is already on the branch.
  const apps = (report?.apps ?? [])
    .filter((app) => app.status !== "failed" && !(inject && app.status === "kept"))
    .map((app) => `  ${app.slug}${app.rev ? `@${app.rev}` : ""} — ${app.url}`);
  const head = (await local(["rev-parse", "--short", "HEAD"], { allowFailure: true })).stdout;
  return [
    `${inject ? "Inject" : "Deploy"} ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    "",
    `${inject ? "projects/ from shell" : "shell"}${head ? `@${head}` : ""}`,
    ...apps,
  ].join("\n");
}

/**
 * `--inject`: overlay this run's apps onto the published tree, touching nothing
 * else a visitor reads.
 *
 * The new `projects/` pages reference this build's `_next/` assets, so those
 * are added alongside the published ones — never in place of them, because
 * every page left as it was still loads its own. Next falls back to a full
 * page load when it navigates between pages of two different builds.
 */
async function injectInto(tree) {
  const report = await readFile(LAST_BUILD_FILE, "utf8").then(JSON.parse);
  const built = report.apps.filter((app) => app.status === "built" || app.status === "reused");
  if (!built.length) die("--inject: this run built no app, so there is nothing to inject.");

  for (const app of built) {
    const rel = app.url.replace(/^\/+|\/+$/g, "").split("/").slice(-2).join("/"); // apps/<slug>
    await rm(path.join(tree, rel), { recursive: true, force: true });
    await cp(path.join(OUT, rel), path.join(tree, rel), { recursive: true });
  }

  await cp(path.join(OUT, "_next"), path.join(tree, "_next"), { recursive: true, force: false });
  await rm(path.join(tree, "projects"), { recursive: true, force: true });
  await cp(path.join(OUT, "projects"), path.join(tree, "projects"), { recursive: true });

  // Manifest and sitemap: the published entries, plus this run's.
  const manifestFile = path.join(tree, "apps", "manifest.json");
  const manifest = await readFile(manifestFile, "utf8").then(JSON.parse, () => ({ apps: [] }));
  const fresh = new Set(built.map((app) => app.slug));
  manifest.builtAt = report.startedAt;
  manifest.apps = [
    ...manifest.apps.filter((app) => !fresh.has(app.slug)),
    ...built.map(({ slug, url, rev }) => ({ slug, url, rev })),
  ];
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const sitemapFile = path.join(tree, "sitemap.xml");
  const published = await readFile(sitemapFile, "utf8").catch(() => null);
  const ours = await readFile(path.join(OUT, "sitemap.xml"), "utf8").catch(() => null);
  if (published && ours) {
    const entries = (xml) => xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    const loc = (entry) => /<loc>([^<]*)<\/loc>/.exec(entry)?.[1];
    const known = new Set(entries(published).map(loc));
    const added = entries(ours).filter((entry) => !known.has(loc(entry)));
    if (added.length) {
      await writeFile(sitemapFile, published.replace("</urlset>", `${added.join("\n")}\n</urlset>`));
    }
  }

  console.log(`\n  Injected ${built.map((app) => app.slug).join(", ")} and projects/ into the published tree.`);
}

async function step(label, command, args, onFailure) {
  console.log(`\n  ${label} …`);
  const result = await run(command, args, {
    cwd: ROOT,
    allowFailure: true,
    onLine: (line) => console.log(`  ${line}`),
  });
  if (result.code !== 0) {
    await onFailure?.();
    die(`${label} failed. Nothing was published.`);
  }
}

async function cleanup() {
  if (existsSync(WORKTREE)) {
    await local(["worktree", "remove", "--force", WORKTREE], { allowFailure: true });
    await rm(WORKTREE, { recursive: true, force: true });
  }
}

function die(reason) {
  console.error(`\n  ${reason}\n`);
  process.exit(1);
}
