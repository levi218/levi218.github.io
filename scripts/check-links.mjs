#!/usr/bin/env node
/**
 * Post-build assertion: the site's own promises are kept.
 *
 * The registry says a project answers at `/apps/<slug>/`. This checks the file
 * is actually there — a copy that silently produced an empty directory, or an
 * `outDir` that pointed at the wrong place, is otherwise a 404 discovered by a
 * visitor rather than by the build.
 *
 * Runs after `check-export.mjs` in `deploy.mjs`. Both must pass before a push.
 */

import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { ROOT, readRegistry } from "../lib/registry/load.ts";
import { listedProjects, resolvePlan } from "../lib/registry/resolve.ts";
import { loadEnv } from "./lib/credentials.mjs";

loadEnv();

const OUT = path.join(ROOT, process.argv[2] ?? "out");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const registry = readRegistry();
// `keepPublished`: an app whose folder is not on this machine may have been
// carried over from the live site — the index.html check below is what
// decides whether its card still leads somewhere.
const plan = resolvePlan({ registry, root: ROOT, siteUrl, basePath, keepPublished: true });
const failures = [];
const checks = [];

const isFile = (file) => statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;

/** The shell's own pages. If these are missing, nothing else matters. */
for (const page of ["index.html", "404.html", path.join("projects", "index.html")]) {
  const file = path.join(OUT, page);
  if (isFile(file)) checks.push(page);
  else failures.push(`${page} is missing from the export`);
}

// Every published sub-path project must have an entry point where its card says.
for (const project of listedProjects(registry)) {
  if (project.deploy.mode !== "subpath") continue;
  const index = path.join(OUT, project.deploy.path, "index.html");
  if (!isFile(index)) {
    failures.push(
      `${project.slug}: no index.html at ${project.deploy.path}/ — the "Open" link would 404`,
    );
    continue;
  }
  checks.push(`${project.deploy.path}/`);

  // A sub-app whose assets resolve against the domain root loads blank. This is
  // the cheapest evidence that the base path was injected, not merely copied.
  const html = readFileSync(index, "utf8");
  const expected = `${basePath}/${project.deploy.path}/_next/`;
  if (html.includes("/_next/") && !html.includes(expected)) {
    failures.push(
      `${project.slug}: assets point outside ${expected} — NEXT_PUBLIC_BASE_PATH did not reach the build`,
    );
  }
}

// `.nojekyll` is the one whose absence is invisible until the live site renders
// unstyled: Jekyll strips every directory beginning with an underscore.
if (isFile(path.join(OUT, ".nojekyll"))) checks.push(".nojekyll");
else failures.push(".nojekyll is missing — Pages would delete every _next/ asset");

// External links are schema-validated URLs, but a placeholder host is a link
// that 404s for a visitor, which no amount of URL parsing catches.
for (const project of listedProjects(registry)) {
  for (const [kind, url] of Object.entries(project.links)) {
    if (!url) continue;
    if (/your-name|example\.com|<user>/.test(url)) {
      failures.push(`${project.slug}: links.${kind} is still a placeholder — ${url}`);
    }
  }
}

// A published project the plan refuses to build is a card linking to nothing.
for (const problem of plan.problems) failures.push(problem);

if (failures.length) {
  console.error(`\ncheck-links: ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error("");
  process.exit(1);
}

console.log(`check-links: ${checks.length} path(s) verified — ${checks.join(", ")}`);
